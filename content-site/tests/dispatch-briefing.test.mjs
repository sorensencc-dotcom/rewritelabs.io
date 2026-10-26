import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest, dispatchBriefing, DEFAULT_REPO, EVENT_TYPE } from '../scripts/dispatch-briefing.mjs';

const TOKEN = 'ghp_SECRET_TOKEN_VALUE';

const payload = () => ({
  title: 'Daily AI briefing',
  date: '2026-10-26',
  confidenceScore: 0.8,
  themes: [
    {
      name: 'Theme A',
      delta7d: 'stable',
      summary: 'Summary',
      primarySources: [{ title: 'Spec', url: 'https://example.org/spec' }],
    },
  ],
});

function mockFetch(status, body = '') {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    return { status, text: async () => body };
  };
  fn.calls = calls;
  return fn;
}

test('buildRequest: url, body and headers', () => {
  const p = payload();
  const { url, init } = buildRequest(p, { repo: DEFAULT_REPO, token: TOKEN });
  assert.equal(url, `https://api.github.com/repos/${DEFAULT_REPO}/dispatches`);
  assert.equal(DEFAULT_REPO, 'sorensencc-dotcom/rewritelabs.io');
  assert.equal(init.method, 'POST');
  assert.deepEqual(JSON.parse(init.body), { event_type: EVENT_TYPE, client_payload: p });
  assert.equal(EVENT_TYPE, 'publish-briefing');
  assert.equal(init.headers.Accept, 'application/vnd.github+json');
  assert.equal(init.headers.Authorization, `Bearer ${TOKEN}`);
  assert.equal(init.headers['Content-Type'], 'application/json');
  assert.equal(init.headers['X-GitHub-Api-Version'], '2022-11-28');
});

test('buildRequest: honors custom repo', () => {
  const { url } = buildRequest(payload(), { repo: 'o/r', token: TOKEN });
  assert.equal(url, 'https://api.github.com/repos/o/r/dispatches');
});

test('rejects bad date', () => {
  assert.throws(() => buildRequest({ ...payload(), date: '26-10-2026' }, { token: TOKEN }), /date/);
  const { date, ...noDate } = payload();
  assert.throws(() => buildRequest(noDate, { token: TOKEN }), /date/);
});

test('rejects an impossible calendar date via validatePayload', () => {
  assert.throws(() => buildRequest({ ...payload(), date: '2026-13-45' }, { token: TOKEN }), /real calendar date/);
});

test('rejects non-object payload', () => {
  assert.throws(() => buildRequest([payload()], { token: TOKEN }), /payload must be an object/);
  assert.throws(() => buildRequest(null, { token: TOKEN }), /payload must be an object/);
});

test('rejects 11 top-level keys, accepts 10', () => {
  const withKeys = (n) => {
    const o = payload();
    for (let i = Object.keys(o).length; i < n; i++) o[`k${i}`] = i;
    return o;
  };
  assert.doesNotThrow(() => buildRequest(withKeys(10), { token: TOKEN }));
  assert.throws(() => buildRequest(withKeys(11), { token: TOKEN }), /top-level keys/);
});

test('rejects client_payload over 65535 characters', () => {
  const big = payload();
  big.bodyMarkdown = 'x'.repeat(30000);
  const t = big.themes[0];
  big.themes = Array.from({ length: 20 }, (_, i) => ({ ...t, name: `T${i}`, summary: 'y'.repeat(3000) }));
  assert.throws(() => buildRequest(big, { token: TOKEN }), /characters/);
});

test('dispatchBriefing: 204 succeeds and sends one request', async () => {
  const f = mockFetch(204);
  const res = await dispatchBriefing(payload(), { token: TOKEN, fetchImpl: f });
  assert.equal(res.status, 204);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].init.headers.Authorization, `Bearer ${TOKEN}`);
});

test('dispatchBriefing: missing token rejects before fetch', async () => {
  const f = mockFetch(204);
  await assert.rejects(() => dispatchBriefing(payload(), { fetchImpl: f }), /GH_DISPATCH_TOKEN/);
  assert.equal(f.calls.length, 0);
});

test('dispatchBriefing: invalid payload rejects before fetch', async () => {
  const f = mockFetch(204);
  await assert.rejects(() => dispatchBriefing({ date: 'nope' }, { token: TOKEN, fetchImpl: f }), /title/);
  assert.equal(f.calls.length, 0);
});

test('dispatchBriefing: non-204 error has status and body, not token', async () => {
  const f = mockFetch(404, `{"message":"Not Found","echo":"${TOKEN}"}`);
  await assert.rejects(
    () => dispatchBriefing(payload(), { token: TOKEN, fetchImpl: f }),
    (err) => {
      assert.match(err.message, /^dispatch failed: HTTP 404 /);
      assert.match(err.message, /Not Found/);
      assert.ok(!err.message.includes(TOKEN));
      return true;
    },
  );
});
