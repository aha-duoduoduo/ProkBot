import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInference } from '../runtime/host-extensions.mjs';
import { createModelRouter } from '../runtime/model-router.mjs';
import { defaultPolicy } from '../runtime/model-policy.mjs';
import { legacyModelRouting, modelRouteForAgent, publicModelRouting, validateModelRouting } from '../runtime/model-routing.mjs';
import { recentRouting } from '../runtime/routing-log.mjs';
import { Models } from '../server/models.mjs';

const routing = () => ({
  version: 1,
  providers: [
    { id: 'main', name: 'Main', apiFormat: 'openai', baseUrl: 'https://main.example/v1', apiKey: 'test-main-key' },
    { id: 'other', name: 'Other', apiFormat: 'anthropic', baseUrl: 'https://other.example', apiKey: 'test-other-key' },
  ],
  profiles: [
    { id: 'flash', name: 'Flash', providerId: 'main', model: 'flash', efforts: ['none', 'low', 'high'], contextWindowTokens: 128_000, summaryThresholdTokens: 96_000 },
    { id: 'pro', name: 'Pro', providerId: 'main', model: 'pro', efforts: ['low', 'high', 'max'], contextWindowTokens: 64_000, summaryThresholdTokens: 48_000 },
    { id: 'deep', name: 'Deep', providerId: 'other', model: 'deep', efforts: ['high', 'max'], contextWindowTokens: 200_000, summaryThresholdTokens: 150_000 },
  ],
  defaultRoute: { profileId: 'pro', effort: 'auto', fallbacks: [{ profileId: 'deep', effort: 'high' }],
    tiers: { routine: { profileId: 'flash', effort: 'none' }, expert: { profileId: 'deep', effort: 'auto' } } },
  botRoutes: { plain_bot: { profileId: 'flash', effort: 'low', fallbacks: [] } },
});

const jevReply = (difficulty, efforts = {}) => async (url, options) => {
  assert.equal(url, 'https://api.typesafe.ai/v1/systemone');
  assert.equal(options.headers.authorization, 'Bearer test-jev-key');
  const { questions } = JSON.parse(options.body);
  const answers = { difficulty: { choice: difficulty, confidence: 0.9 } };
  // Answer each effort question by the model it names.
  for (const [key, question] of Object.entries(questions)) if (key.startsWith('effort_')) {
    const model = question.instructions.match(/effort for (\S+) to/)[1];
    answers[key] = { choice: efforts[model] };
  }
  return Response.json({ model: 'jev-latest', answers });
};

async function directory(t) {
  const path = await mkdtemp(join(tmpdir(), 'jev-routing-'));
  t.after(() => rm(path, { recursive: true, force: true }));
  return path;
}

test('Jev tiers are validated with their profiles and only Jev routes may leave the effort to Jev', () => {
  const config = validateModelRouting(routing());
  assert.deepEqual(publicModelRouting(config).defaultRoute.tiers,
    { routine: { profileId: 'flash', effort: 'none' }, expert: { profileId: 'deep', effort: 'auto' } });
  const plainAuto = routing();
  plainAuto.botRoutes.plain_bot.effort = 'auto';
  assert.throws(() => validateModelRouting(plainAuto), /Unsupported effort for flash/);
  const unknown = routing();
  unknown.defaultRoute.tiers.expert.profileId = 'missing';
  assert.throws(() => validateModelRouting(unknown), /Unknown profile: missing/);
  const missingTier = routing();
  delete missingTier.defaultRoute.tiers.routine;
  assert.throws(() => validateModelRouting(missingTier), /routine tier/);
});

test('a Jev route resolves all three tiers and compacts for the smallest reachable window', () => {
  const route = modelRouteForAgent(validateModelRouting(routing()));
  assert.deepEqual([route.tiers.routine.model, route.tiers.reasoning.model, route.tiers.expert.model], ['flash', 'pro', 'deep']);
  assert.equal(route.classifierModel, 'jev-latest');
  assert.equal(route.contextWindowTokens, 64_000);
  assert.equal(modelRouteForAgent(validateModelRouting(routing()), 'plain_bot').tiers, undefined);
});

test('Jev chooses the tier and the effort, and a backup never repeats the chosen profile', async t => {
  const data = await directory(t);
  let calls = 0;
  const router = createModelRouter({ modelRouting: validateModelRouting(routing()), jevApiKey: 'test-jev-key',
    usageDirectory: join(data, 'usage'), routingDirectory: join(data, 'routing') }, {
    agentId: 'research_bot', fetchImpl: async (...args) => { calls++; return jevReply('expert', { deep: 'max', pro: 'high' })(...args); },
  });
  const messages = [{ role: 'user', content: 'Prove the scheduler cannot deadlock.' }];
  const selected = await router({ messages });
  assert.deepEqual([selected.model, selected.effort, selected.difficulty], ['deep', 'max', 'expert']);
  assert.equal(selected.apiFormat, 'anthropic');
  assert.deepEqual(selected.fallbacks, []);
  assert.equal(selected.tiers, undefined);
  assert.equal(await router({ messages }), selected);
  assert.equal(calls, 1);
  const [entry] = await recentRouting(join(data, 'routing'));
  assert.equal(entry.agentId, 'research_bot');
  assert.equal(entry.profileId, 'deep');
  assert.equal(entry.effortSource, 'jev');
});

