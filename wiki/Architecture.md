# Platform Architecture

`rewritelabs.io` combines a static pre-rendered front end with an Astro content compiler and Cloudflare Pages edge functions.

---

## High-Level Topology

```
                  ┌──────────────────────────────┐
                  │    Cloudflare Pages Edge     │
                  └──────────────┬───────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
          ▼                      ▼                      ▼
   Static Assets           Astro Content         Edge Functions
   - website/index.html    - /blog/*             - /api/waitlist
   - website/case-study    - /ai-news-feed/*     - KV: WAITLIST
   - website/privacy       - website/sitemap.xml
   - Self-hosted fonts
   - Self-hosted React
```

---

## Core Components

### 1. Static Web Surface (`website/`)
- Pure HTML, CSS, and JS served from Cloudflare's edge cache.
- Pages are pre-rendered into static markup (`website/index.html`, `website/case-study.html`, `website/privacy.html`) so search crawlers and non-JS clients receive complete content immediately.
- On client load, `website/theme.js` immediately applies saved color theme preferences before paint to prevent theme flash, followed by React hydration.

### 2. Astro Content Compiler (`content-site/`)
- Astro 7 static site generator responsible for:
  1. Authoring and compiling `/blog` Markdown articles.
  2. Compiling `/ai-news-feed` daily intelligence briefings.
  3. Generating RSS feeds (`/blog/rss.xml`, `/ai-news-feed/rss.xml`).
  4. Generating `website/sitemap.xml`.
  5. Running `prerender-pages.mjs` to update landing pages with latest content hashes and markup.

### 3. Edge Serverless API (`functions/api/`)
- Hosted on Cloudflare Pages runtime.
- Handles waitlist submissions via `POST /api/waitlist`.
- Interfaces with Cloudflare KV namespace `WAITLIST`.
- Features strict abuse controls:
  - JSON body validation capped at 2,048 bytes.
  - Rate limiting enforced at 5 signups per IP per hour.
  - Honeypot check rejecting hidden form fields.

### 4. Client Discovery & Scanner (`engine/`, `scanner/`, `discovery/`)
- Site crawlers and Lighthouse audit automation.
- Ingests domain metrics, assesses mobile responsiveness, contrast, and performance failures.
