import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  checkToolPolicy,
  checkExecPolicy,
  checkKeyReadPolicy,
  getPolicySummary,
  clearPolicyCache,
} from "../../core/policy.js";
import { mkdirSync, writeFileSync, rmSync, utimesSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("policy (no .q-ring.json)", () => {
  beforeEach(() => {
    clearPolicyCache();
  });

  it("checkToolPolicy allows all tools when no policy exists", () => {
    const decision = checkToolPolicy("get_secret", "/tmp/no-policy");
    expect(decision.allowed).toBe(true);
  });

  it("checkExecPolicy allows all commands when no policy exists", () => {
    const decision = checkExecPolicy("node app.js", "/tmp/no-policy");
    expect(decision.allowed).toBe(true);
  });

  it("checkKeyReadPolicy allows all keys when no policy exists", () => {
    const decision = checkKeyReadPolicy("ANY_KEY", undefined, "/tmp/no-policy");
    expect(decision.allowed).toBe(true);
  });

  it("getPolicySummary returns no policies", () => {
    const summary = getPolicySummary("/tmp/no-policy");
    expect(summary.hasMcpPolicy).toBe(false);
    expect(summary.hasExecPolicy).toBe(false);
    expect(summary.hasSecretPolicy).toBe(false);
  });
});

describe("checkExecPolicy (with .q-ring.json)", () => {
  const dir = join(tmpdir(), `qring-policy-exec-${Date.now()}`);

  beforeEach(() => {
    clearPolicyCache();
    mkdirSync(dir, { recursive: true });
  });
  afterEach(() => {
    clearPolicyCache();
    rmSync(dir, { recursive: true, force: true });
  });

  it("denies on token/path boundaries, not bare substrings", () => {
    writeFileSync(
      join(dir, ".q-ring.json"),
      JSON.stringify({ policy: { exec: { denyCommands: ["rm"] } } }),
      "utf8",
    );
    clearPolicyCache();
    // bare substring must NOT trip the deny
    expect(checkExecPolicy("charm build", dir).allowed).toBe(true);
    // real invocations (with path or args) must be denied
    expect(checkExecPolicy("rm -rf build", dir).allowed).toBe(false);
    expect(checkExecPolicy("/usr/bin/rm file", dir).allowed).toBe(false);
  });

  it("reloads policy when .q-ring.json changes (mtime invalidation)", () => {
    const file = join(dir, ".q-ring.json");
    writeFileSync(file, JSON.stringify({ policy: { exec: { denyCommands: ["curl"] } } }), "utf8");
    clearPolicyCache();
    expect(checkExecPolicy("curl example.com", dir).allowed).toBe(false);

    // Rewrite without clearing the cache; bump mtime so invalidation triggers.
    writeFileSync(file, JSON.stringify({ policy: { exec: {} } }), "utf8");
    const future = new Date(Date.now() + 5000);
    utimesSync(file, future, future);
    expect(checkExecPolicy("curl example.com", dir).allowed).toBe(true);
  });
});
