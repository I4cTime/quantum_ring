import { describe, it, expect, beforeEach } from "vitest";
import {
  checkToolPolicy,
  checkExecPolicy,
  checkKeyReadPolicy,
  getPolicySummary,
  clearPolicyCache,
} from "../../core/policy.js";

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
