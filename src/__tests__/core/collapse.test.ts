import { describe, it, expect } from "vitest";
import {
  collapseEnvironment,
  readProjectConfig,
} from "../../core/collapse.js";

describe("readProjectConfig", () => {
  it("returns null when no .q-ring.json exists", () => {
    const config = readProjectConfig("/tmp/nonexistent-path");
    expect(config).toBeNull();
  });
});

describe("collapseEnvironment", () => {
  it("returns the explicit environment when provided", () => {
    const result = collapseEnvironment({ explicit: "staging" });
    expect(result).not.toBeNull();
    expect(result!.env).toBe("staging");
    expect(result!.source).toBe("explicit");
  });

  it("falls back to QRING_ENV if set", () => {
    const prev = process.env.QRING_ENV;
    process.env.QRING_ENV = "test-env";
    try {
      const result = collapseEnvironment();
      expect(result).not.toBeNull();
      expect(result!.env).toBe("test-env");
      expect(result!.source).toBe("QRING_ENV");
    } finally {
      if (prev === undefined) delete process.env.QRING_ENV;
      else process.env.QRING_ENV = prev;
    }
  });

  it("falls back to NODE_ENV if QRING_ENV is not set", () => {
    const prevQ = process.env.QRING_ENV;
    const prevN = process.env.NODE_ENV;
    delete process.env.QRING_ENV;
    process.env.NODE_ENV = "production";
    try {
      const result = collapseEnvironment({ projectPath: "/tmp/nope" });
      expect(result).not.toBeNull();
      if (result!.source === "NODE_ENV") {
        expect(result!.env).toBe("prod");
      }
    } finally {
      if (prevQ === undefined) delete process.env.QRING_ENV;
      else process.env.QRING_ENV = prevQ;
      if (prevN === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = prevN;
    }
  });
});
