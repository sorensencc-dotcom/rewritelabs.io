import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  buildRequest,
  dispatchBriefing,
  readPayloadFile,
  getPublishedDates,
  collectPendingBriefings,
  GdocPointerError,
  main,
  DEFAULT_REPO,
  EVENT_TYPE,
} from '../scripts/dispatch-briefing.mjs';

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

test('readPayloadFile: detects and rejects .gdoc shortcut extension', () => {
  assert.throws(
    () => readPayloadFile('C:/fake/briefing-payload.json.gdoc'),
    (err) => {
      assert.ok(err instanceof GdocPointerError);
      assert.match(err.message, /Google Doc pointer shortcut/);
      return true;
    },
  );
});

test('readPayloadFile: detects adjacent .gdoc shortcut when json is missing', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gdoc-test-'));
  try {
    fs.writeFileSync(path.join(tmp, 'briefing-payload.json.gdoc'), '{"doc_id":"123"}', 'utf8');
    assert.throws(
      () => readPayloadFile(path.join(tmp, 'briefing-payload.json')),
      (err) => {
        assert.ok(err instanceof GdocPointerError);
        assert.match(err.message, /Google Doc shortcut exists/);
        return true;
      },
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('readPayloadFile: detects .gdoc shortcut content inside json file', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gdoc-content-'));
  try {
    const f = path.join(tmp, 'payload.json');
    fs.writeFileSync(f, JSON.stringify({ doc_id: 'abc', url: 'https://docs.google.com/open?id=abc' }), 'utf8');
    assert.throws(
      () => readPayloadFile(f),
      (err) => {
        assert.ok(err instanceof GdocPointerError);
        assert.match(err.message, /Google Doc pointer shortcut contents detected/);
        return true;
      },
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('readPayloadFile: successfully loads valid UTF-8 JSON payload', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gdoc-valid-'));
  try {
    const f = path.join(tmp, 'payload.json');
    fs.writeFileSync(f, JSON.stringify(payload()), 'utf8');
    const loaded = readPayloadFile(f);
    assert.deepEqual(loaded, payload());
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('getPublishedDates: extracts published dates from markdown directory', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pub-dates-'));
  try {
    fs.writeFileSync(path.join(tmp, '2026-10-28.md'), 'published', 'utf8');
    fs.writeFileSync(path.join(tmp, '2026-10-29.md'), 'published', 'utf8');
    fs.writeFileSync(path.join(tmp, 'not-a-date.md'), 'ignored', 'utf8');
    const dates = getPublishedDates(tmp);
    assert.equal(dates.size, 2);
    assert.ok(dates.has('2026-10-28'));
    assert.ok(dates.has('2026-10-29'));
    assert.ok(!dates.has('not-a-date'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('collectPendingBriefings: sweeps archive directory and orders chronologically', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-sweep-'));
  try {
    const archiveDir = path.join(tmp, 'AI_News');
    const contentDir = path.join(tmp, 'content');
    fs.mkdirSync(archiveDir);
    fs.mkdirSync(contentDir);

    fs.writeFileSync(path.join(contentDir, '2026-10-27.md'), '# Already published', 'utf8');

    const p27 = { ...payload(), date: '2026-10-27' };
    const p28 = { ...payload(), date: '2026-10-28' };
    const p29 = { ...payload(), date: '2026-10-29' };
    const p30 = { ...payload(), date: '2026-10-30' };

    fs.writeFileSync(path.join(archiveDir, 'briefing-payload-2026-10-27.json'), JSON.stringify(p27), 'utf8');
    fs.writeFileSync(path.join(archiveDir, 'briefing-payload-2026-10-29.json'), JSON.stringify(p29), 'utf8');
    fs.writeFileSync(path.join(archiveDir, 'briefing-payload-2026-10-28.json'), JSON.stringify(p28), 'utf8');

    const stagingFile = path.join(tmp, 'briefing-payload.json');
    fs.writeFileSync(stagingFile, JSON.stringify(p30), 'utf8');

    const pending = collectPendingBriefings({ stagingFile, archiveDir, contentDir });
    assert.equal(pending.length, 3);
    assert.equal(pending[0].date, '2026-10-28');
    assert.equal(pending[1].date, '2026-10-29');
    assert.equal(pending[2].date, '2026-10-30');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('main: rejects .gdoc with code 2', async () => {
  const code = await main(['node', 'dispatch-briefing.mjs', 'file.gdoc']);
  assert.equal(code, 2);
});

test('main: runs backlog dry-run in chronological order', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'main-sweep-'));
  try {
    const archiveDir = path.join(tmp, 'AI_News');
    const contentDir = path.join(tmp, 'content');
    fs.mkdirSync(archiveDir);
    fs.mkdirSync(contentDir);

    const p28 = { ...payload(), date: '2026-10-28' };
    const p29 = { ...payload(), date: '2026-10-29' };
    fs.writeFileSync(path.join(archiveDir, 'briefing-payload-2026-10-28.json'), JSON.stringify(p28), 'utf8');
    const stagingFile = path.join(tmp, 'briefing-payload.json');
    fs.writeFileSync(stagingFile, JSON.stringify(p29), 'utf8');

    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    try {
      const code = await main([
        'node',
        'dispatch-briefing.mjs',
        stagingFile,
        '--dry-run',
        '--archive-dir',
        archiveDir,
        '--content-dir',
        contentDir,
      ]);
      assert.equal(code, 0);
      assert.equal(logs.length, 2);
      assert.match(logs[0], /payload valid for 2026-10-28/);
      assert.match(logs[1], /payload valid for 2026-10-29/);
    } finally {
      console.log = origLog;
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
