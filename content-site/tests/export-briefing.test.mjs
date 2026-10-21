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
