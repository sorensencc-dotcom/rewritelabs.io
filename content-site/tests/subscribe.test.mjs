import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, onRequest, cleanTracks, kitReady } from '../../functions/api/subscribe.js';

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

const kitEnv = () => ({
  NEWSLETTER: kv(),
  KIT_API_KEY: 'test-key',
  KIT_FORM_ID: '111',
  KIT_TAG_OPERATOR: '222',
  KIT_TAG_FIELD: '333',
});

const withFetch = async (handler, fn) => {
  const calls = [];
  const real = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(init.body), key: init.headers['x-kit-api-key'] });
    return handler(String(url));
  };
  try {
    await fn(calls);
  } finally {
    globalThis.fetch = real;
  }
};

test('Kit sync is off until every Kit setting exists', () => {
  assert.equal(kitReady(kitEnv()), true);
  for (const missing of ['KIT_API_KEY', 'KIT_FORM_ID', 'KIT_TAG_OPERATOR', 'KIT_TAG_FIELD']) {
    const env = kitEnv();
    delete env[missing];
    assert.equal(kitReady(env), false);
  }
});

test('without Kit settings nothing is sent and the signup stays pending', async () => {
  await withFetch(() => new Response('{}', { status: 201 }), async (calls) => {
    const env = { NEWSLETTER: kv() };
    const res = await post(JSON.stringify({ email: 'a@b.co', tracks: ['operator'] }), env);
    assert.equal(res.status, 200);
    assert.equal(calls.length, 0);
    assert.equal(JSON.parse(env.NEWSLETTER.store.get('email:a@b.co')).status, 'pending');
  });
});

test('sends an inactive subscriber to the opt-in form, tags each track, then marks it sent', async () => {
  await withFetch(() => new Response('{}', { status: 201 }), async (calls) => {
    const env = kitEnv();
    await post(JSON.stringify({ email: 'a@b.co', tracks: ['field', 'operator'] }), env);
    assert.deepEqual(
      calls.map((c) => c.url),
      [
        'https://api.kit.com/v4/subscribers',
        'https://api.kit.com/v4/forms/111/subscribers',
        'https://api.kit.com/v4/tags/222/subscribers',
        'https://api.kit.com/v4/tags/333/subscribers',
      ],
    );
    assert.deepEqual(calls[0].body, { email_address: 'a@b.co', state: 'inactive' });
    assert.ok(calls.every((c) => c.key === 'test-key' && c.body.email_address === 'a@b.co'));
    assert.equal(JSON.parse(env.NEWSLETTER.store.get('email:a@b.co')).status, 'sent');
  });
});

test('tags only the tracks picked', async () => {
  await withFetch(() => new Response('{}', { status: 201 }), async (calls) => {
    await post(JSON.stringify({ email: 'a@b.co', tracks: ['field'] }), kitEnv());
    assert.ok(!calls.some((c) => c.url.includes('/tags/222/')));
    assert.ok(calls.some((c) => c.url.includes('/tags/333/')));
  });
});

test('a Kit failure keeps the entry pending and the reader gets the same answer', async () => {
  await withFetch((url) => new Response('{}', { status: url.includes('/forms/') ? 500 : 201 }), async () => {
    const env = kitEnv();
    const res = await post(JSON.stringify({ email: 'a@b.co', tracks: ['operator'] }), env);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(JSON.parse(env.NEWSLETTER.store.get('email:a@b.co')).status, 'pending');
  });
});

test('a known address is never sent to Kit again', async () => {
  await withFetch(() => new Response('{}', { status: 201 }), async (calls) => {
    const env = kitEnv();
    await post(JSON.stringify({ email: 'a@b.co', tracks: ['operator'] }), env);
    const before = calls.length;
    await post(JSON.stringify({ email: 'a@b.co', tracks: ['field'] }), env);
    assert.equal(calls.length, before);
  });
});
