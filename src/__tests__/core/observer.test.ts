import { describe, it, expect } from "vitest";
import {
  logAudit,
  queryAudit,
  verifyAuditChain,
  exportAudit,
  detectAnomalies,
} from "../../core/observer.js";

describe("observer / audit log", () => {
  it("logAudit does not throw", () => {
    expect(() =>
      logAudit({
        action: "read",
        key: "VITEST_KEY",
        scope: "q-ring:global",
        source: "cli",
      }),
    ).not.toThrow();
  });

  it("queryAudit returns an array", () => {
    const events = queryAudit();
    expect(Array.isArray(events)).toBe(true);
  });

  it("queryAudit can filter by key", () => {
    logAudit({
      action: "write",
      key: "VITEST_FILTER_KEY",
      scope: "q-ring:global",
      source: "cli",
    });
    const events = queryAudit({ key: "VITEST_FILTER_KEY" });
    expect(events.length).toBeGreaterThanOrEqual(1);
    for (const e of events) {
      expect(e.key).toBe("VITEST_FILTER_KEY");
    }
  });

  it("queryAudit can filter by action", () => {
    const events = queryAudit({ action: "read" });
    for (const e of events) {
      expect(e.action).toBe("read");
    }
  });

  it("queryAudit respects limit", () => {
    const events = queryAudit({ limit: 2 });
    expect(events.length).toBeLessThanOrEqual(2);
  });

  it("verifyAuditChain returns a VerifyResult", () => {
    const result = verifyAuditChain();
    expect(typeof result.totalEvents).toBe("number");
    expect(typeof result.validEvents).toBe("number");
    expect(typeof result.intact).toBe("boolean");
  });

  it("exportAudit returns a string", () => {
    const output = exportAudit();
    expect(typeof output).toBe("string");
  });

  it("exportAudit json format returns valid JSON", () => {
    const output = exportAudit({ format: "json" });
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it("detectAnomalies returns an array", () => {
    const anomalies = detectAnomalies();
    expect(Array.isArray(anomalies)).toBe(true);
  });
});
