# Step 8c: publish the briefing to rewritelabs.io

Paste this block into the `daily-ai-news-summary` skill after Step 8b (NotebookLM and Drive persistence). Step 8c is the only step that touches the public site, and it only opens a draft PR. A human marks it ready and merges to publish.

## Instruction block for the skill

> **Step 8c. Public draft.** After the Drive dashboard is saved, write `briefing-payload.json` using the contract below, then run:
>
> ```bash
> node C:\dev\rewritelabs-io\content-site\scripts\publish-briefing.mjs briefing-payload.json
> ```
>
> The command prints a draft PR URL. Add that URL to the run summary. If the command exits non-zero, report the error text and continue. Never retry in a loop, never edit the site repo by hand, and never skip a theme's primary sources: a theme with no corroborated primary link is left out of the payload.

## Payload contract

| Field | Type | Source in the pipeline |
|---|---|---|
| `title` | string | "AI Synthesis Briefing: Month D, YYYY" |
| `date` | `YYYY-MM-DD` | Run date |
| `confidenceScore` | number, 0 to 1 | Overall weighted confidence. Divide by 100 if the pipeline scores 0 to 100. |
| `sourcesEvaluated` | integer | Whitelisted sources that produced mail today (default 8) |
| `summary` | string, optional | One or two sentences of original synthesis |
| `topics` | string[], optional | Lowercase topic keywords. Briefings and blog posts that share a topic link to each other. |
| `relatedPosts` | string[], optional | Blog slugs to link explicitly |
| `themes[]` | array, at least one | One entry per clustered theme |
| `themes[].name` | string | Theme cluster name |
| `themes[].delta7d` | `accelerating`, `stable`, or `decelerating` | 7-day trend delta |
| `themes[].summary` | string | Original synthesis, not copied newsletter blurbs |
| `themes[].tags` | string[] | Action tags without brackets: `IMPLEMENT`, `RESEARCH`, `EVALUATE`, `MONITOR` |
| `themes[].primarySources[]` | `{title, url}`, at least one | Primary links found during external corroboration. `http(s)` only. |
| `bodyMarkdown` | string, optional | Operator commentary. Link a blog post as `/blog/<slug>/`. |

Fair-use rule: link the primary source, credit the curators that surfaced it in the summary, and write the synthesis in your own words.

## What the validator enforces

Every field is written into frontmatter or a page, so a wrong type either fails the whole site build or changes what is published. The payload is rejected, with the reason, if:

- `date` is not a real calendar day (`2026-13-45` is refused; JavaScript would otherwise read it as 14 February 2027).
- `sourcesEvaluated` is not a whole number from 1 to 1000 (it is written into frontmatter as-is, so a string could add keys).
- `topics`, `relatedPosts` or a theme's `tags` is not a list of short single-line text values, or a `relatedPosts` entry is not a slug.
- a theme has no `primarySources`, or a source `url` is not a full `http://` or `https://` link.
- `bodyMarkdown` contains raw HTML or a `javascript:`, `data:` or `vbscript:` link. Use Markdown. Autolinks such as `<https://example.org>` are fine.
- text is over its limit: title 200, summary 1,500, theme name 120, theme summary 3,000, source title 300, body 30,000 characters, and at most 20 themes with 20 sources each.

GitHub's `repository_dispatch` accepts at most **10 top-level properties** and 65,535 characters in `client_payload`. The contract above uses 9 top-level properties, so there is room for one more; do not add more than one without nesting them.

## Publishing and CI

`publish-briefing.mjs` refuses to run if `briefing/<date>` already exists on origin, and also if `content-site/src/content/briefings/<date>.md` is already on `main`, so a repeat run cannot replace a published briefing. Edit that file by hand instead.

The Publish briefing workflow opens the draft PR and then starts the Site checks workflow on the branch. A PR opened with the default `GITHUB_TOKEN` does not trigger `pull_request` workflows, so without that step no tests or build would run on a briefing PR. A briefing that does not match the content schema turns the check red before it can be merged.

## Check a payload without touching git

```bash
node C:\dev\rewritelabs-io\content-site\scripts\publish-briefing.mjs briefing-payload.json --dry-run
```

`payload.example.json` in this folder is a schema example only. Its title and links are fake. Never publish it.

## Requirements on the machine that runs the skill

- A checkout of the `rewritelabs.io` repo at `C:\dev\rewritelabs-io` with `content-site/` merged to `main`.
- `git` and an authenticated `gh` that can push branches and open PRs on `sorensencc-dotcom/rewritelabs.io`.
- Node 20 or newer.
