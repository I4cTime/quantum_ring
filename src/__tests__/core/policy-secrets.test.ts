import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  checkSecretLifecyclePolicy,
  clearPolicyCache,
  loadPolicy,
} from "../../core/policy.js";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const dir = join(tmpdir(), `qring-policy-secrets-${Date.now()}`);

describe("checkSecretLifecyclePolicy", () => {
  beforeEach(() => {
    clearPolicyCache();
    mkdirSync(dir, { recursive: true });
  });

  afterEach(() => {
    clearPolicyCache();
    rmSync(dir, { recursive: true, force: true });
  });

  it("allows when no policy.secrets", () => {
    writeFileSync(join(dir, ".q-ring.json"), JSON.stringify({ policy: { mcp: {} } }), "utf8");
    loadPolicy(dir);
    expect(checkSecretLifecyclePolicy({ ttlSeconds: 999999 }, dir).allowed).toBe(true);
  });

  it("denies ttl above maxTtlSeconds", () => {
    writeFileSync(
      join(dir, ".q-ring.json"),
      JSON.stringify({ policy: { secrets: { maxTtlSeconds: 100 } } }),
      "utf8",
    );
    clearPolicyCache();
    expect(checkSecretLifecyclePolicy({ ttlSeconds: 50 }, dir).allowed).toBe(true);
    expect(checkSecretLifecyclePolicy({ ttlSeconds: 200 }, dir).allowed).toBe(false);
  });

  it("requires approval flag for tagged secrets when configured", () => {
    writeFileSync(
      join(dir, ".q-ring.json"),
      JSON.stringify({
        policy: { secrets: { requireApprovalForTags: ["prod"] } },
      }),
      "utf8",
    );
    clearPolicyCache();
    expect(
      checkSecretLifecyclePolicy({ tags: ["prod"], requiresApproval: false }, dir).allowed,
    ).toBe(false);
    expect(
      checkSecretLifecyclePolicy({ tags: ["prod"], requiresApproval: true }, dir).allowed,
    ).toBe(true);
  });
});
