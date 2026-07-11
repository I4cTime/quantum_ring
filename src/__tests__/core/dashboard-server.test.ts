import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startDashboardServer } from "../../core/dashboard.js";

describe("dashboard server auth + security headers", () => {
  let dash: ReturnType<typeof startDashboardServer>;
  let base: string;

  beforeAll(async () => {
    // Port 0 = ephemeral port from the OS; read the real one off the server.
    dash = startDashboardServer({ port: 0 });
    await new Promise<void>((resolve) => dash.server.once("listening", resolve));
    const addr = dash.server.address();
    if (addr === null || typeof addr === "string") throw new Error("no address");
    base = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(() => {
    dash.close();
  });

  it("rejects requests without a token", async () => {
    const res = await fetch(`${base}/`);
    expect(res.status).toBe(403);
  });

  it("rejects requests with a wrong token", async () => {
    const res = await fetch(`${base}/?token=not-the-token`);
    expect(res.status).toBe(403);
  });

  it("serves the dashboard with the launch token", async () => {
    const res = await fetch(`${base}/?token=${dash.token}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
  });

  it("sends security headers on every response", async () => {
    for (const url of [`${base}/`, `${base}/?token=${dash.token}`]) {
      const res = await fetch(url);
      expect(res.headers.get("content-security-policy")).toContain(
        "default-src 'none'",
      );
      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("referrer-policy")).toBe("no-referrer");
      expect(res.headers.get("cache-control")).toBe("no-store");
    }
  });
});
