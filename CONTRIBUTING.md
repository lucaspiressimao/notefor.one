# Contributing to notefor.one

Thank you for helping make private note sharing safer and easier to self-host.

## Before opening an issue

- Search existing issues and discussions for the same topic.
- Use GitHub's private vulnerability reporting for security-sensitive findings.
- Never include real notes, credentials, connection strings, encryption keys, or production logs containing private data.

Use issues for reproducible bugs and scoped feature requests. Use discussions for questions, design exploration, deployment ideas, and broader proposals.

## Local setup

```bash
nvm use
npm ci
MEMORY_STORE=true npm start
```

Then open `http://localhost:3000`. The development memory store is ephemeral and must not be used in production.

## Pull requests

1. Fork the repository and create a focused branch.
2. Keep changes small enough to review and explain the security implications.
3. Add or update tests for behavior changes.
4. Run `npm test` and `npm audit --audit-level=low`.
5. Update the README, security documentation, and changelog when applicable.
6. Open a pull request using the provided template.

Do not weaken client-side encryption, move keys out of URL fragments, make note consumption non-atomic, or add third-party browser resources without a documented threat-model review.

## Code style

- Use strict mode and semicolons in JavaScript.
- Prefer platform APIs and small, auditable dependencies.
- Validate data at trust boundaries.
- Keep plaintext and encryption keys out of server code, logs, storage, and telemetry.
- Preserve the strict Content Security Policy and dependency-free browser client.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
