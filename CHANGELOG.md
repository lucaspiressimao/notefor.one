# Changelog

## 2.0.1 — 2026-09-15

- Added explicit rate limiting to one-time note pages following CodeQL review.

## 2.0.0 — 2026-09-15

### Security

- Replaced predictable `Math.random` identifiers with 144-bit cryptographic identifiers.
- Replaced server-side AES-CTR with browser-side AES-256-GCM and a unique key and IV per note.
- Moved encryption keys into URL fragments so they are not sent to the server.
- Made note consumption an explicit, atomic POST operation.
- Added Content Security Policy, no-referrer policy, HSTS, permissions restrictions, rate limits, payload limits, and cross-site write protection.
- Added automatic expiration through a MongoDB TTL index.

### Performance and maintenance

- Upgraded to supported Node.js, Express, and MongoDB driver versions.
- Removed Handlebars, Bootstrap CDN, body-parser, the obsolete crypto package, and runtime MongoDB downloads.
- Replaced server-rendered pages with cacheable, dependency-free static HTML, CSS, and JavaScript.
- Added automated tests, npm auditing, CodeQL, Dependabot, and container builds in CI.
- Added a non-root production container with a health check.

### Breaking changes

- Version 1 URLs and API endpoints are not supported by version 2.
- Existing ephemeral notes remain in the legacy collection and are not migrated.
- Production now requires `MONGO_URL`; legacy `SECRET`, `IV`, `ALGORITHM`, and `PUBLIC_URL` variables are ignored.
