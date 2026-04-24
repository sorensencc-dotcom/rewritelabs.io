# GitHub Copilot Toolbox — MCP & Skills awareness

_Generated: 2026-04-23T04:28:46.239Z_

## How to use this report

- **Saved copy:** This file is **`.github/copilot-toolbox-mcp-skills-awareness.md`** — refreshed whenever the toolbox runs an MCP & Skills scan (including on workspace open when auto-scan is enabled). It is meant for **Copilot workspace context** together with `.github/copilot-instructions.md` (which gets a shorter replaceable summary when auto-merge is on).
- **MCP:** Lists **configured** servers from `mcp.json`. **Live tool use** still requires **Copilot Chat → Agent** with those servers **trusted/started** in the MCP tools UI.
- **Skills:** **On-disk** folders with `SKILL.md`. Copilot does not auto-load them; attach `SKILL.md` or paths in chat when useful.
- **Task routing:** When the user’s request matches a server’s purpose (e.g. Confluence → Confluence/Atlassian MCP), prefer that **server id** from the tables below.

---

## MCP — workspace

Workspace `mcp.json` _(folder: rewrite-mcp)_

- **c:\Users\soren\google-drive-mcp\rewrite-mcp\.vscode\mcp.json** — _File missing_

_No active workspace servers in mcp.json._

## MCP — user profile

- **C:\Users\soren\AppData\Roaming\Code\User\mcp.json** — _File exists — servers defined_

| Server id | Kind | Detail |
|-----------|------|--------|
| io.github.github/github-mcp-server | http | https://api.githubcopilot.com/mcp/ |
| makenotion/notion-mcp-server | http | https://mcp.notion.com/sse |

## Skills (local `SKILL.md` folders)

### Project-scoped

_None found (or no workspace open)._

### User-scoped

_None found._

---

## Suggested next steps

- **MCP:** Command Palette → `MCP: List Servers` (or this extension’s hub **MCP** tab) → start/trust servers in **Copilot Chat → Agent → tools**.
- **Edit config:** `MCP: Open Workspace Folder MCP Configuration` / `MCP: Open User Configuration`.
- **Refresh this report:** run **Intelligence — scan MCP & Skills awareness** again after changing `mcp.json` or adding skills.

_Report from GitHub Copilot Toolbox extension._
