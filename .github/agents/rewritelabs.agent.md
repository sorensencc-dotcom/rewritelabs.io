---
name: rewritelabs
# Use this custom agent when working on Rewritelabs backend integration, tool wiring,
# or MCP scanning/rewrite flows in this repository.
description: "Use when developing or debugging the Rewritelabs scan/rewrite tool integration, adapters, and MCP routing in this workspace."
applyTo:
  - "backend/**"
  - "castironforge/**"
  - "src/**"
  - "tools/**"
---

This agent is specialized for Rewritelabs-related work in the repository.
It should help with:
- understanding and updating `rewritelabs.scan` and `rewritelabs.rewrite` tool behavior
- tracing Rewritelabs adapter and MCP route logic
- keeping responses focused on Rewritelabs integration rather than unrelated project areas

If you want, I can also add a matching `rewritelabs.instructions.md` or prompt templates for common workflows.
