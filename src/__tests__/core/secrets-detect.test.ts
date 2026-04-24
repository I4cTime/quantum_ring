import { describe, it, expect } from "vitest";
import { findSecretsInLine, calculateEntropy } from "../../core/secrets-detect.js";

describe("secrets-detect", () => {
  it("findSecretsInLine returns empty for clean line", () => {
    expect(findSecretsInLine('const x = "hello";')).toEqual([]);
  });

  it("detects sk- style key", () => {
    const line = 'const api_key = "sk-abcdef1234567890abcdef1234567890";';
    const hits = findSecretsInLine(line);
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits[0].value.startsWith("sk-")).toBe(true);
  });

  it("calculateEntropy is deterministic for same string", () => {
    expect(calculateEntropy("aaaa")).toBe(calculateEntropy("aaaa"));
  });
});
