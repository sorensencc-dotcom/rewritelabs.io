import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import {
  createServiceAccountJwt,
  downloadPayloadFile,
  findLatestPayloadFile,
  getAccessToken,
  parseServiceAccount,
} from '../scripts/fetch-drive-briefing.mjs';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const fixtureSa = {
  client_email: 'briefing-reader@example.iam.gserviceaccount.com',
  private_key: privateKey,
};

const validPayload = {
  title: 'AI Synthesis Briefing: November 26, 2026',
  date: '2026-11-26',
  confidenceScore: 0.91,
  sourcesEvaluated: 8,
  themes: [
    {
      name: 'Cloud-native automation',
      delta7d: 'accelerating',
      summary: 'Teams are replacing local scheduled scripts with direct cloud-to-cloud CI triggers.',
      tags: ['IMPLEMENT'],
      primarySources: [{ title: 'GitHub Actions Docs', url: 'https://docs.github.com/en/actions' }],
    },
  ],
};

test('parseServiceAccount accepts raw JSON and base64 JSON', () => {
  const raw = JSON.stringify(fixtureSa);
  assert.equal(parseServiceAccount(raw).client_email, fixtureSa.client_email);
  const b64 = Buffer.from(raw, 'utf8').toString('base64');
  assert.equal(parseServiceAccount(b64).client_email, fixtureSa.client_email);
  assert.throws(() => parseServiceAccount(''), /not set/);
  assert.throws(() => parseServiceAccount('{}'), /client_email and private_key/);
});

test('createServiceAccountJwt produces a verifiable RS256 JWT', () => {
  const jwt = createServiceAccountJwt(fixtureSa, { nowSec: 1700000000 });
  const [headerB64, payloadB64, sigB64] = jwt.split('.');
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  assert.equal(header.alg, 'RS256');
  assert.equal(payload.iss, fixtureSa.client_email);
  assert.equal(payload.exp, 1700003600);

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();
  assert.equal(verifier.verify(publicKey, Buffer.from(sigB64, 'base64url')), true);
});

test('getAccessToken exchanges JWT for bearer token', async () => {
  let calledUrl = '';
  const token = await getAccessToken(fixtureSa, {
    fetchImpl: async (url) => {
      calledUrl = url;
      return { ok: true, status: 200, json: async () => ({ access_token: 'ya29.test' }) };
    },
  });
  assert.equal(calledUrl, 'https://oauth2.googleapis.com/token');
  assert.equal(token, 'ya29.test');
});

test('findLatestPayloadFile scopes query by folderId when provided', async () => {
  let seenUrl = '';
  const file = await findLatestPayloadFile('ya29.test', {
    folderId: 'folder-123',
    fetchImpl: async (url) => {
      seenUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({ files: [{ id: 'file-1', name: 'briefing-payload.json', modifiedTime: '2026-11-26T14:00:00Z' }] }),
      };
    },
  });
  assert.equal(file.id, 'file-1');
  const q = new URL(seenUrl).searchParams.get('q');
  assert.match(q, /'folder-123' in parents/);
  assert.match(q, /name = 'briefing-payload\.json'/);
});

test('downloadPayloadFile strips BOM and validates payload schema', async () => {
  const payload = await downloadPayloadFile('ya29.test', 'file-1', {
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      text: async () => `\uFEFF${JSON.stringify(validPayload)}`,
    }),
  });
  assert.equal(payload.date, '2026-11-26');

  await assert.rejects(
    () =>
      downloadPayloadFile('ya29.test', 'file-bad', {
        fetchImpl: async () => ({ ok: true, status: 200, text: async () => '{"date":"bad"}' }),
      }),
    /invalid briefing payload/,
  );
});
