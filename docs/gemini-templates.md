# Gemini Prompt Templates

## Overview

This document contains concise, reusable Gemini CLI prompt templates for common project tasks: harvest, redesign, and deploy. Each template includes a short description, required context variables, the prompt text to paste into the CLI, and an example invocation.

---

## Template: Harvest

Purpose: Collect and summarize relevant files, data, and metadata from the repository or a specified directory.

Required variables: project_root, target_path, file_types, depth, output_format

Prompt:
\`\`\`
Harvest files and metadata

Project root: {{project_root}}
Target path: {{target_path}}
File types: {{file_types}}
Depth: {{depth}}
Output format: {{output_format}}

Task: Search the repository under the target path for files matching the file types. For each file, extract a one-paragraph summary, the file path, file size, last modified date, and any TODO or FIXME comments. Produce a consolidated report in the requested output format. Include a short list of 5 recommended next actions.

Constraints: Do not modify files. If the target path is missing, default to the project root. If no files match, return an explicit "no matches" result.
\`\`\`

Example invocation:
\`\`\`
project_root: /home/soren/rewrite-mcp
target_path: crawler/
file_types: .js;.py;.md
depth: 3
output_format: markdown
\`\`\`

---

## Template: Redesign

Purpose: Propose a focused redesign for a specified component, page, or module.

Required variables: component_path, audience, goals, constraints, style_reference

Prompt:
\`\`\`
Redesign component

Component path: {{component_path}}
Audience: {{audience}}
Goals: {{goals}}
Constraints: {{constraints}}
Style reference: {{style_reference}}

Task: Review the component files at the given path and propose a redesign that meets the goals and constraints. Provide: 1) a one-paragraph rationale, 2) a prioritized list of UI/UX changes, 3) a code-level checklist of required edits, 4) suggested copy changes, and 5) a minimal CSS/JS snippet or pseudocode illustrating the core change. Include accessibility considerations and performance impact estimates.

Constraints: Keep changes minimal and backward compatible. Provide clear file and line references for each suggested edit.
\`\`\`

---

## Template: Deploy

Purpose: Prepare and validate a deployment plan for a release.

Required variables: release_tag, environment, services, preflight_checks, rollback_strategy

Prompt:
\`\`\`
Prepare deployment plan

Release tag: {{release_tag}}
Environment: {{environment}}
Services: {{services}}
Preflight checks: {{preflight_checks}}
Rollback strategy: {{rollback_strategy}}

Task: Generate a step-by-step deployment plan for the specified environment. Include: 1) preflight checklist with commands to run, 2) exact deployment commands or CI job names, 3) verification steps and health checks, 4) monitoring and alerting configuration to watch during rollout, 5) rollback steps with commands and estimated time to recover. Highlight any risky steps and mitigation strategies.

Constraints: Assume zero-downtime deployment where possible. If zero-downtime is not feasible, specify maintenance window and user-facing messaging.
\`\`\`

---

## Best practices

- Provide precise context variables when invoking templates.
- Keep prompts focused and scoped to a path or depth for large repos.
- Review generated code and run tests before merging.

