# notefor.one

An end-to-end encrypted service for sharing a note that can be consumed only once.

## Security model

- The browser encrypts notes with AES-256-GCM through the Web Crypto API.
- A new random encryption key and IV are generated for every note.
- The key stays in the URL fragment (`#key`), which browsers do not send to the server.
- MongoDB stores only ciphertext, an IV, a random identifier, and timestamps.
- Reading is an explicit POST action, so link-preview bots do not destroy notes.
- MongoDB's atomic `findOneAndDelete` guarantees that concurrent readers cannot both consume a note.
- Unopened notes expire automatically through a MongoDB TTL index.

This tool reduces accidental disclosure; it cannot protect a note after the recipient reveals it, a compromised browser, screenshots, malicious extensions, endpoint malware, or traffic sent without HTTPS. See [SECURITY.md](SECURITY.md).

## Requirements

- Node.js 20.19 or newer
- MongoDB 7 or newer for production
- HTTPS in production (required by Web Crypto outside localhost)

## Local development

```bash
npm ci
MEMORY_STORE=true npm start
```

The development server is available at `http://localhost:3000`. Development notes remain only in process memory and disappear when the process stops. This mode must never be enabled in production.

To use an existing MongoDB instance:

```bash
cp .env.example .env
npm start
```

## Production with Docker

```bash
docker build -t notefor-one:2 .
docker run --read-only --tmpfs /tmp --init \
  -e MONGO_URL='mongodb://mongo:27017' \
  -e MONGO_DB='notefor_one' \
  -e TRUST_PROXY='true' \
  -p 3000:3000 \
  notefor-one:2
```

Terminate TLS at a trusted reverse proxy and expose only the application port. Do not publish MongoDB to the internet.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URL` | Production | MongoDB connection string |
| `MONGO_DB` | No | Database name; defaults to `notefor_one` |
| `MONGO_POOL_SIZE` | No | Connection pool size; defaults to `10` |
| `PORT` | No | HTTP port; defaults to `3000` |
| `HOST` | No | Listen address; defaults to `0.0.0.0` |
| `TRUST_PROXY` | No | Set to `true` behind one trusted reverse proxy |
| `MEMORY_STORE` | Development only | Stores notes in process memory |

The legacy `SECRET`, `IV`, `ALGORITHM`, and `PUBLIC_URL` settings are no longer used. Version 2 stores new notes in the `notes_v2` collection and does not expose the old server-decryption API.

## Quality checks

```bash
npm test
npm audit
docker build -t notefor-one:2 .
```

## License

[MIT](LICENSE)
