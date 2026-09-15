# Security policy

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting for this repository. Do not open a public issue containing exploit details, private notes, database credentials, or deployment secrets.

Include the affected version, reproduction steps, impact, and any suggested mitigation. Reports will be acknowledged as soon as practical.

## Deployment expectations

- Serve the application only over HTTPS.
- Keep MongoDB on a private network with authentication and encrypted transport where available.
- Run the container as its built-in non-root user with a read-only filesystem.
- Set `TRUST_PROXY=true` only when exactly one trusted reverse proxy is in front of the application.
- Keep Node.js, the container base image, and npm dependencies patched.
- Backups can contain encrypted notes. Protect and expire backups according to the sensitivity of your users.

## Cryptographic design

Version 2 encrypts note content in the sender's browser with AES-256-GCM. The key is encoded in the URL fragment and is not included in HTTP requests. The server stores opaque ciphertext and removes it atomically on consumption.

This design does not provide sender authentication, recipient authentication, forward secrecy after endpoint compromise, or protection from malicious client code served by a compromised host. Users must trust the deployed JavaScript and their browser environment.
