# Development Workflow

Guidelines and commands for local development, testing, and pre-rendering across `rewritelabs-io`.

---

## Local Setup

### Prerequisites
- Node.js >= 22.23.4 (required by Astro 7).
- npm >= 10.x.

### Installation
```bash
# Install root dependencies
npm install

# Install content-site dependencies
cd content-site
npm install
cd ..
```

---

## Testing & Quality Gates

The repository contains an automated Node test suite under `content-site/tests/` asserting 53 quality gates:

```bash
# Run tests from project root
npm test

# Or directly in content-site
cd content-site
npm test
```

### Verified Test Contracts
1. **Payload & Dispatch Validation**: Calendar date sanity, token protection, body size limits, YAML escaping.
2. **Pre-render Parity**: Verification that committed `website/*.html` matches generated output.
3. **Third-Party Isolation**: Byte-for-byte check confirming self-hosted React and absence of third-party domains.
4. **Theme Contrast Ratios**: Automated check ensuring all text tokens maintain minimum 4.5:1 contrast in both light and dark themes.
5. **API Abuse Prevention**: In-memory KV mocks verifying waitlist rate limits, honeypot capture, and payload bounds.

---

## Pre-Rendering & Building

When editing `website/screens.js`, `website/casestudy.js`, or templates:

```bash
cd content-site
npm run prerender   # Regenerates static markup inside website/*.html
npm run build       # Compiles blog, briefings, sitemap, and re-runs pre-render
```

To preview the resulting static site:
```bash
npx serve website
```
