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

## Check a payload without touching git

```bash
node C:\dev\rewritelabs-io\content-site\scripts\publish-briefing.mjs briefing-payload.json --dry-run
```

`payload.example.json` in this folder is a schema example only. Its title and links are fake. Never publish it.

## Requirements on the machine that runs the skill

- A checkout of the `rewritelabs.io` repo at `C:\dev\rewritelabs-io` with `content-site/` merged to `main`.
- `git` and an authenticated `gh` that can push branches and open PRs on `sorensencc-dotcom/rewritelabs.io`.
- Node 20 or newer.
