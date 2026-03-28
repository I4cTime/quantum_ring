/**
 * SSRF Protection — shared guard for HTTP requests to user-controlled URLs.
 *
 * Blocks requests to private/loopback/link-local addresses unless
 * Q_RING_ALLOW_PRIVATE_HOOKS=1 is set.
 */

import { lookup } from "node:dns/promises";

export function isPrivateIP(ip: string): boolean {
  const octet = "(?:25[0-5]|2[0-4]\\d|1?\\d{1,2})";
  const ipv4Re = new RegExp(`^::ffff:(${octet}\\.${octet}\\.${octet}\\.${octet})$`, "i");
  const ipv4Mapped = ip.match(ipv4Re);
  if (ipv4Mapped) return isPrivateIP(ipv4Mapped[1]);

  if (/^127\./.test(ip)) return true;
  if (/^10\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;
  if (/^169\.254\./.test(ip)) return true;
  if (ip === "0.0.0.0") return true;
  if (ip === "::1" || ip === "::") return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true;
  if (/^fe80:/i.test(ip)) return true;
  return false;
}

/**
 * Async SSRF check — resolves DNS and blocks private addresses.
 * Returns null if safe, or a human-readable block message.
 */
export async function checkSSRF(url: string): Promise<string | null> {
  if (process.env.Q_RING_ALLOW_PRIVATE_HOOKS === "1") return null;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

    if (isPrivateIP(hostname)) {
      return `Blocked: URL resolves to private address (${hostname}). Set Q_RING_ALLOW_PRIVATE_HOOKS=1 to override.`;
    }

    const results = await lookup(hostname, { all: true });
    for (const { address } of results) {
      if (isPrivateIP(address)) {
        return `Blocked: URL "${hostname}" resolves to private address ${address}. Set Q_RING_ALLOW_PRIVATE_HOOKS=1 to override.`;
      }
    }
  } catch {
    // DNS failure will surface as a request error downstream
  }
  return null;
}

/**
 * Sync SSRF check — validates IP literals only (no DNS resolution).
 * Suitable for sync contexts where async DNS lookup isn't possible.
 */
export function checkSSRFSync(url: string): string | null {
  if (process.env.Q_RING_ALLOW_PRIVATE_HOOKS === "1") return null;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

    if (isPrivateIP(hostname)) {
      return `Blocked: URL resolves to private address (${hostname}). Set Q_RING_ALLOW_PRIVATE_HOOKS=1 to override.`;
    }
  } catch {
    // malformed URL — will fail downstream
  }
  return null;
}
