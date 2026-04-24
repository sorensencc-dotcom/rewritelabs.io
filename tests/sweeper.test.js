import test from 'node:test';
import assert from 'node:assert';
import { sweep } from '../src/sweeper.js';

test('Sweeper normalizes enumerator output', async () => {
  const input = [{ url: 'http://example.com', score: 1 }];
  const out = await sweep(input);
  assert.ok(out[0].normalized === true);
});
