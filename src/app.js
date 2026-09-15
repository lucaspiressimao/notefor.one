"use strict";

const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const ID_PATTERN = /^[A-Za-z0-9_-]{24}$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_CIPHERTEXT_LENGTH = 45_000;
const MIN_EXPIRATION_SECONDS = 300;
const MAX_EXPIRATION_SECONDS = 7 * 24 * 60 * 60;

function isValidEncryptedNote(body) {
  return Boolean(
    body && body.version === 1 &&
    typeof body.ciphertext === "string" && body.ciphertext.length >= 22 &&
    body.ciphertext.length <= MAX_CIPHERTEXT_LENGTH && BASE64URL_PATTERN.test(body.ciphertext) &&
    typeof body.iv === "string" && body.iv.length === 16 && BASE64URL_PATTERN.test(body.iv) &&
    Number.isInteger(body.expiresInSeconds) && body.expiresInSeconds >= MIN_EXPIRATION_SECONDS &&
    body.expiresInSeconds <= MAX_EXPIRATION_SECONDS
  );
}

function rejectCrossSite(req, res, next) {
  if (req.get("sec-fetch-site") === "cross-site") {
    return res.status(403).json({ error: "Cross-site requests are not allowed." });
  }
  return next();
}

function createApp({ notes, trustProxy = false }) {
  if (!notes) throw new TypeError("A notes repository is required");
  const app = express();
  const publicDirectory = path.join(__dirname, "..", "public");

  app.disable("x-powered-by");
  if (trustProxy) app.set("trust proxy", 1);
  app.use(helmet({
    contentSecurityPolicy: { directives: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"],
      imgSrc: ["'self'", "data:"], connectSrc: ["'self'"], fontSrc: ["'self'"],
      objectSrc: ["'none'"], baseUri: ["'none'"], frameAncestors: ["'none'"],
      formAction: ["'self'"], upgradeInsecureRequests: [],
    } },
    referrerPolicy: { policy: "no-referrer" },
    strictTransportSecurity: { maxAge: 31_536_000, includeSubDomains: true },
  }));
  app.use((req, res, next) => {
    res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
    if (req.path.startsWith("/api/") || req.path === "/healthz") res.set("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "64kb", strict: true, type: "application/json" }));
  app.use(rejectCrossSite);

  const createLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false,
    message: { error: "Too many notes created. Please try again later." },
  });
  const consumeLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false,
    message: { error: "Too many read attempts. Please try again later." },
  });

  app.get("/healthz", async (req, res, next) => {
    try {
      await notes.health();
      res.set("Cache-Control", "no-store").json({ status: "ok" });
    } catch (error) { next(error); }
  });

  app.post("/api/notes", createLimiter, async (req, res, next) => {
    try {
      if (!req.is("application/json") || !isValidEncryptedNote(req.body)) {
        return res.status(400).json({ error: "Invalid encrypted note." });
      }
      const id = crypto.randomBytes(18).toString("base64url");
      const now = new Date();
      await notes.create({
        id, version: 1, ciphertext: req.body.ciphertext, iv: req.body.iv, createdAt: now,
        expiresAt: new Date(now.getTime() + req.body.expiresInSeconds * 1000),
      });
      return res.status(201).set("Cache-Control", "no-store").json({ path: `/read/${id}` });
    } catch (error) { return next(error); }
  });

  app.post("/api/notes/:id/consume", consumeLimiter, async (req, res, next) => {
    try {
      if (!ID_PATTERN.test(req.params.id)) {
        return res.status(404).json({ error: "Note not found or already destroyed." });
      }
      const note = await notes.consume(req.params.id);
      if (!note || note.expiresAt <= new Date()) {
        return res.status(404).json({ error: "Note not found, expired, or already destroyed." });
      }
      return res.set("Cache-Control", "no-store").json({
        version: note.version, ciphertext: note.ciphertext, iv: note.iv,
      });
    } catch (error) { return next(error); }
  });

  app.get("/read/:id", (req, res) => {
    if (!ID_PATTERN.test(req.params.id)) {
      return res.status(404).sendFile(path.join(publicDirectory, "404.html"));
    }
    return res.set("Cache-Control", "no-store").sendFile(path.join(publicDirectory, "read.html"));
  });

  app.use(express.static(publicDirectory, {
    etag: true, maxAge: "1h",
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) res.setHeader("Cache-Control", "no-store");
    },
  }));
  app.use((req, res) => res.status(404).sendFile(path.join(publicDirectory, "404.html")));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Malformed JSON." });
    }
    if (error.type === "entity.too.large") {
      return res.status(413).json({ error: "Request body is too large." });
    }
    console.error("Request failed:", error.message);
    if (req.path.startsWith("/api/") || req.path === "/healthz") {
      return res.status(500).json({ error: "The request could not be completed." });
    }
    return res.status(500).sendFile(path.join(publicDirectory, "404.html"));
  });
  return app;
}

module.exports = { createApp, isValidEncryptedNote };
