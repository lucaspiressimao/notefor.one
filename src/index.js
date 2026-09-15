"use strict";

require("dotenv").config({ quiet: true });

const { MongoClient } = require("mongodb");
const { createApp } = require("./app");
const { createMemoryNotesRepository, createMongoNotesRepository } = require("./notes-repository");

const port = Number.parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "0.0.0.0";

async function connectRepository() {
  if (process.env.MEMORY_STORE === "true") {
    if (process.env.NODE_ENV === "production") throw new Error("MEMORY_STORE cannot be used in production");
    return { notes: createMemoryNotesRepository(), close: async () => {} };
  }

  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is required. Use MEMORY_STORE=true only for local development.");
  }

  const client = new MongoClient(process.env.MONGO_URL, {
    maxPoolSize: Number.parseInt(process.env.MONGO_POOL_SIZE || "10", 10),
    serverSelectionTimeoutMS: 10_000,
  });
  await client.connect();
  const notes = createMongoNotesRepository(client.db(process.env.MONGO_DB || "notefor_one"));
  await notes.initialize();
  return { notes, close: () => client.close() };
}

async function main() {
  const repository = await connectRepository();
  const app = createApp({ notes: repository.notes, trustProxy: process.env.TRUST_PROXY === "true" });
  const server = app.listen(port, host, () => console.log(`notefor.one listening on http://${host}:${port}`));

  async function shutdown(signal) {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await repository.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("Failed to start notefor.one:", error.message);
  process.exit(1);
});
