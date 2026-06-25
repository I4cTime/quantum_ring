/**
 * Quantum Noise: cryptographic secret generation.
 * Generates high-entropy values in common formats.
 */

import { randomBytes, randomInt } from "node:crypto";

export type NoiseFormat =
  | "hex"
  | "base64"
  | "alphanumeric"
  | "uuid"
  | "api-key"
  | "token"
  | "password";

export interface NoiseOptions {
  format?: NoiseFormat;
  /** Length in bytes (for hex/base64) or characters (for alphanumeric/password) */
  length?: number;
  /** Prefix for api-key format (e.g., "sk-", "pk-") */
  prefix?: string;
}

const ALPHA_NUM =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const PASSWORD_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";

function randomString(charset: string, length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[randomInt(charset.length)];
  }
  return result;
}

export function generateSecret(opts: NoiseOptions = {}): string {
  const format = opts.format ?? "api-key";

  switch (format) {
    case "hex": {
      const len = opts.length ?? 32;
      return randomBytes(len).toString("hex");
    }

    case "base64": {
      const len = opts.length ?? 32;
      return randomBytes(len).toString("base64url");
    }

    case "alphanumeric": {
      const len = opts.length ?? 32;
      return randomString(ALPHA_NUM, len);
    }

    case "uuid": {
      const bytes = randomBytes(16);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
      const hex = bytes.toString("hex");
      return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32),
      ].join("-");
    }

    case "api-key": {
      const prefix = opts.prefix ?? "qr_";
      const len = opts.length ?? 48;
      return prefix + randomString(ALPHA_NUM, len);
    }

    case "token": {
      const prefix = opts.prefix ?? "";
      const len = opts.length ?? 64;
      return prefix + randomBytes(len).toString("base64url");
    }

    case "password": {
      const len = opts.length ?? 24;

      // Construct from one guaranteed char per class, fill the rest, then
      // shuffle. This guarantees every class is present (when len ≥ #classes)
      // without any fixup pass that could clobber an already-placed class.
      const classCharsets = [
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "abcdefghijklmnopqrstuvwxyz",
        "0123456789",
        "!@#$%^&*()-_=+",
      ];
      const guaranteed = classCharsets
        .slice(0, Math.min(classCharsets.length, len))
        .map((cs) => randomString(cs, 1));
      const remaining = Math.max(0, len - guaranteed.length);
      const chars = [
        ...guaranteed,
        ...(remaining > 0 ? randomString(PASSWORD_CHARS, remaining).split("") : []),
      ];

      // Fisher-Yates shuffle backed by the CSPRNG.
      for (let i = chars.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }

      return chars.join("");
    }

    default:
      return randomBytes(32).toString("hex");
  }
}

/**
 * Estimate the entropy of a secret in bits.
 */
export function estimateEntropy(secret: string): number {
  const charsets = [
    { regex: /[a-z]/, size: 26 },
    { regex: /[A-Z]/, size: 26 },
    { regex: /[0-9]/, size: 10 },
    { regex: /[^A-Za-z0-9]/, size: 32 },
  ];

  let poolSize = 0;
  for (const { regex, size } of charsets) {
    if (regex.test(secret)) poolSize += size;
  }

  return poolSize > 0 ? Math.floor(Math.log2(poolSize) * secret.length) : 0;
}
