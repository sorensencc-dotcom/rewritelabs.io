import test from 'node:test';
import assert from 'node:assert';
import { load } from '../src/loader.js';
import { resolve } from '../src/resolver.js';
import { index } from '../src/index.js';

test('Loader → Resolver → Index chain works', async () => {
  const loaded = await load({ url: 'http://example.com' });
  const resolved = await resolve(loaded);
  const indexed = await index(resolved);

  assert.ok(indexed.id);
  assert.ok(indexed.timestamp);
});
