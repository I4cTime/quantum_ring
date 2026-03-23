/**
 * Agent Memory — Persistent State Across Sessions
 *
 * Stores key-value pairs in an encrypted JSON file so the AI agent
 * can remember decisions, rotations performed, and project-specific
 * context between conversations.
 *
 * Data is encrypted using AES-256-GCM derived from a machine-specific
 * fingerprint (hostname + username), so it only decrypts on the same machine.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir, hostname, userInfo } from "node:os";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const MEMORY_FILE = "agent-memory.enc";

function getMemoryDir(): string {
  const dir = join(homedir(), ".config", "q-ring");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getMemoryPath(): string {
  return join(getMemoryDir(), MEMORY_FILE);
}

function deriveKey(): Buffer {
  const fingerprint = `qring-memory:${hostname()}:${userInfo().username}`;
  return createHash("sha256").update(fingerprint).digest();
}

function encrypt(data: string): string {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all base64)
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decrypt(blob: string): string {
  const parts = blob.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted format");
  const iv = Buffer.from(parts[0], "base64");
  const tag = Buffer.from(parts[1], "base64");
  const encrypted = Buffer.from(parts[2], "base64");

  const key = deriveKey();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

interface MemoryStore {
  entries: Record<string, { value: string; updatedAt: string }>;
}

function loadStore(): MemoryStore {
  const path = getMemoryPath();
  if (!existsSync(path)) {
    return { entries: {} };
  }
  try {
    const raw = readFileSync(path, "utf8");
    const decrypted = decrypt(raw);
    return JSON.parse(decrypted);
  } catch {
    return { entries: {} };
  }
}

function saveStore(store: MemoryStore): void {
  const json = JSON.stringify(store);
  const encrypted = encrypt(json);
  writeFileSync(getMemoryPath(), encrypted, "utf8");
}

/**
 * Store a value in agent memory.
 */
export function remember(key: string, value: string): void {
  const store = loadStore();
  store.entries[key] = {
    value,
    updatedAt: new Date().toISOString(),
  };
  saveStore(store);
}

/**
 * Retrieve a value from agent memory.
 */
export function recall(key: string): string | null {
  const store = loadStore();
  return store.entries[key]?.value ?? null;
}

/**
 * List all keys in agent memory.
 */
export function listMemory(): Array<{ key: string; updatedAt: string }> {
  const store = loadStore();
  return Object.entries(store.entries).map(([key, entry]) => ({
    key,
    updatedAt: entry.updatedAt,
  }));
}

/**
 * Delete a key from agent memory.
 */
export function forget(key: string): boolean {
  const store = loadStore();
  if (key in store.entries) {
    delete store.entries[key];
    saveStore(store);
    return true;
  }
  return false;
}

/**
 * Clear all agent memory.
 */
export function clearMemory(): void {
  saveStore({ entries: {} });
}
