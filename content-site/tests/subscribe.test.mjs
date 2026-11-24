import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, onRequest, cleanTracks } from '../../functions/api/subscribe.js';

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

const post = (body, env, { ip = '203.0.113.7' } = {}) =>
  onRequestPost({
    request: Object.assign(
      new Request('https://rewritelabs.io/api/subscribe', {
        method: 'POST',
        body,
        headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip },
      }),
      { cf: { country: 'US' } },
    ),
    env,
  });

test('stores a pending signup with its tracks and source', async () => {
  const env = { NEWSLETTER: kv() };
  const res = await post(JSON.stringify({ email: ' Me@Example.COM ', tracks: ['field', 'operator'], source: 'feed:2026-11-23' }), env);
  assert.equal(res.status, 200);
  const saved = JSON.parse(env.NEWSLETTER.store.get('email:me@example.com'));
  assert.deepEqual(saved.tracks, ['operator', 'field']);
  assert.equal(saved.status, 'pending');
  assert.equal(saved.source, 'feed:2026-11-23');
});

test('never writes to the product waitlist', async () => {
  const env = { NEWSLETTER: kv(), WAITLIST: kv() };
  await post(JSON.stringify({ email: 'a@b.co', tracks: ['operator'] }), env);
  assert.equal(env.WAITLIST.store.size, 0);
});

test('rejects a signup with no known track', async () => {
  const env = { NEWSLETTER: kv() };
  for (const tracks of [undefined, [], ['pro'], 'operator']) {
    const res = await post(JSON.stringify({ email: 'a@b.co', tracks }), env);
    assert.equal(res.status, 400);
  }
  assert.equal([...env.NEWSLETTER.store.keys()].filter((k) => k.startsWith('email:')).length, 0);
});

test('an existing address gets the same answer and keeps its first entry', async () => {
  const env = { NEWSLETTER: kv() };
  const first = await post(JSON.stringify({ email: 'a@b.co', tracks: ['operator'] }), env);
  const again = await post(JSON.stringify({ email: 'a@b.co', tracks: ['field'] }), env);
  assert.deepEqual(await again.json(), await first.json());
  assert.deepEqual(JSON.parse(env.NEWSLETTER.store.get('email:a@b.co')).tracks, ['operator']);
});

test('answers 503 not_configured without the NEWSLETTER binding, even when WAITLIST exists', async () => {
  const res = await post(JSON.stringify({ email: 'a@b.co', tracks: ['operator'] }), { WAITLIST: kv() });
  assert.equal(res.status, 503);
});

test('cleanTracks keeps known tracks in order without repeats', () => {
  assert.deepEqual(cleanTracks(['FIELD', 'operator', 'field', 'x']), ['operator', 'field']);
});

test('other methods get 405', () => {
  assert.equal(onRequest().status, 405);
});
