import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { exportBriefing, renderBriefing, validatePayload } from '../scripts/export-briefing.mjs';

const base = () => ({
  title: 'Briefing with "quotes" and a \\ backslash',
  date: '2026-10-21',
  confidenceScore: 0.9,
  summary: 'line one\nline two: with colon',
  themes: [
    {
      name: 'Theme: A',
      delta7d: 'accelerating',
      summary: 'Summary # not a comment',
      tags: ['RESEARCH'],
      primarySources: [{ title: 'Spec', url: 'https://example.org/spec' }],
    },
  ],
});

test('writes <date>.md and keeps tricky strings parseable as JSON-quoted YAML', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brief-'));
  const file = exportBriefing(base(), dir);
  assert.equal(path.basename(file), '2026-10-21.md');
  const text = fs.readFileSync(file, 'utf8');
  assert.match(text, /^title: "Briefing with \\"quotes\\" and a \\\\ backslash"$/m);
  assert.match(text, /^summary: "line one\\nline two: with colon"$/m);
});

test('rejects non-http source links', () => {
  const p = base();
  p.themes[0].primarySources[0].url = 'javascript:alert(1)';
  assert.throws(() => validatePayload(p), /http\(s\)/);
});

test('rejects bad date, confidence, and missing sources', () => {
  assert.throws(() => renderBriefing({ ...base(), date: '10/21/2026' }), /YYYY-MM-DD/);
  assert.throws(() => renderBriefing({ ...base(), confidenceScore: 1.5 }), /0 to 1/);
  const p = base();
  p.themes[0].primarySources = [];
  assert.throws(() => renderBriefing(p), /primary source/);
});

const theme = () => base().themes[0];
const withTheme = (patch) => ({ ...base(), themes: [{ ...theme(), ...patch }] });

test('rejects dates that are not on the calendar, even though JavaScript would read them as another day', () => {
  for (const date of ['2026-13-45', '2026-02-30', '2027-02-29', '2026-00-10', '2026-10-32']) {
    assert.throws(() => validatePayload({ ...base(), date }), /real calendar date/, date);
  }
  for (const date of ['2028-02-29', '2026-12-31', '2026-01-01']) validatePayload({ ...base(), date });
});

test('sourcesEvaluated must be a whole number, so it cannot smuggle extra frontmatter keys', () => {
  for (const v of ['8\nconfidenceScore: 0.01', '8', 0, -1, 2.5, 5000, null]) {
    assert.throws(() => renderBriefing({ ...base(), sourcesEvaluated: v }), /sourcesEvaluated/, String(v));
  }
  assert.match(renderBriefing({ ...base(), sourcesEvaluated: 12 }), /^sourcesEvaluated: 12$/m);
  assert.match(renderBriefing(base()), /^sourcesEvaluated: 8$/m, 'defaults to 8 when omitted');
});

test('rejects wrong types that would fail the whole site build or change what is published', () => {
  assert.throws(() => validatePayload({ ...base(), topics: 'abc' }), /topics/);
  assert.throws(() => validatePayload({ ...base(), topics: [{ a: 1 }] }), /topics/);
  assert.throws(() => validatePayload({ ...base(), topics: ['ok\nnot: ok'] }), /topics/);
  assert.throws(() => validatePayload({ ...base(), relatedPosts: ['Not A Slug'] }), /relatedPosts/);
  assert.throws(() => validatePayload({ ...base(), summary: { x: 1 } }), /summary/);
  assert.throws(() => validatePayload({ ...base(), title: 42 }), /title/);
  assert.throws(() => validatePayload({ ...base(), confidenceScore: Number.NaN }), /confidenceScore/);
  assert.throws(() => validatePayload(withTheme({ tags: 'RESEARCH' })), /tags/);
  assert.throws(() => validatePayload(withTheme({ name: 7 })), /name/);
  assert.throws(() => validatePayload([]), /object/);
});

test('rejects sources whose url only looks like http(s)', () => {
  for (const url of ['https://', 'http:/nope', 'https:evil', 'ftp://example.org', 'https://example.org/' + 'a'.repeat(2100)]) {
    assert.throws(() => validatePayload(withTheme({ primarySources: [{ title: 'x', url }] })), /http\(s\)/, url);
  }
  validatePayload(withTheme({ primarySources: [{ title: 'x', url: 'https://example.org/a?b=1#c' }] }));
});

test('bodyMarkdown: plain Markdown and autolinks are fine, raw HTML and script links are not', () => {
  const ok = '## Heading\n\nSee [the post](/blog/autonomy-is-a-tooling-problem/) and <https://example.org/spec>.\n\n- a < b and c > d';
  validatePayload({ ...base(), bodyMarkdown: ok });
  for (const bad of ['<script>alert(1)</script>', 'hi <img src=x onerror=alert(1)>', '<iframe src="https://x"></iframe>', '<div>x</div>', '[x](javascript:alert(1))', '[x]( data:text/html;base64,AAA)']) {
    assert.throws(() => validatePayload({ ...base(), bodyMarkdown: bad }), /bodyMarkdown/, bad);
  }
});

test('limits how much text a payload can carry', () => {
  assert.throws(() => validatePayload({ ...base(), title: 'x'.repeat(201) }), /title/);
  assert.throws(() => validatePayload({ ...base(), bodyMarkdown: 'x'.repeat(30001) }), /bodyMarkdown/);
  assert.throws(() => validatePayload({ ...base(), themes: Array.from({ length: 21 }, theme) }), /themes/);
});

test('the example payload from the docs is valid, and a minimal real briefing renders', () => {
  const example = JSON.parse(fs.readFileSync(new URL('../payload.example.json', import.meta.url), 'utf8'));
  validatePayload(example);
  const text = renderBriefing({ title: 'T', date: '2026-10-21', confidenceScore: 1, themes: [theme()] });
  assert.match(text, /^confidenceScore: 1$/m);
});

test('the repo path helper points at the briefings folder the site reads', async () => {
  const { briefingRepoPath } = await import('../scripts/export-briefing.mjs');
  assert.equal(briefingRepoPath('2026-10-21'), 'content-site/src/content/briefings/2026-10-21.md');
});
