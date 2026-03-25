import { describe, it, expect } from "vitest";
import {
  createEnvelope,
  parseEnvelope,
  serializeEnvelope,
  collapseValue,
  checkDecay,
  recordAccess,
  wrapLegacy,
} from "../../core/envelope.js";

describe("createEnvelope", () => {
  it("creates an envelope with a single value", () => {
    const env = createEnvelope("my-secret");
    expect(env.v).toBe(1);
    expect(env.value).toBe("my-secret");
    expect(env.meta.createdAt).toBeTruthy();
    expect(env.meta.accessCount).toBe(0);
  });

  it("stores optional metadata", () => {
    const env = createEnvelope("s", {
      description: "test",
      tags: ["a", "b"],
      ttlSeconds: 60,
    });
    expect(env.meta.description).toBe("test");
    expect(env.meta.tags).toEqual(["a", "b"]);
    expect(env.meta.ttlSeconds).toBe(60);
  });

  it("stores superposition states", () => {
    const env = createEnvelope("default-val", {
      states: { dev: "dev-val", prod: "prod-val" },
    });
    expect(env.states?.dev).toBe("dev-val");
    expect(env.states?.prod).toBe("prod-val");
  });
});

describe("parseEnvelope / serializeEnvelope", () => {
  it("round-trips an envelope through serialize and parse", () => {
    const original = createEnvelope("test", { tags: ["x"] });
    const json = serializeEnvelope(original);
    const parsed = parseEnvelope(json);
    expect(parsed).not.toBeNull();
    expect(parsed!.value).toBe("test");
    expect(parsed!.meta.tags).toEqual(["x"]);
  });

  it("returns null for invalid JSON", () => {
    expect(parseEnvelope("not-json")).toBeNull();
  });

  it("returns null for JSON missing v field", () => {
    expect(parseEnvelope('{"value":"x"}')).toBeNull();
  });
});

describe("wrapLegacy", () => {
  it("wraps a raw string into a v1 envelope", () => {
    const env = wrapLegacy("raw-value");
    expect(env.v).toBe(1);
    expect(env.value).toBe("raw-value");
  });
});

describe("collapseValue", () => {
  it("returns the single value when no states exist", () => {
    const env = createEnvelope("only");
    expect(collapseValue(env)).toBe("only");
  });

  it("collapses to the requested environment", () => {
    const env = createEnvelope("default", {
      states: { dev: "dev-secret", prod: "prod-secret" },
    });
    expect(collapseValue(env, "dev")).toBe("dev-secret");
    expect(collapseValue(env, "prod")).toBe("prod-secret");
  });

  it("falls back to first state for unknown env when no defaultEnv", () => {
    const env = createEnvelope("fallback", { states: { dev: "d" } });
    expect(collapseValue(env, "staging")).toBe("d");
  });

  it("falls back to defaultEnv state for unknown env", () => {
    const env = createEnvelope("fallback", {
      states: { dev: "d", prod: "p" },
      defaultEnv: "prod",
    });
    expect(collapseValue(env, "staging")).toBe("p");
  });
});

describe("checkDecay", () => {
  it("reports healthy for a fresh envelope with no TTL", () => {
    const env = createEnvelope("healthy");
    const decay = checkDecay(env);
    expect(decay.isExpired).toBe(false);
    expect(decay.isStale).toBe(false);
  });

  it("reports expired when expiresAt computed from TTL has elapsed", () => {
    const env = createEnvelope("old", { ttlSeconds: 1 });
    env.meta.expiresAt = new Date(Date.now() - 5000).toISOString();
    const decay = checkDecay(env);
    expect(decay.isExpired).toBe(true);
  });

  it("reports expired when expiresAt is in the past", () => {
    const env = createEnvelope("old");
    env.meta.expiresAt = new Date(Date.now() - 1000).toISOString();
    const decay = checkDecay(env);
    expect(decay.isExpired).toBe(true);
  });
});

describe("recordAccess", () => {
  it("increments accessCount and sets lastAccessedAt", () => {
    const env = createEnvelope("val");
    expect(env.meta.accessCount).toBe(0);
    const updated = recordAccess(env);
    expect(updated.meta.accessCount).toBe(1);
    expect(updated.meta.lastAccessedAt).toBeTruthy();
  });

  it("returns a new object (immutable)", () => {
    const env = createEnvelope("val");
    const updated = recordAccess(env);
    expect(updated).not.toBe(env);
    expect(env.meta.accessCount).toBe(0);
  });
});
