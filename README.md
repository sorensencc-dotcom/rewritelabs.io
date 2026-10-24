# rewritelabs.io

Source for [rewritelabs.io](https://rewritelabs.io) and the scan/redesign pipeline behind it.

## Layout

| Path | What it is |
| --- | --- |
| `website/` | The static site served by Cloudflare Pages: landing page, case study, privacy policy, the waitlist function, and the self-hosted React and fonts. |
| `content-site/` | Astro app that builds `/blog` and `/ai-news-feed` into `website/`. See [content-site/README.md](content-site/README.md). |
| `engine/`, `scanner/`, `discovery/` | Site scanning, discovery and rewrite pipeline (Node). |
| `data/`, `reports/` | Pipeline data (feeds, metrics, results) and generated reports. |
| `setup/` | `validate.sh`, run by the bootstrap and nightly workflows. |
| `.github/workflows/` | `bootstrap`, `nightly-validate`, `dashboard`, and `publish-briefing` (opens a draft PR for each daily briefing). |

## Working on the website

The site makes no third-party requests. React (`website/vendor/`) and fonts (`website/fonts/`) are served from the site itself.

The landing, case study and privacy pages are React apps that are pre-rendered to static HTML and then hydrated, so crawlers see the content. The pre-rendered HTML is committed. After editing `website/screens.js`, `website/casestudy.js` or a page's inline script:

```bash
cd content-site
npm ci
npm run prerender   # regenerates the markup inside website/*.html
npm test            # fails if the committed pages are stale, or if a third-party host creeps back in
```

`npm run build` in `content-site` builds the blog and news feed, copies them into `website/`, writes `website/sitemap.xml`, and re-runs the pre-render.

To preview locally, serve `website/` with any static server after running the build, for example `npx serve website`.

## Checks

`.github/workflows/site-checks.yml` runs on every pull request and on pushes to `main`: the `content-site` tests, the pre-render freshness check, the production build, and a check that the build left the committed files unchanged. It runs on Node 22.23.4 like Cloudflare Pages (Astro 7 needs 22.23.4 or newer; a bare `22` can resolve to an older patch). Run the same locally with `cd content-site && npm ci && npm test && npm run build`.

## Themes and contrast

The look is the Hallmark "Console" theme: Host Grotesk for what a person reads, Atkinson Hyperlegible Mono for what an instrument measured, amber for a person and cool blue for an instrument. Dark (graphite) is the default. Light (paper) follows the system setting, and the nav toggle (`website/theme.js`) forces either one and remembers the choice in `localStorage`. The tokens live at the top of `website/site.css`: a dark block, a `[data-theme="light"]` block, and an identical `prefers-color-scheme: light` block. Edit the two light blocks together; a test checks they match, and that every text token (`--color-ink`, `--color-ink-2`, `--color-muted`, `--color-accent`, `--color-cool`, `--color-ok`, `--color-bad`) is at least 4.5:1 on `--color-paper` and `--color-paper-2` in both themes.

Fonts are self-hosted from `website/fonts/` (see `website/fonts.css`). The old Inter, Space Grotesk and JetBrains Mono files and the `website/_ds/` design-system folder are no longer referenced by any page; they can be deleted.

## Email signup on posts

Posts end with a signup form (`website/signup.js`) that posts to the same `/api/waitlist` function as the landing page, tagged with `source: "blog:<slug>"`. Tests for the function are in `content-site/tests/waitlist.test.mjs`.

The function is hardened against abuse: same-origin and JSON-only requests, a 2 KB body cap, a hidden honeypot field (`website`) that people never fill, and a limit of 5 new signups per visitor per hour (429 with `Retry-After`). The limit is keyed by a hash of the IP, so no raw address is stored, and it counts only new entries, so repeats and bad input cost nothing. An email already on the list gets the same answer as a new one. KV is eventually consistent, so the limit is approximate under a burst; add a Cloudflare rate limiting rule on `/api/waitlist` (Security, WAF, Rate limiting rules) as the hard edge limit. KV writes are metered (the free plan allows 1,000 a day), which is the other reason to keep that rule in place.

## Deploying

Cloudflare Pages settings:

- Build command: `cd content-site && npm ci && npm run build`
- Build output directory: `website`
- Environment variable: `NODE_VERSION=22.23.4`

`website/blog/`, `website/ai-news-feed/`, `website/_cs/` and `website/sitemap.xml` are build output and stay out of git.

The waitlist form posts to `functions/api/waitlist.js`, which stores emails in a Cloudflare KV namespace bound as `WAITLIST`. Pages only deploys functions from a `functions/` folder at the project root, not from inside the build output (`website/`). The KV binding is set in the Pages project (Settings, Bindings): variable name `WAITLIST`, namespace `rewritelabs-waitlist`, for both Production and Preview. Without it the function answers 503 `not_configured`.

### Caching

Cloudflare's default Browser Cache TTL is 4 hours and it overrides shorter origin values, so a visitor's browser can keep an old `site.css` or HTML page after a deploy. CSS and JS links therefore carry a content hash (`site.css?v=<hash>`): the build adds it to the blog layout and `npm run prerender` stamps it onto the static pages, so a changed file always has a new URL. Set the zone's Browser Cache TTL to "Respect Existing Headers" (Caching, Configuration) so HTML revalidates too.

## Updating vendored assets

- **React:** after bumping `react` or `react-dom` in `content-site/package.json`, copy `node_modules/{react,react-dom}/umd/*.production.min.js` into `website/vendor/`. The test compares them byte for byte.
- **Design system:** `website/_ds/` is synced from the Rewrite Labs design system. Keep `tokens/fonts.css` importing `/fonts.css` rather than Google Fonts; the test checks this.
- **Open Graph image:** `website/og.png` is 1200x630. Regenerate it by screenshotting an HTML page that uses the site fonts and colors.
