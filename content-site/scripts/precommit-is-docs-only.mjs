import { stdin } from 'node:process';
import { fileURLToPath } from 'node:url';

export function isDocsOnlyFile(file) {
  const normalized = String(file).replaceAll('\\', '/');
  return normalized.startsWith('docs/') || normalized.endsWith('.md');
}

/** True only when the list is non-empty and every path is under docs/ or ends in .md. */
export function isDocsOnlyFileList(files) {
  if (!Array.isArray(files) || files.length === 0) return false;
  return files.every(isDocsOnlyFile);
}

/** Staged-file list from `git diff --cached --name-only`. Empty input does not skip. */
export function shouldSkipTestSuite(stdinText) {
  const files = String(stdinText).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return isDocsOnlyFileList(files);
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stdin.setEncoding('utf8');
    stdin.on('data', (chunk) => chunks.push(chunk));
    stdin.on('end', () => resolve(chunks.join('')));
    stdin.on('error', reject);
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const stdinText = await readStdin();
  process.exit(shouldSkipTestSuite(stdinText) ? 0 : 1);
}
