import { describe, it, expect } from "vitest";
import { teleportPack, teleportUnpack } from "../../core/teleport.js";

describe("teleport pack/unpack", () => {
  const secrets = [
    { key: "API_KEY", value: "sk-abc123", scope: "project" },
    { key: "DB_PASS", value: "p@ssw0rd" },
  ];
  const passphrase = "test-passphrase-42";

  it("packs secrets into a non-empty base64 string", () => {
    const bundle = teleportPack(secrets, passphrase);
    expect(bundle.length).toBeGreaterThan(0);
  });

  it("uses a 12-byte AES-GCM IV (NIST-recommended nonce length)", () => {
    const bundle = teleportPack(secrets, passphrase);
    const inner = JSON.parse(
      Buffer.from(bundle, "base64").toString("utf8"),
    ) as { iv: string };
    const iv = Buffer.from(inner.iv, "base64");
    expect(iv.length).toBe(12);
  });

  it("round-trips secrets through pack and unpack", () => {
    const bundle = teleportPack(secrets, passphrase);
    const payload = teleportUnpack(bundle, passphrase);
    expect(payload.secrets).toHaveLength(2);
    expect(payload.secrets[0].key).toBe("API_KEY");
    expect(payload.secrets[0].value).toBe("sk-abc123");
    expect(payload.secrets[1].key).toBe("DB_PASS");
    expect(payload.secrets[1].value).toBe("p@ssw0rd");
    expect(payload.exportedAt).toBeTruthy();
  });

  it("preserves scope metadata", () => {
    const bundle = teleportPack(secrets, passphrase);
    const payload = teleportUnpack(bundle, passphrase);
    expect(payload.secrets[0].scope).toBe("project");
    expect(payload.secrets[1].scope).toBeUndefined();
  });

  it("throws on wrong passphrase", () => {
    const bundle = teleportPack(secrets, passphrase);
    expect(() => teleportUnpack(bundle, "wrong-password")).toThrow(
      /ERR_TELEPORT_BAD_PASSPHRASE/,
    );
  });

  it("throws on corrupted bundle", () => {
    expect(() => teleportUnpack("not-a-bundle", passphrase)).toThrow();
  });

  it("handles empty secrets array", () => {
    const bundle = teleportPack([], passphrase);
    const payload = teleportUnpack(bundle, passphrase);
    expect(payload.secrets).toHaveLength(0);
  });
});
