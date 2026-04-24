import test from 'node:test';
import assert from 'node:assert';
import { writeArtifact } from '../src/artifacts.js';
import { existsSync } from 'node:fs';

test('Artifacts are written to disk', async () => {
  const path = await writeArtifact('test-output', { ok: true });
  assert.ok(existsSync(path));
});
