// Step 8c, cloud path: send the briefing payload to GitHub as a repository_dispatch (publish-briefing)
// so the Publish briefing workflow opens the draft PR. Nothing here touches git.
// Usage: node scripts/dispatch-briefing.mjs <payload.json> [--dry-run]
// The token is read only from GH_DISPATCH_TOKEN and is never printed.
// Exit codes: 0 sent (HTTP 204) or dry run ok, 1 dispatch failed, 2 bad usage, payload or config.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validatePayload } from './export-briefing.mjs';

export const DEFAULT_REPO = 'sorensencc-dotcom/rewritelabs.io';
export const EVENT_TYPE = 'publish-briefing';
// GitHub rejects a client_payload with more than 10 top-level keys or more than 65535 characters.
export const MAX_TOP_LEVEL_KEYS = 10;
export const MAX_BODY_CHARS = 65535;

export class ConfigError extends Error {}

function failLimit(msg) {
  throw new Error(`invalid briefing payload: ${msg}`);
}

export function checkDispatchLimits(payload) {
  const keys = Object.keys(payload).length;
  if (keys > MAX_TOP_LEVEL_KEYS) failLimit(`${keys} top-level keys; GitHub allows at most ${MAX_TOP_LEVEL_KEYS}`);
  const chars = JSON.stringify(payload).length;
  if (chars > MAX_BODY_CHARS) failLimit(`client_payload is ${chars} characters; GitHub allows at most ${MAX_BODY_CHARS}`);
}

export function buildRequest(payload, { repo = DEFAULT_REPO, token } = {}) {
  validatePayload(payload);
  checkDispatchLimits(payload);
  return {
    url: `https://api.github.com/repos/${repo}/dispatches`,
    init: {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ event_type: EVENT_TYPE, client_payload: payload }),
    },
  };
}

export async function dispatchBriefing(payload, { token, repo = DEFAULT_REPO, fetchImpl = fetch } = {}) {
  if (!token) throw new ConfigError('GH_DISPATCH_TOKEN is not set');
  const { url, init } = buildRequest(payload, { repo, token });
  let res;
  try {
    res = await fetchImpl(url, init);
  } catch (err) {
    throw new Error(`dispatch failed: ${String(err?.message ?? err).split(token).join('[redacted]')}`);
  }
  if (res.status !== 204) {
    let text = '';
    try {
      text = await res.text();
    } catch {
      // status alone is enough
    }
    throw new Error(`dispatch failed: HTTP ${res.status} ${text.split(token).join('[redacted]')}`.trim());
  }
  return { status: res.status };
}

async function main(argv) {
  const args = argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) {
    console.error('usage: dispatch-briefing.mjs <payload.json> [--dry-run]');
    return 2;
  }
  const repo = process.env.BRIEFING_REPO || DEFAULT_REPO;
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(file, 'utf8'));
    buildRequest(payload, { repo, token: 'dry-run' });
  } catch (err) {
    console.error(err.message);
    return 2;
  }
  if (dryRun) {
    console.log(`payload valid for ${payload.date}; would dispatch ${EVENT_TYPE} to ${repo}`);
    return 0;
  }
  try {
    await dispatchBriefing(payload, { token: process.env.GH_DISPATCH_TOKEN, repo });
  } catch (err) {
    console.error(err.message);
    return err instanceof ConfigError ? 2 : 1;
  }
  console.log(`dispatched ${EVENT_TYPE} for ${payload.date} to ${repo}`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await main(process.argv);
}
