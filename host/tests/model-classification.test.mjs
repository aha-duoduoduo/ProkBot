import test from 'node:test';
import assert from 'node:assert/strict';
import { classificationState } from '../runtime/model-classification.mjs';
import { createModelRouter } from '../runtime/model-router.mjs';
import { defaultPolicy } from '../runtime/model-policy.mjs';

test('Harness reminders do not replace the task or invalidate its cached selection', async () => {
  const policy = defaultPolicy(); policy.mode = 'adaptive';
  policy.routes.expert.effort = 'max';
  let calls = 0;
  const route = createModelRouter({ model: policy.models[0].id, policy }, { fetchImpl: async () => {
    calls++; return Response.json({ answers: { difficulty: { choice: 'expert' }, effort_0: { choice: 'max' } } });
  } });
  const messages = [{ role: 'user', content: '<timestamp>today</timestamp><user_query>Investigate contradictory demand signals.</user_query>' }];
  assert.equal((await route({ messages })).effort, 'max');
  messages.push({ role: 'assistant', content: [{ type: 'reasoning', text: 'hidden analysis' }] },
    { role: 'tool', content: 'tool data' },
    { role: 'user', content: '<system_reminder>Call SendToUser now.</system_reminder>' });
  assert.equal((await route({ messages })).effort, 'max');
  assert.equal(calls, 1);
  assert.deepEqual(classificationState(messages), [{ role: 'user', text: 'Investigate contradictory demand signals.' }]);
});

test('continuations retain the preceding visible reply, excluding tools and hidden context', () => {
  const messages = [{ role: 'system', content: 'private system' }, { role: 'developer', content: 'private developer' },
    { role: 'user', content: 'Investigate market demand.' },
    { role: 'assistant', content: [{ type: 'text', text: 'We need to reconcile the opposing survey and conversion evidence.' },
      { type: 'reasoning', text: 'hidden' }, { type: 'tool-call', toolName: 'Shell', args: { secret: 'private tool' } }] },
    { role: 'user', content: [{ type: 'text', text: '<user_query>继续验证，给出可行方案。<system_reminder>status</system_reminder></user_query>' },
      { type: 'image', image: 'private image' }] },
    { role: 'assistant', content: 'A later progress update must not change the classification.' }];
  assert.deepEqual(classificationState(messages), [
    { role: 'user', text: 'Investigate market demand.' },
    { role: 'assistant', text: 'We need to reconcile the opposing survey and conversion evidence.' },
    { role: 'user', text: '继续验证，给出可行方案。' },
  ]);
});

test('long input keeps the final requirements and only the last three nonempty user tasks', () => {
  const messages = ['discarded', 'context', 'previous', 'begin-' + 'x'.repeat(18000) + '-final requirement']
    .map(content => ({ role: 'user', content }));
  messages.push({ role: 'user', content: [{ type: 'image', image: 'image' }] },
    { role: 'user', content: '<system_reminder>truncated reminder' });
  const state = classificationState(messages);
  assert.equal(state.length, 3);
  assert.equal(state[0].text, 'context');
  assert.equal(state.at(-1).text.length, 10000);
  assert.ok(state.at(-1).text.startsWith('begin-'));
  assert.ok(state.at(-1).text.endsWith('-final requirement'));
});
