import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const website = path.resolve(root, '..', 'website');

// _cs holds bundled assets and only exists when a page ships scripts or scoped styles.
const optional = new Set(['_cs']);

for (const dir of ['blog', 'ai-news-feed', '_cs']) {
  const from = path.join(dist, dir);
  const to = path.join(website, dir);
  if (!fs.existsSync(from)) {
    if (optional.has(dir)) {
      fs.rmSync(to, { recursive: true, force: true });
      continue;
    }
    throw new Error(`expected build output missing: ${from}`);
  }
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`copied ${dir} -> website/${dir}`);
}
