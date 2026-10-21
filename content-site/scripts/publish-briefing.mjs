// Step 8c: turn a scored briefing payload (JSON file) into a draft PR on the site repo.
// Usage: node scripts/publish-briefing.mjs <payload.json> [--dry-run]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { briefingRepoPath, exportBriefing, validatePayload } from './export-briefing.mjs';

const [payloadPath, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
if (!payloadPath) {
  console.error('usage: publish-briefing.mjs <payload.json> [--dry-run]');
  process.exit(2);
}

let payload;
try {
  payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
  validatePayload(payload);
} catch (err) {
  console.error(err.message);
  process.exit(2);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
const repo = run('git', ['rev-parse', '--show-toplevel'], here);

if (dryRun) {
  console.log(`payload valid for ${payload.date}; would open draft PR briefing/${payload.date}`);
  process.exit(0);
}

const branch = `briefing/${payload.date}`;
const onOrigin = (() => {
  try {
    execFileSync('git', ['ls-remote', '--exit-code', '--heads', 'origin', branch], { cwd: repo, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();
if (onOrigin) {
  console.error(`${branch} already exists on origin. Close its PR and delete the remote branch, or use a different date.`);
  process.exit(1);
}
// A local branch with no remote twin is debris from an aborted run of this script.
try {
  run('git', ['branch', '-D', branch], repo);
} catch {}

run('git', ['fetch', 'origin', 'main'], repo);
// A second run for a date that is already published would otherwise replace that page. Refuse instead.
const published = (() => {
  try {
    execFileSync('git', ['cat-file', '-e', `origin/main:${briefingRepoPath(payload.date)}`], { cwd: repo, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();
if (published) {
  console.error(`A briefing for ${payload.date} is already on main (${briefingRepoPath(payload.date)}). Use a different date, or edit that file by hand.`);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'briefing-'));
const work = path.join(tmp, 'wt');
run('git', ['worktree', 'add', '-b', branch, work, 'origin/main'], repo);
try {
  const file = exportBriefing(payload, path.join(work, 'content-site/src/content/briefings'));
  run('git', ['add', file], work);
  run('git', ['commit', '-m', `chore(briefing): AI news synthesis for ${payload.date}`], work);
  run('git', ['push', '-u', 'origin', branch], work);
  const url = run(
    'gh',
    [
      'pr', 'create', '--draft', '--base', 'main', '--head', branch,
      '--title', `briefing: ${payload.title}`,
      '--body', `Draft AI news briefing for ${payload.date}. Review the themes, confidence score, and source links, then mark ready and merge to publish.`,
    ],
    work,
  );
  console.log(url);
} finally {
  // The PR is already open by now. On Windows, git or antivirus can briefly lock the
  // temp directory, so cleanup is best-effort and must not turn success into a failure.
  try {
    run('git', ['worktree', 'remove', '--force', work], repo);
  } catch {
    try {
      run('git', ['worktree', 'prune'], repo);
    } catch {}
  }
  try {
    fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    console.warn(`Notice: left temporary directory in place (file lock): ${tmp}`);
  }
}
