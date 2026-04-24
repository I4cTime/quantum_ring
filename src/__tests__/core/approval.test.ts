import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  grantApproval,
  hasApproval,
  listApprovals,
} from "../../core/approval.js";

describe("approval HMAC", () => {
  let prevHome: string | undefined;
  let dir: string;

  beforeEach(() => {
    prevHome = process.env.HOME;
    dir = join(tmpdir(), `qring-approval-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    mkdirSync(dir, { recursive: true });
    process.env.HOME = dir;
  });

  afterEach(() => {
    if (prevHome === undefined) delete process.env.HOME;
    else process.env.HOME = prevHome;
    rmSync(dir, { recursive: true, force: true });
  });

  it("accepts a freshly granted approval", () => {
    grantApproval("API_KEY", "global", 3600);
    expect(hasApproval("API_KEY", "global")).toBe(true);
  });

  it("rejects tampered HMAC (timing-safe compare)", () => {
    grantApproval("API_KEY", "global", 3600);
    const path = join(dir, ".config", "q-ring", "approvals.json");
    const data = JSON.parse(readFileSync(path, "utf8")) as {
      approvals: { hmac: string }[];
    };
    data.approvals[0].hmac = "f".repeat(64);
    writeFileSync(path, JSON.stringify(data));
    expect(hasApproval("API_KEY", "global")).toBe(false);
    const listed = listApprovals();
    expect(listed[0].tampered).toBe(true);
  });

  it("rejects wrong-length HMAC without throwing", () => {
    grantApproval("API_KEY", "global", 3600);
    const path = join(dir, ".config", "q-ring", "approvals.json");
    const data = JSON.parse(readFileSync(path, "utf8")) as {
      approvals: { hmac: string }[];
    };
    data.approvals[0].hmac = "abc";
    writeFileSync(path, JSON.stringify(data));
    expect(hasApproval("API_KEY", "global")).toBe(false);
  });

  it("HMAC covers workspace and sessionId so they cannot be silently forged", () => {
    grantApproval("API_KEY", "global", 3600, {
      workspace: "/work/a",
      sessionId: "sess-1",
    });
    const path = join(dir, ".config", "q-ring", "approvals.json");
    const data = JSON.parse(readFileSync(path, "utf8")) as {
      approvals: { workspace?: string; sessionId?: string; hmac: string }[];
    };
    data.approvals[0].workspace = "/attacker";
    data.approvals[0].sessionId = "sess-attacker";
    writeFileSync(path, JSON.stringify(data));
    expect(hasApproval("API_KEY", "global")).toBe(false);
    expect(listApprovals()[0].tampered).toBe(true);
  });
});
