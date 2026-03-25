import { describe, it, expect } from "vitest";
import { generateSecret, estimateEntropy, type NoiseFormat } from "../../core/noise.js";

describe("generateSecret", () => {
  it("returns a hex string by default for format=hex", () => {
    const s = generateSecret({ format: "hex" });
    expect(s).toMatch(/^[0-9a-f]+$/);
  });

  it("returns base64url for format=base64", () => {
    const s = generateSecret({ format: "base64" });
    expect(s).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns alphanumeric characters only", () => {
    const s = generateSecret({ format: "alphanumeric", length: 32 });
    expect(s).toMatch(/^[A-Za-z0-9]+$/);
    expect(s.length).toBe(32);
  });

  it("returns a valid uuid", () => {
    const s = generateSecret({ format: "uuid" });
    expect(s).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("applies prefix for api-key format", () => {
    const s = generateSecret({ format: "api-key", prefix: "sk-" });
    expect(s.startsWith("sk-")).toBe(true);
  });

  it("applies prefix for token format", () => {
    const s = generateSecret({ format: "token", prefix: "tok_" });
    expect(s.startsWith("tok_")).toBe(true);
  });

  it("generates a password with mixed character classes", () => {
    const s = generateSecret({ format: "password", length: 24 });
    expect(s.length).toBe(24);
  });

  it("produces unique values on successive calls", () => {
    const a = generateSecret();
    const b = generateSecret();
    expect(a).not.toBe(b);
  });

  const formats: NoiseFormat[] = [
    "hex", "base64", "alphanumeric", "uuid", "api-key", "token", "password",
  ];
  for (const fmt of formats) {
    it(`format=${fmt} returns a non-empty string`, () => {
      expect(generateSecret({ format: fmt }).length).toBeGreaterThan(0);
    });
  }
});

describe("estimateEntropy", () => {
  it("returns 0 for an empty string", () => {
    expect(estimateEntropy("")).toBe(0);
  });

  it("returns higher entropy for random strings than repetitive ones", () => {
    const low = estimateEntropy("aaaaaaaaaaaa");
    const high = estimateEntropy("aB3$xZ9!qW7@");
    expect(high).toBeGreaterThan(low);
  });

  it("returns a finite positive number for normal input", () => {
    const e = estimateEntropy("test-secret-123");
    expect(e).toBeGreaterThan(0);
    expect(Number.isFinite(e)).toBe(true);
  });
});
