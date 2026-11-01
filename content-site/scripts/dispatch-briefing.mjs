// Step 8c, cloud path: send the briefing payload to GitHub as a repository_dispatch (publish-briefing)
// so the Publish briefing workflow opens the draft PR. Nothing here touches git.
// Usage: node scripts/dispatch-briefing.mjs <payload.json> [--dry-run]
// The token is read only from GH_DISPATCH_TOKEN and is never printed.
// Exit codes: 0 sent (HTTP 204) or dry run ok, 1 dispatch failed, 2 bad usage, payload or config.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePayload } from './export-briefing.mjs';

export const DEFAULT_REPO = 'sorensencc-dotcom/rewritelabs.io';
export const EVENT_TYPE = 'publish-briefing';
export const MAX_TOP_LEVEL_KEYS = 10;
export const MAX_BODY_CHARS = 65535;

export const DEFAULT_CONTENT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/content/briefings');

export class ConfigError extends Error {}
export class GdocPointerError extends Error {}

export function readPayloadFile(filePath) {
  if (filePath.endsWith('.gdoc')) {
    throw new GdocPointerError(
      `cannot dispatch Google Doc pointer shortcut (${filePath}). Google Drive for Desktop syncs Google Docs as .gdoc shortcuts. Save payload as raw JSON (application/json) or export via Drive API.`
    );
  }
  if (!fs.existsSync(filePath)) {
    const gdocPath = `${filePath}.gdoc`;
    if (fs.existsSync(gdocPath)) {
      throw new GdocPointerError(
        `payload file not found (${filePath}), but a Google Doc shortcut exists (${gdocPath}). Save payload as raw JSON (application/json) to avoid .gdoc pointer sync.`
      );
    }
    throw new Error(`file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`failed to parse JSON from ${filePath}: ${err.message}`);
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    if (data.doc_id && data.url && !data.title && !data.themes) {
      throw new GdocPointerError(
        `Google Doc pointer shortcut contents detected in ${filePath} (${data.url}). Google Drive for Desktop synced a shortcut rather than raw briefing JSON. Save as raw JSON (application/json).`
      );
    }
  }
  return data;
}

export function getPublishedDates(contentDir = DEFAULT_CONTENT_DIR) {
  if (!fs.existsSync(contentDir)) return new Set();
  const entries = fs.readdirSync(contentDir);
  const dates = new Set();
  for (const entry of entries) {
    const m = /^(\d{4}-\d{2}-\d{2})\.md$/.exec(entry);
    if (m) dates.add(m[1]);
  }
  return dates;
}

export function collectPendingBriefings({ stagingFile, archiveDir, contentDir = DEFAULT_CONTENT_DIR }) {
  const stagingPayload = readPayloadFile(stagingFile);
  validatePayload(stagingPayload);

  if (!archiveDir) {
    return [stagingPayload];
  }

  const published = getPublishedDates(contentDir);
  const byDate = new Map();

  if (fs.existsSync(archiveDir)) {
    const files = fs.readdirSync(archiveDir);
    for (const f of files) {
      if (!f.endsWith('.json') || f.endsWith('.gdoc')) continue;
      const fullPath = path.join(archiveDir, f);
      try {
        const payload = readPayloadFile(fullPath);
        validatePayload(payload);
        if (!published.has(payload.date)) {
          byDate.set(payload.date, payload);
        }
      } catch {
        // Skip unparseable or non-payload JSON files in archive
      }
    }
  }

  if (!published.has(stagingPayload.date)) {
    byDate.set(stagingPayload.date, stagingPayload);
  }

  const sorted = Array.from(byDate.values());
  sorted.sort((a, b) => a.date.localeCompare(b.date));
  return sorted;
}

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

export async function main(argv) {
  const args = argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const archiveDirIdx = args.indexOf('--archive-dir');
  const archiveDir = archiveDirIdx !== -1 ? args[archiveDirIdx + 1] : process.env.BRIEFING_ARCHIVE_DIR;
  const contentDirIdx = args.indexOf('--content-dir');
  const contentDir = contentDirIdx !== -1 ? args[contentDirIdx + 1] : undefined;

  const file = args.find((a, i) => {
    if (a.startsWith('--')) return false;
    if (i > 0 && (args[i - 1] === '--archive-dir' || args[i - 1] === '--content-dir')) return false;
    return true;
  });

  if (!file) {
    console.error('usage: dispatch-briefing.mjs <payload.json> [--dry-run] [--archive-dir <dir>] [--content-dir <dir>]');
    return 2;
  }
  const repo = process.env.BRIEFING_REPO || DEFAULT_REPO;
  let pending;
  try {
    pending = collectPendingBriefings({ stagingFile: file, archiveDir, contentDir });
    for (const p of pending) {
      buildRequest(p, { repo, token: 'dry-run' });
    }
  } catch (err) {
    console.error(err.message);
    return 2;
  }

  if (pending.length === 0) {
    console.log('no pending briefings to dispatch; all dates already published');
    return 0;
  }

  if (dryRun) {
    for (const p of pending) {
      console.log(`payload valid for ${p.date}; would dispatch ${EVENT_TYPE} to ${repo}`);
    }
    return 0;
  }

  const token = process.env.GH_DISPATCH_TOKEN;
  for (const p of pending) {
    try {
      await dispatchBriefing(p, { token, repo });
      console.log(`dispatched ${EVENT_TYPE} for ${p.date} to ${repo}`);
    } catch (err) {
      console.error(err.message);
      return err instanceof ConfigError ? 2 : 1;
    }
  }
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = await main(process.argv);
}
