/**
 * Quantum Tunneling: ephemeral secrets that exist only in memory.
 *
 * Tunneled secrets are never persisted to the OS keyring. They live
 * in a process-scoped in-memory store with optional auto-expiry.
 * Useful for passing secrets between agents without touching disk.
 */

import { randomBytes } from "node:crypto";

interface TunnelEntry {
  value: string;
  createdAt: number;
  expiresAt?: number;
  accessCount: number;
  /** Max number of reads before auto-destruct */
  maxReads?: number;
}

const tunnelStore = new Map<string, TunnelEntry>();

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup(): void {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of tunnelStore) {
      if (entry.expiresAt && now >= entry.expiresAt) {
        tunnelStore.delete(id);
      }
    }
    if (tunnelStore.size === 0 && cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  }, 5000);

  // Don't prevent process exit
  if (cleanupInterval && typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
    cleanupInterval.unref();
  }
}

export interface TunnelOptions {
  /** TTL in seconds */
  ttlSeconds?: number;
  /** Self-destruct after N reads */
  maxReads?: number;
}

/**
 * Create a tunneled (ephemeral) secret. Returns a tunnel ID.
 */
export function tunnelCreate(
  value: string,
  opts: TunnelOptions = {},
): string {
  const id = `tun_${Date.now().toString(36)}_${randomBytes(6).toString("base64url")}`;
  const now = Date.now();

  tunnelStore.set(id, {
    value,
    createdAt: now,
    expiresAt: opts.ttlSeconds ? now + opts.ttlSeconds * 1000 : undefined,
    accessCount: 0,
    maxReads: opts.maxReads,
  });

  ensureCleanup();
  return id;
}

/**
 * Read a tunneled secret by ID. Returns null if expired or not found.
 * Each read increments the access counter; auto-destructs after maxReads.
 */
export function tunnelRead(id: string): string | null {
  const entry = tunnelStore.get(id);
  if (!entry) return null;

  if (entry.expiresAt && Date.now() >= entry.expiresAt) {
    tunnelStore.delete(id);
    return null;
  }

  entry.accessCount++;

  if (entry.maxReads && entry.accessCount >= entry.maxReads) {
    const value = entry.value;
    tunnelStore.delete(id);
    return value;
  }

  return entry.value;
}

/**
 * Destroy a tunneled secret immediately.
 */
export function tunnelDestroy(id: string): boolean {
  return tunnelStore.delete(id);
}

/**
 * List all active tunnel IDs (never exposes values).
 */
export function tunnelList(): {
  id: string;
  createdAt: number;
  expiresAt?: number;
  accessCount: number;
  maxReads?: number;
}[] {
  const now = Date.now();
  const result: ReturnType<typeof tunnelList> = [];

  for (const [id, entry] of tunnelStore) {
    if (entry.expiresAt && now >= entry.expiresAt) {
      tunnelStore.delete(id);
      continue;
    }
    result.push({
      id,
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
      accessCount: entry.accessCount,
      maxReads: entry.maxReads,
    });
  }

  return result;
}
