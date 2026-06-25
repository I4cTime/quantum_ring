import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { checkToolPolicy, checkKeyReadPolicy, setPolicyRoot, clearPolicyCache } from "../../core/policy.js";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

/**
 * Isolated file: setPolicyRoot mutates module-global state, and vitest isolates
 * modules per file, so this won't leak into the other policy test suites.
 */
describe("setPolicyRoot anchors governance to a trusted root", () => {
  const rootDir = join(tmpdir(), `qring-policy-root-${Date.now()}`);
  const otherDir = join(tmpdir(), `qring-policy-other-${Date.now()}`);

  beforeAll(() => {
    mkdirSync(rootDir, { recursive: true });
    mkdirSync(otherDir, { recursive: true });
    // Trusted root denies a tool/key; the "other" dir has no policy at all.
    writeFileSync(
      join(rootDir, ".q-ring.json"),
      JSON.stringify({
        policy: { mcp: { denyTools: ["get_secret"], deniedKeys: ["PROD_DB"] } },
      }),
      "utf8",
    );
    setPolicyRoot(rootDir);
    clearPolicyCache();
  });

  afterAll(() => {
    rmSync(rootDir, { recursive: true, force: true });
    rmSync(otherDir, { recursive: true, force: true });
  });

  it("ignores an agent-supplied projectPath that points away from the root", () => {
    // Even though the caller points at a dir with no policy, the pinned root
    // still applies — the agent cannot escape governance.
    expect(checkToolPolicy("get_secret", otherDir).allowed).toBe(false);
    expect(checkKeyReadPolicy("PROD_DB", undefined, otherDir).allowed).toBe(false);
  });

  it("still enforces the root policy when no projectPath is given", () => {
    expect(checkToolPolicy("get_secret").allowed).toBe(false);
  });
});
