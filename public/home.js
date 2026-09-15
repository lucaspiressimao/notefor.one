"use strict";

const form = document.querySelector("#note-form");
const noteInput = document.querySelector("#note");
const expirationInput = document.querySelector("#expiration");
const createButton = document.querySelector("#create-button");
const copyButton = document.querySelector("#copy-button");
const shareUrlInput = document.querySelector("#share-url");
const result = document.querySelector("#result");
const status = document.querySelector("#status");
const characterCount = document.querySelector("#character-count");

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

noteInput.addEventListener("input", () => {
  characterCount.textContent = noteInput.value.length.toLocaleString("en-US");
  result.classList.add("hidden");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const plaintext = noteInput.value;
  if (!plaintext.trim()) return setStatus("Write a note before creating a link.", true);
  if (!globalThis.crypto?.subtle) return setStatus("This browser does not support secure encryption.", true);

  createButton.disabled = true;
  setStatus("Encrypting locally…");
  result.classList.add("hidden");

  try {
    const encoded = new TextEncoder().encode(plaintext);
    if (encoded.byteLength > 32_000) throw new Error("The UTF-8 note is too large. Keep it under 32 KB.");

    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
    const rawKey = new Uint8Array(await crypto.subtle.exportKey("raw", key));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded));

    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        version: 1,
        ciphertext: toBase64Url(ciphertext),
        iv: toBase64Url(iv),
        expiresInSeconds: Number(expirationInput.value),
      }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "The note could not be created.");

    shareUrlInput.value = `${location.origin}${payload.path}#${toBase64Url(rawKey)}`;
    result.classList.remove("hidden");
    noteInput.value = "";
    characterCount.textContent = "0";
    setStatus("Private link created. It can be consumed only once.");
    shareUrlInput.focus();
    shareUrlInput.select();
  } catch (error) {
    setStatus(error.message || "The note could not be created.", true);
  } finally {
    createButton.disabled = false;
  }
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareUrlInput.value);
    copyButton.textContent = "Copied";
  } catch {
    shareUrlInput.focus();
    shareUrlInput.select();
    setStatus("Select and copy the link manually.");
  }
});