test('Host inference sends chat turns to the Jev tier and summaries to the primary model', async t => {
  const data = await directory(t);
  const realFetch = globalThis.fetch;
  globalThis.fetch = jevReply('routine', { pro: 'low', deep: 'high' });
  t.after(() => { globalThis.fetch = realFetch; });
  class HarnessError extends Error {}
  const library = { PrivacyMode: { NO_STORAGE: 'no-storage' }, ConnectError: HarnessError, ActionRequiredError: HarnessError,
    NonRetriableError: HarnessError, Code: { ResourceExhausted: 8, Unavailable: 14, Internal: 13 } };
  const requests = [];
  const config = { modelRouting: validateModelRouting(routing()), jevApiKey: 'test-jev-key', policy: defaultPolicy('pro'),
    usageDirectory: join(data, 'usage'), routingDirectory: join(data, 'routing') };
  const inference = createInference(config, library, {}, { fetchImpl: async (url, options) => {
    const body = JSON.parse(options.body);
    requests.push([body.model, body.reasoning_effort ?? 'default']);
    return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content: 'OK' }, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`);
  } });
  for (const options of [{}, { isSummarizationSession: true }]) {
    const result = inference.port.createSession(() => {}, options)
      .getExecutor([{ role: 'user', content: 'Translate hello.' }]).stream({}, 'jev-entry', []);
    await Array.fromAsync(result.fullStream);
    await result.response;
  }
  assert.deepEqual(requests, [['flash', 'none'], ['pro', 'default']]);
});

test('without Jev the route uses its primary model and never sends an automatic effort', async t => {
  const data = await directory(t);
  const config = { modelRouting: validateModelRouting(routing()), jevApiKey: '',
    usageDirectory: join(data, 'usage'), routingDirectory: join(data, 'routing') };
  const failed = await createModelRouter(config, { fetchImpl: async () => assert.fail('Jev must not be called') })(
    { messages: [{ role: 'user', content: 'Hello' }] });
  assert.deepEqual([failed.model, failed.effort, failed.fallback], ['pro', 'high', true]);
  assert.deepEqual(failed.fallbacks.map(item => item.model), ['deep']);
  const summary = await createModelRouter({ ...config, jevApiKey: 'test-jev-key' },
    { classify: false, fetchImpl: async () => assert.fail('Summaries do not wait for Jev') })({ messages: [] });
  assert.deepEqual([summary.model, summary.effort], ['pro', 'default']);
});

test('an old Jev policy converts with every tier model and effort intact', () => {
  const policy = defaultPolicy('flash');
  policy.mode = 'adaptive';
  policy.models = [{ id: 'flash', efforts: ['none', 'low'] }, { id: 'pro', efforts: ['low', 'high'], contextWindowTokens: 64_000 }];
  policy.routes = { routine: { model: 'flash', effort: 'none' }, reasoning: { model: 'pro', effort: 'auto' }, expert: { model: 'pro', effort: 'high' } };
  const config = validateModelRouting(legacyModelRouting({ apiFormat: 'openai', baseUrl: 'https://legacy.example/v1',
    apiKey: 'test-legacy-key', model: 'flash', contextWindowTokens: 32_000, policy }));
  const route = modelRouteForAgent(config);
  assert.deepEqual(Object.fromEntries(Object.entries(route.tiers).map(([tier, item]) => [tier, [item.model, item.effort]])),
    { routine: ['flash', 'none'], reasoning: ['pro', 'auto'], expert: ['pro', 'high'] });
  assert.deepEqual(config.profiles.map(item => [item.model, item.contextWindowTokens]), [['flash', 32_000], ['pro', 64_000]]);
});

test('saving a Jev route needs a Jev key and a migrated old Jev configuration keeps its tiers', async t => {
  const data = await directory(t);
  const models = new Models(data);
  await assert.rejects(models.save({ ...routing(), migrateLegacyRouting: true }), { status: 400, message: /Jev API Key/ });
  const policy = defaultPolicy('flash');
  policy.mode = 'adaptive';
  policy.models = [{ id: 'flash', efforts: ['none', 'low'] }, { id: 'pro', efforts: ['low', 'high'] }];
  policy.routes = { routine: { model: 'flash', effort: 'none' }, reasoning: { model: 'flash', effort: 'low' }, expert: { model: 'pro', effort: 'auto' } };
  await models.save({ apiFormat: 'openai', baseUrl: 'https://legacy.example/v1', apiKey: 'test-legacy-key', model: 'flash',
    policy, jevApiKey: 'test-jev-key' });
  const draft = await models.publicConfig();
  assert.equal(draft.legacyAdaptiveRouting, true);
  const { providers, profiles, defaultRoute, botRoutes } = draft;
  const saved = await models.save({ version: 1, migrateLegacyRouting: true, providers: providers.map(({ hasApiKey, ...item }) => item),
    profiles, defaultRoute, botRoutes });
  assert.deepEqual(saved.defaultRoute.tiers.expert, { profileId: 'jev-model-1', effort: 'auto' });
  assert.match(await readFile(join(data, 'model.env'), 'utf8'), /^JEV_API_KEY=test-jev-key$/m);
  const classified = await new Models(data).current();
  assert.equal(modelRouteForAgent(classified.routing).tiers.expert.model, 'pro');
});
