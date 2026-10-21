import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DELTAS = ['accelerating', 'stable', 'decelerating'];
const defaultDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/content/briefings');

function fail(msg) {
  throw new Error(`invalid briefing payload: ${msg}`);
}

export function validatePayload(p) {
  if (!p || typeof p !== 'object') fail('payload must be an object');
  if (typeof p.title !== 'string' || !p.title.trim()) fail('title is required');
  if (typeof p.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) fail('date must be YYYY-MM-DD');
  if (typeof p.confidenceScore !== 'number' || p.confidenceScore < 0 || p.confidenceScore > 1) {
    fail('confidenceScore must be a number from 0 to 1');
  }
  if (!Array.isArray(p.themes) || p.themes.length === 0) fail('themes must be a non-empty array');
  for (const t of p.themes) {
    if (!t.name || !t.summary) fail('each theme needs name and summary');
    if (!DELTAS.includes(t.delta7d)) fail(`delta7d must be one of ${DELTAS.join(', ')}`);
    if (!Array.isArray(t.primarySources) || t.primarySources.length === 0) {
      fail(`theme "${t.name}" needs at least one primary source`);
    }
    for (const s of t.primarySources) {
      if (!s.title || !/^https?:\/\//i.test(s.url ?? '')) fail(`theme "${t.name}" has a source without an http(s) url`);
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

export function exportBriefing(payload, contentDir = defaultDir) {
  const text = renderBriefing(payload);
  fs.mkdirSync(contentDir, { recursive: true });
  const filePath = path.join(contentDir, `${payload.date}.md`);
  fs.writeFileSync(filePath, text, 'utf8');
  return filePath;
}
