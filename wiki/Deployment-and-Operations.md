# Deployment and Operations

Production deployment architecture, Cloudflare Pages integration, and operational runbooks.

---

## Cloudflare Pages Configuration

- **Repository Target**: `sorensencc-dotcom/rewritelabs.io`
- **Production Branch**: `main`
- **Root Directory**: Empty (repository root)
- **Build Command**:
  ```bash
  cd content-site && npm ci && npm run build
  ```
- **Build Output Directory**: `website`
- **Environment Variables**:
  - `NODE_VERSION`: `22.23.4` (Astro 7 minimum requirement)
  - `SKIP_DEPENDENCY_INSTALL`: `1` (Prevents Cloudflare from executing superfluous root `npm ci`)

---

## Edge Storage & KV Bindings

### Variable Bindings
- **Binding Name**: `WAITLIST`
- **Namespace**: `rewritelabs-waitlist`
- **Environments**: Configured for both **Production** and **Preview** deployments.

> [!WARNING]
> Without the `WAITLIST` binding, `/api/waitlist` safely responds with HTTP `503 Service Unavailable` (`not_configured`).

---

## Caching Strategy & Cache Invalidation

1. **Asset Hashing**: All CSS and JS links include a deterministic build hash (`site.css?v=<hash>`), guaranteeing instant cache invalidation upon redeployment.
2. **Edge Cache Configuration**: Cloudflare Zone Browser Cache TTL is configured to **Respect Existing Headers** so HTML files revalidate frequently.
