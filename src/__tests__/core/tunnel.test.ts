import { describe, it, expect } from "vitest";
import {
  tunnelCreate,
  tunnelRead,
  tunnelDestroy,
  tunnelList,
} from "../../core/tunnel.js";

describe("tunnel lifecycle", () => {
  it("creates a tunnel and returns an id starting with tun_", () => {
    const id = tunnelCreate("secret-val");
    expect(id.startsWith("tun_")).toBe(true);
  });

  it("reads back the tunneled value", () => {
    const id = tunnelCreate("read-me");
    expect(tunnelRead(id)).toBe("read-me");
  });

  it("returns null for a non-existent tunnel id", () => {
    expect(tunnelRead("tun_nonexistent")).toBeNull();
  });

  it("destroys a tunnel and subsequent reads return null", () => {
    const id = tunnelCreate("destroy-me");
    expect(tunnelDestroy(id)).toBe(true);
    expect(tunnelRead(id)).toBeNull();
  });

  it("returns false when destroying a non-existent tunnel", () => {
    expect(tunnelDestroy("tun_nope")).toBe(false);
  });

  it("lists active tunnels", () => {
    const id = tunnelCreate("listed");
    const list = tunnelList();
    const found = list.find((t) => t.id === id);
    expect(found).toBeDefined();
    expect(found!.accessCount).toBe(0);
  });

  it("respects maxReads and self-destructs", () => {
    const id = tunnelCreate("once", { maxReads: 1 });
    expect(tunnelRead(id)).toBe("once");
    expect(tunnelRead(id)).toBeNull();
  });

  it("tracks accessCount across reads", () => {
    const id = tunnelCreate("counted", { maxReads: 5 });
    tunnelRead(id);
    tunnelRead(id);
    const list = tunnelList();
    const entry = list.find((t) => t.id === id);
    expect(entry?.accessCount).toBe(2);
  });

  it("generates unique IDs with crypto-safe randomness (base64url suffix)", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(tunnelCreate(`val-${i}`));
    }
    expect(ids.size).toBe(100);
    for (const id of ids) {
      expect(id).toMatch(/^tun_[a-z0-9]+_[A-Za-z0-9_-]+$/);
    }
  });
});
