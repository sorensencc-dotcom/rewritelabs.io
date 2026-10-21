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

// Sitemap: the static pages plus every built blog and briefing page.
const origin = 'https://rewritelabs.io';
const urls = ['/', '/case-study', '/privacy'];
for (const dir of ['blog', 'ai-news-feed']) {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : e.name === 'index.html' ? [d] : []);
  for (const d of walk(path.join(dist, dir))) {
    urls.push('/' + path.relative(dist, d).split(path.sep).join('/') + '/');
  }
}
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  [...new Set(urls)].sort().map((u) => `  <url><loc>${origin}${u}</loc></url>`).join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(website, 'sitemap.xml'), xml);
console.log(`wrote website/sitemap.xml (${urls.length} urls)`);
