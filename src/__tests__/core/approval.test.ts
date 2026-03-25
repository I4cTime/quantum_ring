import { describe, it, expect, beforeEach } from "vitest";
import {
  grantApproval,
  revokeApproval,
  hasApproval,
  listApprovals,
} from "../../core/approval.js";

describe("approval system", () => {
  const key = "TEST_APPROVAL_KEY";
  const scope = "q-ring:global";

  beforeEach(() => {
    revokeApproval(key, scope);
  });

  it("grants an approval and returns an entry with id and hmac", () => {
    const entry = grantApproval(key, scope, 3600);
    expect(entry.id).toBeTruthy();
    expect(entry.key).toBe(key);
    expect(entry.scope).toBe(scope);
    expect(entry.hmac).toBeTruthy();
    expect(entry.grantedAt).toBeTruthy();
    expect(entry.expiresAt).toBeTruthy();
  });

  it("hasApproval returns true after granting", () => {
    grantApproval(key, scope, 3600);
    expect(hasApproval(key, scope)).toBe(true);
  });

  it("hasApproval returns false when not granted", () => {
    expect(hasApproval("NEVER_GRANTED", scope)).toBe(false);
  });

  it("revokeApproval removes the approval", () => {
    grantApproval(key, scope, 3600);
    expect(revokeApproval(key, scope)).toBe(true);
    expect(hasApproval(key, scope)).toBe(false);
  });

  it("revokeApproval returns false for non-existent", () => {
    expect(revokeApproval("NEVER_SET", scope)).toBe(false);
  });

  it("listApprovals includes granted entries", () => {
    grantApproval(key, scope, 3600);
    const list = listApprovals();
    const found = list.find((a) => a.key === key && a.scope === scope);
    expect(found).toBeDefined();
    expect(typeof found!.valid).toBe("boolean");
    expect(typeof found!.tampered).toBe("boolean");
  });

  it("hasApproval returns false for non-existent key+scope", () => {
    expect(hasApproval("TOTALLY_MISSING_KEY", "q-ring:global")).toBe(false);
  });
});
