/**
 * Quantum Teleportation: securely share/transfer secrets between machines.
 *
 * Generates encrypted bundles that can be shared via any channel.
 * The recipient decrypts with a shared passphrase (out-of-band exchange).
 * Uses AES-256-GCM with PBKDF2-derived keys.
 */

import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
} from "node:crypto";
import { z } from "zod";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
/** NIST / OpenSSL recommendation for AES-GCM (96-bit nonce). */
const IV_LENGTH = 12;
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;

export interface TeleportBundle {
  /** Format version */
  v: 1;
  /** Base64-encoded encrypted payload */
  data: string;
  /** Base64-encoded salt for key derivation */
  salt: string;
  /** Base64-encoded initialization vector */
  iv: string;
  /** Base64-encoded auth tag */
  tag: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** Number of secrets in the bundle */
  count: number;
}

export interface TeleportPayload {
  secrets: { key: string; value: string; scope?: string }[];
  exportedAt: string;
  exportedBy?: string;
}

export const TeleportBundleSchema = z.object({
  v: z.literal(1),
  data: z.string(),
  salt: z.string(),
  iv: z.string(),
  tag: z.string(),
  createdAt: z.string(),
  count: z.number(),
});

export const TeleportPayloadSchema = z.object({
  secrets: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
      scope: z.string().optional(),
    }),
  ),
  exportedAt: z.string(),
  exportedBy: z.string().optional(),
});

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha512");
}

/**
 * Pack secrets into an encrypted teleport bundle.
 */
export function teleportPack(
  secrets: { key: string; value: string; scope?: string }[],
  passphrase: string,
): string {
  const payload: TeleportPayload = {
    secrets,
    exportedAt: new Date().toISOString(),
  };

  const plaintext = JSON.stringify(payload);
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(passphrase, salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const bundle: TeleportBundle = {
    v: 1,
    data: encrypted.toString("base64"),
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    createdAt: new Date().toISOString(),
    count: secrets.length,
  };

  return Buffer.from(JSON.stringify(bundle)).toString("base64");
}

/**
 * Unpack and decrypt a teleport bundle.
 */
export function teleportUnpack(
  encoded: string,
  passphrase: string,
): TeleportPayload {
  let bundleJson: string;
  try {
    bundleJson = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    throw new Error("ERR_TELEPORT_CORRUPT: invalid base64 bundle");
  }

  let rawBundle: unknown;
  try {
    rawBundle = JSON.parse(bundleJson);
  } catch {
    throw new Error("ERR_TELEPORT_CORRUPT: bundle is not valid JSON");
  }

  const parsedBundle = TeleportBundleSchema.safeParse(rawBundle);
  if (!parsedBundle.success) {
    throw new Error(
      `ERR_TELEPORT_CORRUPT: invalid bundle shape (${parsedBundle.error.message})`,
    );
  }
  const bundle = parsedBundle.data;

  const salt = Buffer.from(bundle.salt, "base64");
  const iv = Buffer.from(bundle.iv, "base64");
  const tag = Buffer.from(bundle.tag, "base64");
  const encrypted = Buffer.from(bundle.data, "base64");
  const key = deriveKey(passphrase, salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted: Buffer;
  try {
    decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
  } catch {
    throw new Error("ERR_TELEPORT_BAD_PASSPHRASE: decryption failed (wrong passphrase or corrupt data)");
  }

  let rawPayload: unknown;
  try {
    rawPayload = JSON.parse(decrypted.toString("utf8"));
  } catch {
    throw new Error("ERR_TELEPORT_CORRUPT: decrypted payload is not valid JSON");
  }

  const payload = TeleportPayloadSchema.safeParse(rawPayload);
  if (!payload.success) {
    throw new Error(
      `ERR_TELEPORT_CORRUPT: invalid payload (${payload.error.message})`,
    );
  }
  return payload.data;
}
