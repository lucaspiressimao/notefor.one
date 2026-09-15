"use strict";

const revealButton = document.querySelector("#reveal-button");
const noteElement = document.querySelector("#note");
const status = document.querySelector("#status");
const explanation = document.querySelector("#explanation");
const warning = document.querySelector("#warning");
const keyFragment = location.hash.slice(1);

function fromBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("The encryption key is missing or invalid.");
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function setError(message) {
  status.textContent = message;
  status.classList.add("error");
}

if (!keyFragment) {
  revealButton.disabled = true;
  setError("This link does not contain an encryption key. Ask the sender for the complete link.");
}

revealButton.addEventListener("click", async () => {
  revealButton.disabled = true;
  history.replaceState(null, "", location.pathname);
  status.classList.remove("error");
  status.textContent = "Consuming the encrypted note…";

  try {
    const id = location.pathname.split("/").filter(Boolean).at(-1);
    const response = await fetch(`/api/notes/${encodeURIComponent(id)}/consume`, { method: "POST" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "The note could not be retrieved.");

    const rawKey = fromBase64Url(keyFragment);
    if (rawKey.byteLength !== 32) throw new Error("The encryption key is invalid. The note has been destroyed.");
    const key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64Url(payload.iv) },
      key,
      fromBase64Url(payload.ciphertext),
    );

    noteElement.textContent = new TextDecoder("utf-8", { fatal: true }).decode(plaintext);
    noteElement.classList.remove("hidden");
    explanation.textContent = "This note has been permanently removed from the server. Save it now if you need it.";
    warning.classList.add("hidden");
    status.textContent = "Note revealed and destroyed.";
    revealButton.classList.add("hidden");
  } catch (error) {
    setError(error.message || "The note could not be decrypted and may already be destroyed.");
  }
});
