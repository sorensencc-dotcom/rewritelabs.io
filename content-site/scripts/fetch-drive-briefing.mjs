// Fetch the latest staged briefing-payload.json directly from Google Drive API (v3)
// using a GCP Service Account JSON key (zero external dependencies).
//
// Usage: node content-site/scripts/fetch-drive-briefing.mjs <out-path.json>
// Env:
//   GDRIVE_SERVICE_ACCOUNT_JSON  Raw JSON (or base64-encoded JSON) of the service account key
//   GDRIVE_FOLDER_ID             Optional Drive folder ID to scope the search (e.g. My Drive/AI)
//   GDRIVE_FILE_NAME             Optional filename override (default: briefing-payload.json)
//
// Exit codes: 0 fetched & valid, 1 Drive API error, 2 config/payload error, 3 file not found.
import crypto from 'node:crypto';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validatePayload } from './export-briefing.mjs';

export const DRIVE_READONLY_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
export const TOKEN_URI = 'https://oauth2.googleapis.com/token';
export const DRIVE_FILES_API = 'https://www.googleapis.com/drive/v3/files';

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function parseServiceAccount(raw) {
  if (!raw || !raw.trim()) {
    throw new Error('GDRIVE_SERVICE_ACCOUNT_JSON is not set');
  }
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf8');
  let sa;
  try {
    sa = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(`failed to parse GDRIVE_SERVICE_ACCOUNT_JSON: ${err.message}`);
  }
  if (!sa?.client_email || !sa?.private_key) {
    throw new Error('GDRIVE_SERVICE_ACCOUNT_JSON must contain client_email and private_key');
  }
  return sa;
}

export function createServiceAccountJwt(sa, { scope = DRIVE_READONLY_SCOPE, nowSec = Math.floor(Date.now() / 1000) } = {}) {
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = base64Url(JSON.stringify({
    iss: sa.client_email,
    scope,
    aud: sa.token_uri || TOKEN_URI,
    iat: nowSec,
    exp: nowSec + 3600,
  }));
  const signingInput = `${header}.${claimSet}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = base64Url(signer.sign(sa.private_key));
  return `${signingInput}.${signature}`;
}

export async function getAccessToken(sa, { fetchImpl = fetch } = {}) {
  const assertion = createServiceAccountJwt(sa);
  const res = await fetchImpl(sa.token_uri || TOKEN_URI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google OAuth token exchange failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data?.access_token) {
    throw new Error('Google OAuth token response missing access_token');
  }
  return data.access_token;
}

export async function findLatestPayloadFile(
  accessToken,
  { folderId = '', fileName = 'briefing-payload.json', fetchImpl = fetch } = {},
) {
  const escapedName = fileName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const clauses = [`name = '${escapedName}'`, 'trashed = false'];
  if (folderId) {
    const escapedFolder = folderId.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    clauses.push(`'${escapedFolder}' in parents`);
  }
  const params = new URLSearchParams({
    q: clauses.join(' and '),
    orderBy: 'modifiedTime desc',
    pageSize: '1',
    fields: 'files(id,name,modifiedTime,mimeType)',
    includeItemsFromAllDrives: 'true',
    supportsAllDrives: 'true',
  });
  const res = await fetchImpl(`${DRIVE_FILES_API}?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Drive files.list failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  return data?.files?.[0] ?? null;
}

export async function downloadPayloadFile(accessToken, fileId, { fetchImpl = fetch } = {}) {
  const res = await fetchImpl(
    `${DRIVE_FILES_API}/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) {
    throw new Error(`Drive file download failed (${fileId}): HTTP ${res.status}`);
  }
  const raw = (await res.text()).replace(/^\uFEFF/, '');
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    throw new Error(`downloaded Drive file is not valid JSON: ${err.message}`);
  }
  validatePayload(payload);
  return payload;
}

export async function main(argv, env = process.env, { fetchImpl = fetch } = {}) {
  const outPath = argv[2];
  if (!outPath) {
    console.error('usage: fetch-drive-briefing.mjs <out-path.json>');
    return 2;
  }

  let sa;
  try {
    sa = parseServiceAccount(env.GDRIVE_SERVICE_ACCOUNT_JSON);
  } catch (err) {
    console.error(err.message);
    return 2;
  }

  let token;
  let file;
  try {
    token = await getAccessToken(sa, { fetchImpl });
    file = await findLatestPayloadFile(token, {
      folderId: (env.GDRIVE_FOLDER_ID || '').trim(),
      fileName: (env.GDRIVE_FILE_NAME || 'briefing-payload.json').trim(),
      fetchImpl,
    });
  } catch (err) {
    console.error(err.message);
    return 1;
  }

  if (!file) {
    console.log('No briefing-payload.json found in shared Google Drive folder.');
    return 3;
  }

  let payload;
  try {
    payload = await downloadPayloadFile(token, file.id, { fetchImpl });
  } catch (err) {
    console.error(err.message);
    return err.message.startsWith('Drive file download failed') ? 1 : 2;
  }

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Fetched ${file.name} (${file.id}, modified ${file.modifiedTime}) for ${payload.date}`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await main(process.argv);
}
