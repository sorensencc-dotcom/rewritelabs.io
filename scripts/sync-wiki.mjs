#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const WIKI_DIR = path.join(REPO_ROOT, 'wiki');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isPush = args.includes('--push');

const defaultRemote = process.env.GITHUB_ACTIONS === 'true'
  ? 'https://github.com/sorensencc-dotcom/rewritelabs.io.wiki.git'
  : 'git@github.com:sorensencc-dotcom/rewritelabs.io.wiki.git';

const WIKI_REMOTE_URL = process.env.WIKI_REPO_URL || defaultRemote;

export function runGit(cmdArgs, cwd) {
  const result = execSync(`git ${cmdArgs.join(' ')}`, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  return result.trim();
}

export function syncWiki() {
  console.log(`[Wiki Sync] Source directory: ${WIKI_DIR}`);
  if (!fs.existsSync(WIKI_DIR)) {
    console.error(`[Wiki Sync Error] Wiki source directory missing at ${WIKI_DIR}`);
    process.exit(1);
  }

  const wikiFiles = fs.readdirSync(WIKI_DIR).filter(f => f.endsWith('.md'));
  console.log(`[Wiki Sync] Found ${wikiFiles.length} pages in wiki/ source: ${wikiFiles.join(', ')}`);

  if (isDryRun && !isPush) {
    console.log('[Wiki Sync] Dry-run complete. All pages verified.');
    return;
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rl-wiki-sync-'));
  try {
    console.log(`[Wiki Sync] Cloning remote wiki repository from ${WIKI_REMOTE_URL}...`);
    execSync(`git clone --depth 1 "${WIKI_REMOTE_URL}" "${tempDir}"`, { stdio: 'inherit' });

    let copiedCount = 0;
    for (const file of wikiFiles) {
      const src = path.join(WIKI_DIR, file);
      const dest = path.join(tempDir, file);
      fs.copyFileSync(src, dest);
      copiedCount++;
    }

    console.log(`[Wiki Sync] Copied ${copiedCount} markdown pages to working clone.`);

    const status = runGit(['status', '--porcelain'], tempDir);
    if (!status) {
      console.log('[Wiki Sync] Remote wiki is already up to date. No changes to commit.');
      return;
    }

    console.log('[Wiki Sync] Detected changes in wiki tree:');
    console.log(status);

    runGit(['config', 'user.name', '"github-actions[bot]"'], tempDir);
    runGit(['config', 'user.email', '"github-actions[bot]@users.noreply.github.com"'], tempDir);

    runGit(['add', '.'], tempDir);
    runGit(['commit', '-m', '"docs(wiki): synchronize platform architecture and guides"'], tempDir);

    if (isPush) {
      console.log('[Wiki Sync] Pushing changes to remote wiki master branch...');
      execSync(`git -C "${tempDir}" push origin master`, { stdio: 'inherit' });
      console.log('[Wiki Sync] Successfully pushed wiki changes.');
    } else {
      console.log('[Wiki Sync] Staged and committed changes locally. Pass --push to publish.');
    }
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup error
    }
  }
}

syncWiki();
