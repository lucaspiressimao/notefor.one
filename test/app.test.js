"use strict";

const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");
const { createApp } = require("../src/app");

const servers = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((resolve) => server.close(resolve))));
});

function createRepository() {
  const records = new Map();
  return {
    records,
    async create(note) { records.set(note.id, note); },
    async consume(id) {
      const note = records.get(id) || null;
      records.delete(id);
      return note;
    },
    async health() {},
  };
}

async function startApp(repository = createRepository()) {
  const server = createApp({ notes: repository }).listen(0, "127.0.0.1");
  servers.push(server);
  await new Promise((resolve) => server.once("listening", resolve));
  return { repository, origin: `http://127.0.0.1:${server.address().port}` };
}

const encryptedPayload = {
  version: 1,
  ciphertext: "A".repeat(32),
  iv: "B".repeat(16),
  expiresInSeconds: 3600,
};

test("creates only validated encrypted notes", async () => {
  const { repository, origin } = await startApp();
  const invalid = await fetch(`${origin}/api/notes`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ note: "plaintext" }),
  });
  assert.equal(invalid.status, 400);

  const response = await fetch(`${origin}/api/notes`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(encryptedPayload),
  });
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.match(body.path, /^\/read\/[A-Za-z0-9_-]{24}$/);
  assert.equal(repository.records.size, 1);
  assert.equal([...repository.records.values()][0].note, undefined);
});

test("consumes a note exactly once under concurrent requests", async () => {
  const { origin } = await startApp();
  const created = await fetch(`${origin}/api/notes`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(encryptedPayload),
  }).then((response) => response.json());
  const id = created.path.split("/").at(-1);

  const responses = await Promise.all([
    fetch(`${origin}/api/notes/${id}/consume`, { method: "POST" }),
    fetch(`${origin}/api/notes/${id}/consume`, { method: "POST" }),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 404]);
});

test("rejects expired notes after atomically removing them", async () => {
  const repository = createRepository();
  const id = "A".repeat(24);
  repository.records.set(id, { ...encryptedPayload, id, expiresAt: new Date(Date.now() - 1000) });
  const { origin } = await startApp(repository);
  const response = await fetch(`${origin}/api/notes/${id}/consume`, { method: "POST" });
  assert.equal(response.status, 404);
  assert.equal(repository.records.has(id), false);
});

test("blocks cross-site writes and sends hardened browser headers", async () => {
  const { origin } = await startApp();
  const blocked = await fetch(`${origin}/api/notes`, {
    method: "POST",
    headers: { "content-type": "application/json", "sec-fetch-site": "cross-site" },
    body: JSON.stringify(encryptedPayload),
  });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.headers.get("cache-control"), "no-store");

  const malformed = await fetch(`${origin}/api/notes`, {
    method: "POST", headers: { "content-type": "application/json" }, body: "{",
  });
  assert.equal(malformed.status, 400);

  const page = await fetch(origin);
  assert.match(page.headers.get("content-security-policy"), /default-src 'self'/);
  assert.equal(page.headers.get("referrer-policy"), "no-referrer");
  assert.equal(page.headers.get("x-content-type-options"), "nosniff");
  assert.equal(page.headers.get("x-powered-by"), null);
  assert.match(page.headers.get("permissions-policy"), /camera=\(\)/);
});
