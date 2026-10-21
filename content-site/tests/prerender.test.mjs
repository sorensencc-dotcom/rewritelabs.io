import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prerender } from '../scripts/prerender-pages.mjs';

const website = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'website');

for (const file of ['index.html', 'case-study.html', 'privacy.html']) {
  test(`${file} is pre-rendered and up to date`, () => {
    const html = fs.readFileSync(path.join(website, file), 'utf8');
    assert.equal(prerender(html), html, 'run `npm run prerender` in content-site and commit the result');
    assert.match(html, /<h1[ >]/, 'crawlable <h1> present in the static HTML');
    assert.match(html, /hydrateRoot/, 'client hydrates instead of re-rendering');
    assert.match(html, /<link rel="canonical"/);
  });
}
