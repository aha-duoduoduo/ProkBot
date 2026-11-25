import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

// The checks read the generated recipes of the Host release tree.
const skip = !existsSync(new URL('../recipes/host/manifest.json', import.meta.url)) && 'needs the Host release tree from release/build-host.py';

test('pinned Host patches reuse immutable inputs and verify every output', { skip }, () => {
  const run = spawnSync(process.platform === 'win32' ? 'python' : 'python3',
    [fileURLToPath(new URL('bytepatch_checks.py', import.meta.url))], { encoding: 'utf8' });
  assert.ifError(run.error);
  assert.equal(run.status, 0, run.stderr || run.stdout);
});
