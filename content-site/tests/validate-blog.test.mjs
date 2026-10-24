import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateBlogPost } from '../scripts/validate-blog.mjs';

function createTempPost(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-val-'));
  const filePath = path.join(dir, 'test-post.md');
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

test('valid blog post passes validation', () => {
  const file = createTempPost(`---
title: "Valid Post Title"
date: 2026-10-24
description: "A valid description under character limit."
topics: ["testing", "dev"]
draft: false
---

This is valid body text without em dashes or curly quotes.
`);
  const result = validateBlogPost(file);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('rejects missing or malformed frontmatter', () => {
  const file = createTempPost(`No frontmatter here.`);
  const result = validateBlogPost(file);
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /YAML frontmatter/);
});

test('rejects unslop violations: em dash and curly quotes', () => {
  const fileWithDash = createTempPost(`---
title: "Post with Dash"
date: 2026-10-24
description: "Desc"
topics: ["test"]
---

Here is an em dash \u2014 which is banned.
`);
  const resDash = validateBlogPost(fileWithDash);
  assert.equal(resDash.valid, false);
  assert.match(resDash.errors[0], /em dash/);

  const fileWithCurly = createTempPost(`---
title: "Post with Curly"
date: 2026-10-24
description: "Desc"
topics: ["test"]
---

Here is a \u201Ccurly quote\u201D which is banned.
`);
  const resCurly = validateBlogPost(fileWithCurly);
  assert.equal(resCurly.valid, false);
  assert.match(resCurly.errors[0], /curly quote/);
});

test('warns on banned AI buzzwords', () => {
  const file = createTempPost(`---
title: "Post with Buzzwords"
date: 2026-10-24
description: "Desc"
topics: ["test"]
---

We will delve into this crucial topic today.
`);
  const result = validateBlogPost(file);
  assert.equal(result.valid, true);
  assert.ok(result.warnings.some((w) => w.includes('delve')));
  assert.ok(result.warnings.some((w) => w.includes('crucial')));
});
