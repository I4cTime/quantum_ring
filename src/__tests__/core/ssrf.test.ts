import { describe, it, expect } from "vitest";
import { isPrivateIP, checkSSRF, checkSSRFSync } from "../../core/ssrf.js";

describe("isPrivateIP", () => {
  it("blocks 127.x.x.x (loopback)", () => {
    expect(isPrivateIP("127.0.0.1")).toBe(true);
    expect(isPrivateIP("127.255.255.255")).toBe(true);
  });

  it("blocks 10.x.x.x", () => {
    expect(isPrivateIP("10.0.0.1")).toBe(true);
    expect(isPrivateIP("10.255.255.255")).toBe(true);
  });

  it("blocks 172.16-31.x.x", () => {
    expect(isPrivateIP("172.16.0.1")).toBe(true);
    expect(isPrivateIP("172.31.255.255")).toBe(true);
    expect(isPrivateIP("172.15.0.1")).toBe(false);
    expect(isPrivateIP("172.32.0.1")).toBe(false);
  });

  it("blocks 192.168.x.x", () => {
    expect(isPrivateIP("192.168.0.1")).toBe(true);
    expect(isPrivateIP("192.168.255.255")).toBe(true);
  });

  it("blocks link-local 169.254.x.x", () => {
    expect(isPrivateIP("169.254.1.1")).toBe(true);
  });

  it("blocks 0.0.0.0", () => {
    expect(isPrivateIP("0.0.0.0")).toBe(true);
  });

  it("blocks IPv6 loopback and private", () => {
    expect(isPrivateIP("::1")).toBe(true);
    expect(isPrivateIP("::")).toBe(true);
    expect(isPrivateIP("fc00::1")).toBe(true);
    expect(isPrivateIP("fd12::1")).toBe(true);
    expect(isPrivateIP("fe80::1")).toBe(true);
  });

  it("blocks IPv4-mapped IPv6", () => {
    expect(isPrivateIP("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateIP("::ffff:10.0.0.1")).toBe(true);
  });

  it("allows public IPs", () => {
    expect(isPrivateIP("8.8.8.8")).toBe(false);
    expect(isPrivateIP("1.1.1.1")).toBe(false);
    expect(isPrivateIP("203.0.113.1")).toBe(false);
  });
});

describe("checkSSRF", () => {
  it("blocks http://127.0.0.1", async () => {
    const result = await checkSSRF("http://127.0.0.1/test");
    expect(result).toContain("Blocked");
  });

  it("blocks http://[::1]", async () => {
    const result = await checkSSRF("http://[::1]/test");
    expect(result).toContain("Blocked");
  });

  it("returns null for public IP literal URLs (no hostname DNS)", async () => {
    const result = await checkSSRF("https://8.8.8.8/test");
    expect(result).toBeNull();
  });

  it("respects Q_RING_ALLOW_PRIVATE_HOOKS override", async () => {
    const orig = process.env.Q_RING_ALLOW_PRIVATE_HOOKS;
    process.env.Q_RING_ALLOW_PRIVATE_HOOKS = "1";
    try {
      const result = await checkSSRF("http://127.0.0.1/test");
      expect(result).toBeNull();
    } finally {
      if (orig === undefined) delete process.env.Q_RING_ALLOW_PRIVATE_HOOKS;
      else process.env.Q_RING_ALLOW_PRIVATE_HOOKS = orig;
    }
  });
});

describe("checkSSRFSync", () => {
  it("blocks IP-literal private URLs synchronously", () => {
    expect(checkSSRFSync("http://10.0.0.1/path")).toContain("Blocked");
    expect(checkSSRFSync("http://192.168.1.1/path")).toContain("Blocked");
  });

  it("returns null for public IPs", () => {
    expect(checkSSRFSync("https://1.1.1.1/path")).toBeNull();
  });

  it("returns null for hostnames (no DNS in sync mode)", () => {
    expect(checkSSRFSync("https://example.com/path")).toBeNull();
  });
});
