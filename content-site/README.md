# content-site

Astro app for `rewritelabs.io/blog` and `rewritelabs.io/ai-news-feed`. It builds static pages and copies them into `website/`, so one Cloudflare Pages project serves the whole site.

## Layout

- `src/content/blog/` holds market research posts (markdown).
- `src/content/briefings/` holds daily AI briefings. The scripts generate these files.
- `src/pages/` has the index, detail, and RSS routes for both sections.
- Pages link each other by shared `topics` or explicit `relatedPosts` and `relatedBriefings` slugs.

## Commands

```bash
npm ci
npm test        # exporter tests
npm run dev     # local Astro dev server (needs website/site.css served at /site.css to look right)
npm run build   # build, then copy dist/blog, dist/ai-news-feed into ../website
```

## Cloudflare Pages settings

- Build command: `cd content-site && npm ci && npm run build`
- Build output directory: `website`
- Environment variable: `NODE_VERSION=20`

`website/blog/`, `website/ai-news-feed/`, and `website/_cs/` are build output and stay out of git.

## Publishing a briefing (Step 8c)

The daily news skill writes a payload JSON (see `scripts/export-briefing.mjs` for the shape), then runs:

```bash
node scripts/publish-briefing.mjs payload.json
```

That validates the payload, commits `content-site/src/content/briefings/<date>.md` on a `briefing/<date>` branch in a temporary worktree, pushes it, and opens a draft PR. Marking the PR ready and merging publishes it. Add `--dry-run` to validate without touching git.

Source links must be `http(s)`. Every theme needs at least one primary source.
