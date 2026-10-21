import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DELTAS = ['accelerating', 'stable', 'decelerating'];
const defaultDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/content/briefings');

function fail(msg) {
  throw new Error(`invalid briefing payload: ${msg}`);
}

const MAX = { title: 200, summary: 1500, themeName: 120, themeSummary: 3000, sourceTitle: 300, url: 2000, topic: 60, body: 30000, themes: 20, sources: 20 };
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Raw HTML tags (autolinks such as <https://example.org> are not tags) and links with script-capable schemes.
const RAW_HTML = /<\/?[a-z][a-z0-9-]*(?:\s[^>]*)?\/?>/i;
const BAD_LINK = /\]\(\s*(?:javascript|data|vbscript):/i;

const isText = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const isStringList = (v, max, pattern) =>
  Array.isArray(v) && v.length <= 50 && v.every((x) => isText(x, max) && !/[\r\n]/.test(x) && (!pattern || pattern.test(x)));

// The date becomes a file name and a frontmatter value. JavaScript's date parser is lenient (2026-13-45 reads as
// 14 February 2027), so check that it round-trips to the same calendar day.
function isRealDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function isHttpUrl(u) {
  if (typeof u !== 'string' || u.length > MAX.url || !/^https?:\/\/[^\s/]/i.test(u)) return false; // the parser alone also accepts http:/x and https:x
  try {
    return ['http:', 'https:'].includes(new URL(u).protocol);
  } catch {
    return false;
  }
}

// Everything here is written into frontmatter or a page, so each field is checked for the type the collection
// schema expects. A wrong type would otherwise either fail the whole site build or change what is published.
export function validatePayload(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) fail('payload must be an object');
  if (!isText(p.title, MAX.title)) fail(`title is required (text, up to ${MAX.title} characters)`);
  if (!isRealDate(p.date)) fail('date must be a real calendar date in YYYY-MM-DD form');
  if (typeof p.confidenceScore !== 'number' || !Number.isFinite(p.confidenceScore) || p.confidenceScore < 0 || p.confidenceScore > 1) {
    fail('confidenceScore must be a number from 0 to 1');
  }
  if (p.sourcesEvaluated !== undefined && (!Number.isInteger(p.sourcesEvaluated) || p.sourcesEvaluated < 1 || p.sourcesEvaluated > 1000)) {
    fail('sourcesEvaluated must be a whole number from 1 to 1000');
  }
  if (p.summary !== undefined && !isText(p.summary, MAX.summary)) fail(`summary must be text up to ${MAX.summary} characters`);
  if (p.topics !== undefined && !isStringList(p.topics, MAX.topic)) fail('topics must be a list of short text values');
  if (p.relatedPosts !== undefined && !isStringList(p.relatedPosts, MAX.topic, SLUG)) fail('relatedPosts must be a list of blog slugs');
  if (p.bodyMarkdown !== undefined) {
    if (typeof p.bodyMarkdown !== 'string' || p.bodyMarkdown.length > MAX.body) fail(`bodyMarkdown must be text up to ${MAX.body} characters`);
    if (RAW_HTML.test(p.bodyMarkdown)) fail('bodyMarkdown must not contain raw HTML; use Markdown');
    if (BAD_LINK.test(p.bodyMarkdown)) fail('bodyMarkdown must not contain javascript:, data: or vbscript: links');
  }
  if (!Array.isArray(p.themes) || p.themes.length === 0 || p.themes.length > MAX.themes) {
    fail(`themes must be a list of 1 to ${MAX.themes} entries`);
  }
  for (const t of p.themes) {
    if (!t || typeof t !== 'object') fail('each theme must be an object');
    if (!isText(t.name, MAX.themeName) || !isText(t.summary, MAX.themeSummary)) fail('each theme needs a name and a summary (text)');
    if (!DELTAS.includes(t.delta7d)) fail(`delta7d must be one of ${DELTAS.join(', ')}`);
    if (t.tags !== undefined && !isStringList(t.tags, MAX.topic)) fail(`theme "${t.name}" tags must be a list of short text values`);
    if (!Array.isArray(t.primarySources) || t.primarySources.length === 0 || t.primarySources.length > MAX.sources) {
      fail(`theme "${t.name}" needs at least one primary source`);
    }
    for (const s of t.primarySources) {
      if (!s || !isText(s.title, MAX.sourceTitle) || !isHttpUrl(s.url)) fail(`theme "${t.name}" has a source without a title and an http(s) url`);
    }
  }
}

export function renderBriefing(p) {
  validatePayload(p);
  const j = JSON.stringify;
  const lines = [
    '---',
    `title: ${j(p.title)}`,
    `date: ${p.date}`,
    `sourcesEvaluated: ${p.sourcesEvaluated ?? 8}`,
    `confidenceScore: ${p.confidenceScore}`,
  ];
  if (p.summary) lines.push(`summary: ${j(p.summary)}`);
  if (p.topics?.length) lines.push(`topics: ${j(p.topics)}`);
  if (p.relatedPosts?.length) lines.push(`relatedPosts: ${j(p.relatedPosts)}`);
  lines.push('themes:');
  for (const t of p.themes) {
    lines.push(
      `  - name: ${j(t.name)}`,
      `    delta7d: ${j(t.delta7d)}`,
      `    summary: ${j(t.summary)}`,
      `    tags: ${j(t.tags ?? [])}`,
      '    primarySources:',
    );
    for (const s of t.primarySources) {
      lines.push(`      - title: ${j(s.title)}`, `        url: ${j(s.url)}`);
    }
  }
  lines.push('---', '', p.bodyMarkdown ?? '', '');
  return lines.join('\n');
}

// Where a briefing for a date lives, relative to the repo root. Used to refuse overwriting a published one.
export const briefingRepoPath = (date) => `content-site/src/content/briefings/${date}.md`;

export function exportBriefing(payload, contentDir = defaultDir) {
  const text = renderBriefing(payload);
  fs.mkdirSync(contentDir, { recursive: true });
  const filePath = path.join(contentDir, `${payload.date}.md`);
  fs.writeFileSync(filePath, text, 'utf8');
  return filePath;
}
