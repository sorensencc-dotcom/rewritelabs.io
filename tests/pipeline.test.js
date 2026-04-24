import test from 'node:test';
import assert from 'node:assert';
import { runPipeline } from '../src/pipeline.js';

test('Pipeline runs end-to-end', async () => {
  const result = await runPipeline();
  assert.ok(result.success === true);
});
