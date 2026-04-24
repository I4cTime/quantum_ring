import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { checkJitHttpProvisionUrl } from "../../core/ssrf.js";

describe("checkJitHttpProvisionUrl", () => {
  let prev: string | undefined;

  beforeEach(() => {
    prev = process.env.Q_RING_ALLOW_PRIVATE_HOOKS;
    delete process.env.Q_RING_ALLOW_PRIVATE_HOOKS;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.Q_RING_ALLOW_PRIVATE_HOOKS;
    else process.env.Q_RING_ALLOW_PRIVATE_HOOKS = prev;
  });

  it("blocks IP-literal loopback without needing DNS", () => {
    expect(checkJitHttpProvisionUrl("http://127.0.0.1/foo")).toContain(
      "Blocked",
    );
  });

  it("blocks hostnames that resolve to loopback (sync DNS)", () => {
    const r = checkJitHttpProvisionUrl("http://localhost/foo");
    expect(r).not.toBeNull();
    expect(r).toContain("Blocked");
  });

  it("fails closed when DNS resolution throws", () => {
    const r = checkJitHttpProvisionUrl(
      "https://quantum-ring-ssrf-jit.invalid/path",
    );
    expect(r).not.toBeNull();
    expect(r).toContain("DNS resolution failed");
  });

  it("blocks non-http(s) schemes", () => {
    expect(checkJitHttpProvisionUrl("file:///etc/passwd")).toContain(
      "only allows http:",
    );
  });

  it("allows public IP literals", () => {
    expect(checkJitHttpProvisionUrl("https://1.1.1.1/path")).toBeNull();
  });
});
