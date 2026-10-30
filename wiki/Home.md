# Rewrite Labs

Welcome to the **Rewrite Labs** platform documentation wiki.

Rewrite Labs builds sovereign, local-first automation tools designed to run on your own ground—ensuring your data, models, and API keys remain on your own machines.

---

## Systems & Subsystems

```
┌────────────────────────────────────────────────────────────────────────┐
│                        rewritelabs.io Platform                         │
├───────────────────────────┬────────────────────────────────────────────┤
│  website/                 │ Pre-rendered static landing, case study,   │
│                           │ privacy policy & self-hosted React assets  │
├───────────────────────────┼────────────────────────────────────────────┤
│  content-site/            │ Astro 7 application compiling /blog and    │
│                           │ /ai-news-feed into website/ output         │
├───────────────────────────┼────────────────────────────────────────────┤
│  functions/               │ Cloudflare Pages edge functions for        │
│                           │ waitlist ingestion & KV rate limiting      │
├───────────────────────────┼────────────────────────────────────────────┤
│  engine/, scanner/        │ Core discovery, scanning, and redesign     │
│                           │ pipeline for client sites                  │
└───────────────────────────┴────────────────────────────────────────────┘
```

### 1. Web Platform & Content Engine
- **Pre-rendered Static Front-End**: React application rendered to static HTML at build time for crawler accessibility and zero-latency first paint, hydrated at runtime.
- **Astro Content Engine**: Markdown-driven blog and daily AI news feed compiler located in `content-site/`.
- **Zero Third-Party Dependency Rule**: All fonts (Host Grotesk, Atkinson Hyperlegible Mono) and React vendor bundles are strictly self-hosted; zero external tracking or render-blocking scripts.

### 2. Edge API & Functions
- **Waitlist API**: Edge serverless function located at `functions/api/waitlist.js` connected to Cloudflare KV (`WAITLIST`).
- **Abuse Prevention**: Rate-limited (5 submissions per IP/hr), honeypot anti-spam, 2 KB payload cap, and JSON-only transport.

### 3. Discovery & Scanner Engine
- Located in `engine/`, `scanner/`, and `discovery/`.
- Automated discovery and health audits of small business web properties.

---

## Wiki Documentation Index

- [[Architecture|Architecture]] — Full system design, components, and data flow.
- [[Development-Workflow|Development Workflow]] — Local environment setup, test suites, and pre-rendering.
- [[Content-and-Briefings|Content and Briefings]] — Step 8c AI synthesis pipeline and blog authoring.
- [[Deployment-and-Operations|Deployment and Operations]] — Cloudflare Pages settings, KV bindings, and edge caching.

---

## Ecosystem Integration

Rewrite Labs serves as the umbrella platform coordinating four specialized tools:
- **TRM (Topic Research Matrix)**: Evidence-grounded research pipeline with verifiable citations.
- **Sigil**: Cryptographically signed, audited agent-to-agent relay with human-in-the-loop approvals.
- **Toolforge**: Governed skills and plugin marketplace for autonomous coding agents.
- **kb-sync**: Local-first knowledge base with zero-network semantic and full-text search.
