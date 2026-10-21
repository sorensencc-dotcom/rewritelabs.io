import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { onRequestPost, onRequest } from '../../functions/api/waitlist.js';

const kv = () => {
  const store = new Map();
  return { store, get: async (k) => store.get(k) ?? null, put: async (k, v) => void store.set(k, v) };
};
const post = (body, env) =>
  onRequestPost({
    request: Object.assign(new Request('https://rewritelabs.io/api/waitlist', { method: 'POST', body }), { cf: { country: 'US' } }),
    env,
  });

test('stores a lowercase email with its source', async () => {
  const env = { WAITLIST: kv() };
  const res = await post(JSON.stringify({ email: ' Me@Example.COM ', source: 'blog:autonomy-is-a-tooling-problem' }), env);
  assert.equal(res.status, 200);
  const saved = JSON.parse(env.WAITLIST.store.get('email:me@example.com'));
  assert.equal(saved.email, 'me@example.com');
  assert.equal(saved.source, 'blog:autonomy-is-a-tooling-problem');
  assert.equal(saved.country, 'US');
});

test('drops a malformed source instead of storing it', async () => {
  const env = { WAITLIST: kv() };
  await post(JSON.stringify({ email: 'a@b.co', source: '<script>alert(1)</script>' }), env);
  assert.equal(JSON.parse(env.WAITLIST.store.get('email:a@b.co')).source, null);
});

test('keeps the first entry when the same email signs up again', async () => {
  const env = { WAITLIST: kv() };
  await post(JSON.stringify({ email: 'a@b.co', source: 'blog:first' }), env);
  await post(JSON.stringify({ email: 'a@b.co', source: 'blog:second' }), env);
  assert.equal(JSON.parse(env.WAITLIST.store.get('email:a@b.co')).source, 'blog:first');
});

test('rejects bad input with a 400, including JSON null', async () => {
  const env = { WAITLIST: kv() };
  for (const body of ['not json', 'null', '{}', JSON.stringify({ email: 'nope' })]) {
    assert.equal((await post(body, env)).status, 400, body);
  }
  assert.equal(env.WAITLIST.store.size, 0);
});

test('other methods get 405', async () => {
  assert.equal(onRequest().status, 405);
});

test('answers 503 not_configured when the KV binding is missing', async () => {
  const res = await post(JSON.stringify({ email: 'a@b.co' }), {});
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, 'not_configured');
});

test('lives in the project-root functions folder, which is where Pages deploys it from', () => {
  const root = new URL('../../', import.meta.url);
  assert.ok(fs.existsSync(new URL('functions/api/waitlist.js', root)));
  assert.ok(!fs.existsSync(new URL('website/functions', root)), 'website/ is the build output; Pages ignores a functions folder inside it');
});
