"use strict";

function createMongoNotesRepository(db) {
  const collection = db.collection("notes_v2");
  return {
    async initialize() {
      await Promise.all([
        collection.createIndex({ id: 1 }, { unique: true }),
        collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      ]);
    },
    async create(note) {
      await collection.insertOne(note);
    },
    async consume(id) {
      return collection.findOneAndDelete({ id }, { includeResultMetadata: false });
    },
    async health() {
      await db.command({ ping: 1 });
    },
  };
}

function createMemoryNotesRepository() {
  const notes = new Map();
  return {
    async initialize() {},
    async create(note) { notes.set(note.id, note); },
    async consume(id) {
      const note = notes.get(id) || null;
      notes.delete(id);
      return note;
    },
    async health() {},
  };
}

module.exports = { createMemoryNotesRepository, createMongoNotesRepository };
