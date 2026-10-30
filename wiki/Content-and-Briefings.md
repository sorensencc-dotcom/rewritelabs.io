# Content and Briefings

How daily AI synthesis briefings and blog articles are produced, verified, and published.

---

## 1. Daily AI Briefings (Step 8c Pipeline)

Briefings are daily intelligence digests synthesized across primary research sources (e.g., DeepMind, Anthropic, arXiv, frontier announcements).

### The Ingestion Flow
1. Research agent generates `briefing-payload.json` matching the schema in `content-site/STEP-8C.md`.
2. Script execution:
   ```bash
   node content-site/scripts/publish-briefing.mjs briefing-payload.json
   ```
3. Creates a new branch `briefing/<YYYY-MM-DD>` and opens a pull request on GitHub.
4. CI workflow `.github/workflows/site-checks.yml` validates schema conformance and builds site artifacts.
5. Upon human operator review, the PR is merged into `main`, immediately triggering Cloudflare Pages deployment.

### Schema Fields
- `date`: Valid calendar date (`YYYY-MM-DD`).
- `title`: Standardized briefing title.
- `confidenceScore`: Metric between 0.0 and 1.0 based on corroborated evidence.
- `sourcesEvaluated`: Integer count of examined sources.
- `themes`: Array of themes with acceleration velocity (`accelerating`, `stable`, `fading`) and primary URLs.

---

## 2. Blog Posts

Blog articles reside in `content-site/src/content/blog/<slug>.md`.

### Frontmatter Schema
```yaml
---
title: "Why Local Service Sites Fail Mobile Audits"
date: "2026-10-24"
description: "Analysis of mobile performance across local contractor websites."
topics: ["web-performance", "field-notes"]
---
```

### Writing Disciplines
- **Active Voice & Grounded Claims**: Back metrics with real audit logs.
- **Unslop Enforcement**: Prohibits generic buzzwords, em dashes, and non-standard typographical replacements.
- **Self-Hosted Imagery**: Diagrams and screenshots must reside in local asset directories.
