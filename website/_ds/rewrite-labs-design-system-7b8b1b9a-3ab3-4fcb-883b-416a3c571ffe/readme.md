# Rewrite Labs — Design System

## Company & product
Rewrite Labs finds outdated small-business websites, generates a modern redesign automatically with AI, and sells the delivery. Pipeline: **Discover** (crawler scores sites on design age, mobile-readiness, page speed, accessibility) → **Redesign** (AI generates a mockup from the business's existing content/branding) → **Outreach** (personalized before/after preview sent to the owner) → **Deliver** (human-refined, production-ready site shipped to the paying client). Currently pre-launch, collecting a waitlist. Based in Tampa, FL.

**Source used to build this system:** the live marketing site, [rewritelabs-io.pages.dev](https://rewritelabs-io.pages.dev/) (fetched Aug 8 2026 — one page: hero, live-scan demo panel, stat strip, 4-step process, waitlist form, footer). No codebase, Figma file, or asset package was attached or accessible this run — see Caveats.

## Components (`components/core/`)
Enumerated from the single available source (the live page's own UI), not a generic library — see `readme.md` → Caveats before assuming coverage.
- **Button** — primary/secondary/ghost, 3 sizes
- **Badge** — pill status tag (bad/warn/good/neutral) for scan verdicts
- **Input** — email field with focus ring
- **StatCard** — mono-numeral metric readout (Design Age, Page Speed, …)
- **ProcessStep** — numbered pipeline step card

### Intentional additions
None beyond what's visible on the live page — Button/Input/Badge/StatCard/ProcessStep are all directly observed UI, just factored into reusable primitives.

## UI kits
- `ui_kits/marketing-site/` — full click-through recreation of the live landing page (Nav, Hero + live-scan panel, stat strip, process section, interactive waitlist form, footer).

## Foundations (`tokens/`, cards under `guidelines/`)
Colors, type, spacing, radius, shadow, motion — see VISUAL FOUNDATIONS below. All exposed as CSS custom properties via `styles.css`.

## Index
```
styles.css              — @import manifest (link this one file)
tokens/                 — colors, typography, spacing, radius, shadows, fonts, base reset
guidelines/*.html        — @dsCard specimen cards (Colors, Type, Spacing, Brand)
components/core/         — Button, Badge, Input, StatCard, ProcessStep (+ .d.ts, .prompt.md, card)
ui_kits/marketing-site/  — landing page recreation (Screens.jsx + index.html)
thumbnail.html           — project tile
SKILL.md                 — Claude Code / Agent Skills portable version
```

## CONTENT FUNDAMENTALS
- **Voice**: direct, second/first-person plural mixed — copy addresses the *problem* more than the reader ("The Internet Is Full of Outdated Websites. We Fix That."), then switches to "we" for capability claims ("Our AI pipeline handles every step"). No "you" in the hero at all; "you" appears only in the transactional CTA context ("your business," "we'll reach out when we're ready for you").
- **Sentence rhythm**: short declaratives, often fragments, stacked for punch: *"We find outdated websites. We redesign them automatically. We deliver."* (og:description). Headlines split across two visual beats rather than one long line.
- **Casing**: sentence case throughout, no title-case headlines. Section labels ("The Process", "Early Access") are short title-case eyebrows, not full sentences.
- **Numbers as proof, not decoration**: 200M+, 94%, 3s, step counters (01/04) — always paired with a plain-English claim, never a bare stat.
- **No emoji in body copy** — emoji appear only as literal step-icon glyphs (🔍 ✦ 📬 🚀), never inline in sentences.
- **Tone**: confident, slightly urgent (scanning/scoring language — "worst offenders", "no manual prospecting"), but not hypey — no exclamation points anywhere in the scraped copy.
- **CTAs**: verb-first, arrow-suffixed — "Get Early Access →", "Join Waitlist →", "See How It Works ↓".

## VISUAL FOUNDATIONS — rebrand (Aug 2026)
Rebranded per direct request for a bolder, "on fire", dev-tool-confident identity — no new brand assets were supplied, so this is still a placeholder direction, now deliberately more distinctive than the neutral placeholder before it.
- **Palette**: deep charcoal-navy ink (`--ink-1 #0F0F1A`, `--ink-2 #1A1A2E`) with a hot-pink brand accent (`--pink-400 #FF1F5A`) that gets a soft glow on hover/focus (`--brand-glow`), replacing the earlier amber. Amber/red/green stay as semantic-only scan-verdict colors (bad/warn/good), now fully decoupled from the brand accent.
- **Type**: Space Grotesk (display/headlines, bold, tight tracking) + Inter (body) + JetBrains Mono (numeric readouts, URLs, step counters, badges) — sharper, more technical pairing for a dev-tool feel.
- **Motif**: a before/after mini-browser pair in the hero demo panel makes the "minutes, not months" transformation pitch visible, not just stated.
- **Radius**: tightened (4/8/12px) for a crisper, less soft edge.
- **Backgrounds**: flat ink, no gradients, no photography, no illustration, no texture/grain. The one "image" on the page is the live-scan demo panel, built entirely from UI (stat cards + badges), not imagery.
- **Cards**: border-first, not shadow-first — 1px `--border-subtle` outline, `--radius-lg` (16px) corners, a soft inset+ambient shadow (`--shadow-card`) rather than a hard drop shadow. Dark-mode convention: elevation reads through a lighter fill (`--ink-2` → `--ink-3`), not a bigger shadow.
- **Buttons**: filled amber primary (dark text on light accent, the one high-contrast element per view), outline secondary, text-only ghost. Hover = color shift one step up the amber ramp; no scale/shrink on press, no bounce.
- **Motion**: fast and understated — 120–220ms, standard ease-out curve, color/opacity transitions only. No spring/bounce easing found or implied anywhere.
- **Corners**: small-to-medium radii (6/10/16px), pill-shaped only for tags/badges.
- **Borders vs shadows**: borders define the shape, shadow adds depth sparingly (raised panels like the hero demo card only).
- **Transparency/blur**: used once, functionally — the sticky nav gets `backdrop-filter: blur` + translucent ink so content can scroll underneath.
- **Layout**: single sticky top nav; everything else scrolls in one column of centered, max-width (1120px) sections — no fixed sidebars, no floating action buttons.
- **Imagery color vibe**: none present — page is 100% typography/UI, no photos to characterize.

## ICONOGRAPHY
No icon font, SVG icon set, or icon library is used anywhere on the live site. The 4 process steps use plain **emoji** (🔍 ✦ 📬 🚀) as their only iconographic device; nothing else on the page uses an icon. No unicode symbols-as-icons beyond the arrow glyphs in CTAs (→ ↓). If the product later needs a real icon set, **Lucide** (CDN) is the recommended default — closest stroke weight/fill style to the emoji's simple, single-color treatment — flagged here as a substitution, not something observed in the source.

## Fonts — substitution flag
No font files were supplied. Space Grotesk / Inter / JetBrains Mono are **Google Fonts substitutes** picked for the new bolder, technical direction — not confirmed against any real typeface. **Please share the actual font files or names if you have them**, and I'll swap the `@font-face` declarations in `tokens/fonts.css`.

## Brand mark
No logo file was provided anywhere in this run. Per direction, the mark is now **wordmark-only**: "Rewrite/Labs" set in Space Grotesk + JetBrains Mono with a pink slash as the only mark (`guidelines/brand-mark.html`, nav, footer) — the earlier monogram box was dropped. This is **not** a real logo; if a logo file exists, add it to `assets/` and it will replace this placeholder.

## Caveats — please read
- **Built from one live page only.** No GitHub repo, Figma file, deck, or asset package was attached this run (the code-source question in the intake form was left unanswered, and the "other assets" answer was "it might be lost"). Everything here — colors, fonts, spacing, motion, the component set — is inferred from the rendered marketing page's copy and structure, not from real design source. Treat every numeric token as a reasonable placeholder, not ground truth.
- No other product surfaces (app dashboard, docs, admin/operator console) were available to build a second UI kit for, even though the company likely has one (an operator console was referenced only in unverifiable secondhand notes, not in anything you gave me — I did not build against it).
- If you can attach the actual codebase, a Figma file, brand assets, or font files, I can replace every placeholder above with the real thing — that's the single highest-value next step.
