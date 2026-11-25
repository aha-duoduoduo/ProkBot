import { recordRouting, taskPreview } from './routing-log.mjs';
import { createHash } from 'node:crypto';
import { TIERS, reasoningOptions, validatePolicy } from './model-policy.mjs';
import { recordUsage } from './usage-ledger.mjs';
import { contextPolicyFor } from './context-policy.mjs';
import { modelRouteForAgent } from './model-routing.mjs';
import { CLASSIFICATION_REVISION, classificationState, difficultyQuestion } from './model-classification.mjs';
export { classificationState } from './model-classification.mjs';

const effortCriteria = {
  none: 'No deliberate reasoning is needed.', minimal: 'Only a brief check is needed.', low: 'Quick, straightforward reasoning is enough.',
  medium: 'Several dependent reasoning steps are needed.', high: 'Substantial analysis or difficult debugging is needed.',
  xhigh: 'Very challenging reasoning across interacting constraints is needed.',
  max: 'Exceptionally difficult research, proofs or novel algorithmic reasoning justifies maximum effort.',
};
/**
 * Ask Jev for the task tier and, for each entry of `automatic` ({ id, model, efforts }), the lowest
 * sufficient effort. Efforts are returned by entry ID. A legacy policy supplies its models instead.
 */
export async function classifyTask({ apiKey, model = 'jev-latest', state, policy, automatic: requested, signal, fetchImpl = fetch }) {
  const questions = { difficulty: difficultyQuestion };
  const automatic = (requested ?? policy.models.filter(item =>
    Object.values(policy.routes).some(route => route.model === item.id && route.effort === 'auto'))
    .map(item => ({ id: item.id, model: item.id, efforts: item.efforts })))
    .filter(item => item.efforts.length > 1);
  automatic.forEach((item, index) => { questions[`effort_${index}`] = { type: 'choice',
    instructions: `Choose the minimum sufficient reasoning effort for ${item.model} to solve the latest user task. Use only the offered levels.`,
    criteria: Object.fromEntries(item.efforts.map(effort => [effort, effortCriteria[effort]])) }; });
  const response = await fetchImpl('https://api.typesafe.ai/v1/systemone', {
    method: 'POST', redirect: 'error',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
    body: JSON.stringify({ model, state, questions }),
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error(`Jev HTTP ${response.status}`); }
  const data = await response.json(), answer = data.answers?.difficulty;
  if (!TIERS.includes(answer?.choice)) throw new Error('Invalid Jev difficulty');
  const efforts = Object.fromEntries(automatic.map((item, index) => {
    const choice = data.answers?.[`effort_${index}`]?.choice;
    if (!item.efforts.includes(choice)) throw new Error('Invalid Jev effort');
    return [item.id, choice];
  }));
  return { difficulty: answer.choice, confidence: answer.confidence, efforts, model: data.model ?? model, usage: data.usage };
}
/** The old rule when Jev cannot pick an effort: prefer high, otherwise the strongest offered level. */
function fallbackEffort(efforts) {
  return efforts.includes('high') ? 'high' : efforts.at(-1) ?? 'default';
}

function requestFor(candidate, effort) {
  const { tiers, fallbacks, classifierModel, ...rest } = candidate;
  return { ...rest, effort, requestOptions: reasoningOptions(candidate.model, effort) };
}

function classificationKey(state) {
  return createHash('sha256').update(JSON.stringify(state)).digest('hex');
}

function jevRouter(config, route, fallbacks, { fetchImpl, onDecision, agentId }) {
  const { tiers } = route;
  // One effort question per tier that leaves the effort to Jev, answered by tier name.
  const automatic = TIERS.filter(tier => tiers[tier].effort === 'auto')
    .map(tier => ({ id: tier, model: tiers[tier].model, efforts: tiers[tier].efforts }));
  let cachedKey, cachedDecision;
  return async ({ messages, signal }) => {
    signal?.throwIfAborted();
    const state = classificationState(messages), key = classificationKey(state);
    if (cachedKey === key) return cachedDecision;
    const started = performance.now();
    let result, fallback = false, errorReason;
    try {
      if (!config.jevApiKey) throw new Error('Jev API Key is not configured');
      result = await classifyTask({ apiKey: config.jevApiKey, model: route.classifierModel, state, automatic, signal, fetchImpl });
      try { await recordUsage(config.usageDirectory, { raw: result.usage, model: result.model, kind: 'classifier' }); }
      catch (error) { console.warn('[usage] Unable to record classifier usage:', error.code ?? error.name); }
    } catch (error) {
      signal?.throwIfAborted(); fallback = true;
      result = { difficulty: 'reasoning', efforts: {} };
      errorReason = String(error.message).replaceAll(config.jevApiKey || '\0', '[redacted]').slice(0, 160);
      console.warn(`[model-router] Classifier unavailable (${errorReason}); using the primary model.`);
    }
    const chosen = tiers[result.difficulty];
    const effort = chosen.effort === 'auto' ? result.efforts[result.difficulty] ?? fallbackEffort(chosen.efforts) : chosen.effort;
    const decision = { model: chosen.model, profileId: chosen.profileId, profileName: chosen.profileName, effort,
      difficulty: result.difficulty, confidence: result.confidence, fallback };
    try {
      await recordRouting(config.routingDirectory, { ...decision, agentId, routeSource: route.routeSource,
        status: fallback ? 'fallback' : 'classified', classifierModel: result.model ?? route.classifierModel,
        classifierRevision: CLASSIFICATION_REVISION,
        elapsedMs: Math.round(performance.now() - started), task: taskPreview(state),
        effortSource: chosen.effort === 'auto' ? (fallback ? 'fallback' : result.efforts[result.difficulty] ? 'jev' : 'model') : 'rule',
        source: config.routingSource ?? 'task', error: errorReason });
      await onDecision(decision);
    } catch (error) { console.warn('[model-router] Unable to save routing log:', error.code ?? error.name); }
    // A backup that repeats the chosen profile would only resend the failed request.
    const selected = { ...requestFor(chosen, effort), difficulty: result.difficulty, confidence: result.confidence, fallback,
      fallbacks: fallbacks.filter(item => item.profileId !== chosen.profileId) };
    // Retry classification on a future request after an outage, but reuse successful decisions within the task.
    if (!fallback) { cachedKey = key; cachedDecision = selected; }
    return selected;
  };
}

/**
 * Select the model request for one turn. A route with Jev tiers classifies each new task unless
 * `classify` is false (summaries), which uses the primary model without waiting for Jev.
 */
export function createModelRouter(config, { fetchImpl = fetch, onDecision = () => {}, agentId, classify = true } = {}) {
  if (config.modelRouting) {
    const route = modelRouteForAgent(config.modelRouting, agentId);
    const fallbacks = route.fallbacks.map(item => requestFor(item, item.effort));
    if (route.tiers && classify) return jevRouter(config, route, fallbacks, { fetchImpl, onDecision, agentId });
    const selected = { ...requestFor(route, route.effort === 'auto' ? 'default' : route.effort), fallbacks };
    return async ({ signal } = {}) => {
      signal?.throwIfAborted();
      return selected;
    };
  }
  const policy = validatePolicy(config.policy, config.model);
  let cachedKey, cachedDecision;
  return async ({ messages, signal }) => {
    signal?.throwIfAborted();
    if (policy.mode !== 'adaptive') return { model: config.model, effort: policy.effort,
      ...contextPolicyFor(config, config.model), requestOptions: reasoningOptions(config.model, policy.effort) };
    const state = classificationState(messages), key = classificationKey(state);
    if (cachedKey === key) return cachedDecision;
    const started = performance.now();
    let result, fallback = false, errorReason;
    try {
      result = await classifyTask({ apiKey: config.jevApiKey, model: policy.classifierModel, policy, state, signal, fetchImpl });
      try { await recordUsage(config.usageDirectory, { raw: result.usage, model: result.model, kind: 'classifier' }); }
      catch (error) { console.warn('[usage] Unable to record classifier usage:', error.code ?? error.name); }
    } catch (error) {
      signal?.throwIfAborted(); fallback = true;
      result = { difficulty: 'reasoning', efforts: {} };
      const reason = errorReason = String(error.message).replaceAll(config.jevApiKey || '\0', '[redacted]').slice(0, 160);
      console.warn(`[model-router] Classifier unavailable (${reason}); using the medium task rule.`);
    }
    const route = policy.routes[result.difficulty], levels = policy.models.find(item => item.id === route.model).efforts;
    const effort = route.effort === 'auto' ? result.efforts[route.model] ??
      fallbackEffort(levels) : route.effort;
    const decision = { model: route.model, effort, difficulty: result.difficulty, confidence: result.confidence, fallback };
    try {
      await recordRouting(config.routingDirectory, { ...decision, status: fallback ? 'fallback' : 'classified',
        classifierModel: result.model ?? policy.classifierModel, classifierRevision: CLASSIFICATION_REVISION, elapsedMs: Math.round(performance.now() - started),
        task: taskPreview(state), effortSource: route.effort === 'auto' ? (fallback ? 'fallback' : result.efforts[route.model] ? 'jev' : 'model') : 'rule',
        source: config.routingSource ?? 'task', error: errorReason });
      await onDecision(decision);
    } catch (error) { console.warn('[model-router] Unable to save routing log:', error.code ?? error.name); }
    const selected = { ...decision, ...contextPolicyFor(config, route.model), requestOptions: reasoningOptions(route.model, effort) };
    // Retry classification on a future request after an outage, but reuse successful decisions within the task.
    if (!fallback) { cachedKey = key; cachedDecision = selected; }
    return selected;
  };
}
