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

test('self-hosted React is the installed React build', () => {
  const nm = path.resolve(website, '..', 'content-site', 'node_modules');
  const pairs = [
    ['react.production.min.js', 'react/umd/react.production.min.js'],
    ['react-dom.production.min.js', 'react-dom/umd/react-dom.production.min.js'],
  ];
  for (const [vendored, pkg] of pairs) {
    assert.ok(
      fs.readFileSync(path.join(website, 'vendor', vendored)).equals(fs.readFileSync(path.join(nm, pkg))),
      `website/vendor/${vendored} differs from node_modules/${pkg}; copy it over after bumping React`,
    );
  }
  for (const file of ['index.html', 'case-study.html', 'privacy.html']) {
    assert.doesNotMatch(fs.readFileSync(path.join(website, file), 'utf8'), /unpkg\.com/);
  }
});
