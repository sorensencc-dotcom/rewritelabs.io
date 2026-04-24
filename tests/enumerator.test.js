import test from 'node:test';
import assert from 'node:assert';
import { runEnumerator } from '../src/enumerator.js';

test('Enumerator returns results', async () => {
  const results = await runEnumerator();
  assert.ok(Array.isArray(results));
  assert.ok(results.length > 0);
});
