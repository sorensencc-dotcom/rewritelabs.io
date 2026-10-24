// Validates blog posts in content-site/src/content/blog/ against schema and /unslop rules.
// Usage: node scripts/validate-blog.mjs [path-to-post.md]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const blogDir = path.resolve(here, '../src/content/blog');

const BANNED_WORDS = [
  'delve',
  'testament',
  'pivotal',
  'crucial',
  'tapestry',
  'groundbreaking',
  'vibrant',
  'fostering',
  'showcase',
  'nestled',
  'seamlessly',
];

const CURLY_QUOTES = /[\u2018\u2019\u201C\u201D]/;
const EM_DASH = /\u2014|—/;

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('File must begin with YAML frontmatter fenced by ---');
  }
  const rawYaml = match[1];
  const body = match[2] || '';
  
  // Lightweight key-value parsing for expected schema fields
  const data = {};
  const lines = rawYaml.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    
    if (val.startsWith('"') && val.endsWith('"')) {
      val = JSON.parse(val);
    } else if (val.startsWith('[') && val.endsWith(']')) {
      try {
        val = JSON.parse(val);
      } catch {
        // Fallback for simple single-quoted or unquoted list
        val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
      }
    } else if (val === 'true') {
      val = true;
    } else if (val === 'false') {
      val = false;
    }
    data[key] = val;
  }
  return { data, body };
}

function isRealDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function validateBlogPost(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const errors = [];
  const warnings = [];

  let parsed;
  try {
    parsed = parseFrontmatter(text);
  } catch (err) {
    return { valid: false, errors: [err.message], warnings: [] };
  }

  const { data, body } = parsed;

  // Schema requirements
  if (!data.title || typeof data.title !== 'string' || data.title.length > 200) {
    errors.push('title is required (string up to 200 characters)');
  }
  if (!data.date || !isRealDate(String(data.date))) {
    errors.push('date is required (real calendar date in YYYY-MM-DD format)');
  }
  if (!data.description || typeof data.description !== 'string' || data.description.length > 300) {
    errors.push('description is required (string up to 300 characters)');
  }
  if (!Array.isArray(data.topics) || data.topics.length === 0) {
    errors.push('topics must be a non-empty array of topic strings');
  }
  if (data.image !== undefined && (!data.image.startsWith('/') || typeof data.image !== 'string')) {
    errors.push('image must be a path starting with "/"');
  }
  if (data.originalUrl !== undefined && !/^https?:\/\//i.test(data.originalUrl)) {
    errors.push('originalUrl must be a full http(s) URL');
  }
  if (data.draft !== undefined && typeof data.draft !== 'boolean') {
    errors.push('draft must be a boolean');
  }

  // Unslop checks
  if (EM_DASH.test(body) || EM_DASH.test(text)) {
    errors.push('unslop violation: em dash detected. Use periods or commas instead.');
  }
  if (CURLY_QUOTES.test(body) || CURLY_QUOTES.test(text)) {
    errors.push('unslop violation: curly quote detected. Use straight quotes.');
  }

  const lowerBody = body.toLowerCase();
  for (const word of BANNED_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lowerBody)) {
      warnings.push(`unslop warning: banned AI buzzword "${word}" detected.`);
    }
  }

  // Check heading capitalization (sentence case)
  const headingMatches = body.match(/^#{1,6}\s+(.*)$/gm) || [];
  for (const h of headingMatches) {
    const headingText = h.replace(/^#{1,6}\s+/, '').trim();
    const words = headingText.split(/\s+/);
    if (words.length > 2) {
      // Check if subsequent words are incorrectly Title Cased (ignore capitalized acronyms like HTML/CSS/AI/GTM)
      const nonFirstWords = words.slice(1);
      const titleCasedWords = nonFirstWords.filter((w) => /^[A-Z][a-z]+$/.test(w));
      if (titleCasedWords.length > nonFirstWords.length / 2) {
        warnings.push(`unslop warning: heading "${headingText}" appears to be Title Case; use sentence case.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function run() {
  const target = process.argv[2];
  const files = target
    ? [path.resolve(process.cwd(), target)]
    : fs.readdirSync(blogDir).filter((f) => f.endsWith('.md')).map((f) => path.join(blogDir, f));

  let hasErrors = false;
  for (const file of files) {
    const rel = path.relative(process.cwd(), file);
    const result = validateBlogPost(file);
    if (!result.valid) {
      hasErrors = true;
      console.error(`FAIL: ${rel}`);
      result.errors.forEach((e) => console.error(`  - ERROR: ${e}`));
    } else {
      console.log(`PASS: ${rel}`);
    }
    result.warnings.forEach((w) => console.warn(`  - WARN: ${w}`));
  }

  if (hasErrors) {
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  run();
}
