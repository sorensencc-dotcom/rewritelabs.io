import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { onRequestPost, onRequest } from '../../functions/api/waitlist.js';

const kv = () => {
  const store = new Map();
  return {
    store,
    get: async (k, type) => {
      const v = store.get(k) ?? null;
      return type === 'json' && v ? JSON.parse(v) : v;
    },
    put: async (k, v) => void store.set(k, v),
  };
};

const post = (body, env, { ip = '203.0.113.7', headers = {}, contentType = 'application/json' } = {}) =>
  onRequestPost({
    request: Object.assign(
      new Request('https://rewritelabs.io/api/waitlist', {
        method: 'POST',
        body,
        headers: { ...(contentType ? { 'content-type': contentType } : {}), 'cf-connecting-ip': ip, ...headers },
      }),
      { cf: { country: 'US' } },
    ),
    env,
  });
const signup = (email, env, opts) => post(JSON.stringify({ email }), env, opts);
const entries = (env) => [...env.WAITLIST.store.keys()].filter((k) => k.startsWith('email:'));

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

test('keeps the first entry when the same email signs up again, with the same answer', async () => {
  const env = { WAITLIST: kv() };
  const first = await post(JSON.stringify({ email: 'a@b.co', source: 'blog:first' }), env);
  const again = await post(JSON.stringify({ email: 'a@b.co', source: 'blog:second' }), env);
  assert.deepEqual(await again.json(), await first.json(), 'an existing email must not be distinguishable from a new one');
  assert.equal(JSON.parse(env.WAITLIST.store.get('email:a@b.co')).source, 'blog:first');
});

test('rejects bad input with a 400, including JSON null', async () => {
  const env = { WAITLIST: kv() };
  for (const body of ['not json', 'null', '{}', JSON.stringify({ email: 'nope' })]) {
    assert.equal((await post(body, env)).status, 400, body);
  }
  assert.equal(entries(env).length, 0);
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

test('honeypot: a filled hidden field gets a fake success and nothing is stored', async () => {
  const env = { WAITLIST: kv() };
  const res = await post(JSON.stringify({ email: 'bot@example.com', website: 'http://spam.example' }), env);
  assert.equal(res.status, 200);
  assert.equal(env.WAITLIST.store.size, 0);
});

test('an empty honeypot is fine', async () => {
  const env = { WAITLIST: kv() };
  assert.equal((await post(JSON.stringify({ email: 'a@b.co', website: '' }), env)).status, 200);
  assert.equal(entries(env).length, 1);
});

test('rejects a request from another origin, and accepts the same origin', async () => {
  const env = { WAITLIST: kv() };
  const other = await signup('a@b.co', env, { headers: { origin: 'https://evil.example' } });
  assert.equal(other.status, 403);
  const same = await signup('a@b.co', env, { headers: { origin: 'https://rewritelabs.io' } });
  assert.equal(same.status, 200);
  assert.equal(entries(env).length, 1);
});

test('rejects non-JSON content types with a 415', async () => {
  const env = { WAITLIST: kv() };
  assert.equal((await post('email=a@b.co', env, { contentType: 'application/x-www-form-urlencoded' })).status, 415);
  assert.equal((await post(JSON.stringify({ email: 'a@b.co' }), env, { contentType: null })).status, 415);
  assert.equal(env.WAITLIST.store.size, 0);
});

test('rejects an oversized body with a 413', async () => {
  const env = { WAITLIST: kv() };
  const big = JSON.stringify({ email: 'a@b.co', pad: 'x'.repeat(5000) });
  assert.equal((await post(big, env)).status, 413);
  assert.equal(env.WAITLIST.store.size, 0);
});

test('rate limit: the sixth new signup from one visitor in the window gets a 429 with Retry-After', async () => {
  const env = { WAITLIST: kv() };
  for (let i = 1; i <= 5; i++) assert.equal((await signup(`user${i}@example.com`, env)).status, 200, `signup ${i}`);
  const sixth = await signup('user6@example.com', env);
  assert.equal(sixth.status, 429);
  assert.equal((await sixth.json()).error, 'rate_limited');
  assert.ok(Number(sixth.headers.get('retry-after')) > 0);
  assert.equal(entries(env).length, 5, 'the limited signup was not stored');
});

test('rate limit: another visitor is unaffected, and repeats and bad input do not use up the allowance', async () => {
  const env = { WAITLIST: kv() };
  for (let i = 1; i <= 5; i++) await signup(`user${i}@example.com`, env);
  assert.equal((await signup('other@example.com', env, { ip: '198.51.100.9' })).status, 200);

  const fresh = { WAITLIST: kv() };
  for (let i = 0; i < 20; i++) {
    await signup('same@example.com', fresh); // repeat of one email
    await signup('not-an-email', fresh); // invalid
  }
  assert.equal((await signup('next@example.com', fresh)).status, 200, 'allowance is still available');
});

test('rate limit: the allowance returns once the window has passed', async () => {
  const env = { WAITLIST: kv() };
  for (let i = 1; i <= 5; i++) await signup(`user${i}@example.com`, env);
  const visitorKey = [...env.WAITLIST.store.keys()].find((k) => k.startsWith('rl:'));
  const rec = JSON.parse(env.WAITLIST.store.get(visitorKey));
  env.WAITLIST.store.set(visitorKey, JSON.stringify({ ...rec, exp: Math.floor(Date.now() / 1000) - 1 }));
  assert.equal((await signup('later@example.com', env)).status, 200);
});

test('the visitor record does not contain the raw IP address', async () => {
  const env = { WAITLIST: kv() };
  await signup('a@b.co', env, { ip: '203.0.113.7' });
  const rl = [...env.WAITLIST.store.entries()].filter(([k]) => k.startsWith('rl:'));
  assert.equal(rl.length, 1);
  assert.ok(!rl[0][0].includes('203.0.113.7') && !rl[0][1].includes('203.0.113.7'));
});
