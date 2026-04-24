import test from 'node:test';
import assert from 'node:assert';
import { runPipeline } from '../src/pipeline.js';

test('Pipeline handles errors gracefully', async () => {
  const result = await runPipeline({ forceError: true });
  assert.ok(result.errorHandled === true);
});
