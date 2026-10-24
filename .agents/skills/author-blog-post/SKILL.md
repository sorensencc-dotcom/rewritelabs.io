---
name: author-blog-post
description: Use when drafting, authoring, or validating a blog post for the Rewrite Labs content site (content-site/src/content/blog/). Enforces Astro collection schema, /unslop editorial discipline, pre-render verification, and draft PR conventions.
---

# Author Blog Post

Use this skill to author, validate, and publish market research and field note blog posts for Rewrite Labs.

## 1. Post Schema Contract

Every post lives in `content-site/src/content/blog/<slug>.md` and must conform to the Astro collection schema in `content-site/src/content.config.ts`:

```yaml
---
title: "Why Local Service Sites Fail Mobile Audits" # string, max 200 chars
date: 2026-10-24 # real calendar day in YYYY-MM-DD
description: "Brief summary for meta tags and the blog index card." # string, max 300 chars
topics: ["web-performance", "field-notes"] # string array, matches briefing tags where applicable
relatedBriefings: ["2026-10-20"] # optional: links to daily AI news briefings
image: "/img/my-card.jpg" # optional: leading slash required
imageAlt: "Accessible description of social card image" # optional
originalUrl: "https://example.com/source" # optional: must be http(s)
originalLabel: "LinkedIn" # optional
draft: false # boolean, defaults to false
---
```

## 2. Editorial Discipline (`/unslop`)

All blog posts must strictly comply with the Rewrite Labs editorial discipline:

1. **Zero em dashes.** Do not use `—` or `\u2014`. End the sentence or use a comma.
2. **Straight quotes only.** Do not use curly quotes (`“`, `”`, `‘`, `’`).
3. **No mid-sentence colons.** Colons introduce lists or examples, not connecting clauses.
4. **Sentence case headings.** Use `## What the audit showed`, not `## What The Audit Showed`.
5. **No AI filler vocabulary.** Ban words like *delve*, *testament*, *pivotal*, *crucial*, *landscape*, *tapestry*, *groundbreaking*, *vibrant*, *fostering*, *showcase*, and *seamlessly*.
6. **Active voice and concrete numbers.** Name real actors, measurements, and failure modes rather than vague feelings or puffery.
7. **No decorative emojis.**

## 3. Workflow Steps

### Step 1: Draft the Post
Create the new file at `content-site/src/content/blog/<slug>.md` using the frontmatter schema above and applying the `/unslop` discipline to the prose.

### Step 2: Validate Frontmatter and Unslop Rules
Run the deterministic blog validator:

```bash
node content-site/scripts/validate-blog.mjs content-site/src/content/blog/<slug>.md
```

If the validator outputs any errors, fix the file before proceeding. Address any warnings regarding banned vocabulary or heading capitalization.

### Step 3: Run Full Site Build & Pre-Render
Generate static routes, update RSS feeds, and verify pre-rendered HTML:

```bash
cd content-site
npm run build
```

Verify that Astro builds `<slug>/index.html` into `dist/blog/` and `website/blog/` without errors.

### Step 4: Run the Test Suite
Ensure no regression in pre-render freshness, contrast tokens, or sitemap generation:

```bash
cd content-site
npm test
```

All unit and regression tests must pass.

### Step 5: Commit and Open Draft PR
1. Create a branch: `feat/blog-<slug>`.
2. Stage the new post in `content-site/src/content/blog/<slug>.md`.
3. Commit using Conventional Commits with co-author trailer:
   ```text
   feat(blog): <imperative summary>

   <Explanation of topic and evidence>

   Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
   ```
4. Push to `origin` and open a draft PR:
   ```bash
   gh pr create --draft --base main --head feat/blog-<slug> --title "feat(blog): <title>" --body "Draft blog post for review. Review the narrative, topic tags, and metadata, then mark ready to merge and publish."
   ```
