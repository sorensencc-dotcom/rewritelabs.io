import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const website = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'website');
const read = (f) => fs.readFileSync(path.join(website, f), 'utf8');
const ds = fs.readdirSync(path.join(website, '_ds'))[0];

const tokens = (css) => Object.fromEntries([...css.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map((m) => [m[1], m[2].trim()]));
const block = (css, header) => {
  const start = css.indexOf(header);
  assert.notEqual(start, -1, `site.css is missing ${header}`);
  return css.slice(start, css.indexOf('}', start));
};

const resolve = (t, name) => {
  let v = t[name];
  for (let i = 0; i < 5 && /^var\(--[\w-]+\)$/.test(v); i++) v = t[v.slice(4, -1)];
  return v;
};

const luminance = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const site = read('site.css');
const dsColors = tokens(read(`_ds/${ds}/tokens/colors.css`));
const dark = { ...dsColors, ...tokens(block(site, ':root {\n  color-scheme: dark;')) };
const light = { ...dark, ...tokens(block(site, ':root[data-theme="light"] {')) };

for (const [name, t] of [['dark', dark], ['light', light]]) {
  test(`${name} theme: text tokens are at least 4.5:1 on the page and card backgrounds`, () => {
    for (const fg of ['--fg-1', '--fg-2', '--fg-3', '--accent-text', '--signal-bad', '--signal-good', '--signal-warn']) {
      for (const bg of ['--ink-1', '--ink-2']) {
        const ratio = contrast(resolve(t, fg), resolve(t, bg));
        assert.ok(ratio >= 4.5, `${name}: ${fg} ${resolve(t, fg)} on ${bg} ${resolve(t, bg)} is ${ratio.toFixed(2)}:1`);
      }
    }
  });
}

test('the media-query light theme matches the [data-theme="light"] block', () => {
  const attr = tokens(block(site, ':root[data-theme="light"] {'));
  const media = tokens(block(site, ':root:not([data-theme="dark"]) {'));
  assert.deepEqual(media, attr, 'keep the two light blocks in site.css identical');
});

for (const file of ['index.html', 'case-study.html', 'privacy.html']) {
  test(`${file} applies the saved theme before paint and loads the toggle script`, () => {
    const html = read(file);
    assert.match(html, /localStorage\.getItem\("rl-theme"\)/);
    assert.match(html, /<script src="\/theme\.js\?v=[0-9a-f]{8}" defer>/);
    assert.match(html, /class="theme-toggle"/);
    assert.match(html, /<main[ >]/, 'page has a main landmark');
  });
}
