import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const website = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'website');
const read = (f) => fs.readFileSync(path.join(website, f), 'utf8');

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

// Tokens are OKLCH. Convert to linear sRGB for the WCAG relative-luminance formula.
const luminance = (color) => {
  const m = /^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)/.exec(color);
  assert.ok(m, `expected an oklch() colour, got ${color}`);
  const L = Number(m[1]) / 100;
  const C = Number(m[2]);
  const hue = (Number(m[3]) * Math.PI) / 180;
  const a = C * Math.cos(hue);
  const b = C * Math.sin(hue);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s];
  const [r, g, bl] = lin.map((x) => Math.min(1, Math.max(0, x)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const site = read('site.css');
const dark = tokens(block(site, ':root {\n  color-scheme: dark;'));
const light = { ...dark, ...tokens(block(site, ':root[data-theme="light"] {')) };

for (const [name, t] of [['dark', dark], ['light', light]]) {
  test(`${name} theme: text tokens are at least 4.5:1 on the page and card backgrounds`, () => {
    for (const fg of ['--color-ink', '--color-ink-2', '--color-muted', '--color-accent', '--color-cool', '--color-ok', '--color-bad']) {
      for (const bg of ['--color-paper', '--color-paper-2']) {
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

test('form fields have a visible resting border and the honeypot stays off screen', () => {
  assert.match(site, /\.field__input, \.signup__input \{[^}]*border: var\(--rule-hair\) solid var\(--color-muted\)/);
  assert.match(site, /\.hp \{ position: absolute; left: -9999px;/);
});
