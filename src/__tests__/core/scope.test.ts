import { describe, it, expect } from "vitest";
import {
  globalService,
  projectService,
  teamService,
  orgService,
  resolveScope,
  parseServiceName,
} from "../../core/scope.js";

describe("service name helpers", () => {
  it("globalService returns q-ring:global", () => {
    expect(globalService()).toBe("q-ring:global");
  });

  it("projectService includes a hash of the path", () => {
    const s = projectService("/home/user/project");
    expect(s.startsWith("q-ring:project:")).toBe(true);
    expect(s.length).toBeGreaterThan("q-ring:project:".length);
  });

  it("teamService includes the team id", () => {
    expect(teamService("team-42")).toBe("q-ring:team:team-42");
  });

  it("orgService includes the org id", () => {
    expect(orgService("org-99")).toBe("q-ring:org:org-99");
  });
});

describe("resolveScope", () => {
  it("returns global scope when scope is global", () => {
    const result = resolveScope({ scope: "global" });
    expect(result[0].scope).toBe("global");
  });

  it("returns project scope with projectPath", () => {
    const result = resolveScope({ scope: "project", projectPath: "/tmp/p" });
    expect(result[0].scope).toBe("project");
  });

  it("throws for project scope without projectPath", () => {
    expect(() => resolveScope({ scope: "project" })).toThrow();
  });

  it("throws for team scope without teamId", () => {
    expect(() => resolveScope({ scope: "team" })).toThrow();
  });

  it("throws for org scope without orgId", () => {
    expect(() => resolveScope({ scope: "org" })).toThrow();
  });

  it("builds a cascade when no scope is specified", () => {
    const result = resolveScope({
      projectPath: "/tmp/p",
      teamId: "t1",
      orgId: "o1",
    });
    expect(result.length).toBeGreaterThanOrEqual(2);
    const scopes = result.map((r) => r.scope);
    expect(scopes).toContain("global");
  });
});

describe("parseServiceName", () => {
  it("parses a global service string", () => {
    const r = parseServiceName("q-ring:global");
    expect(r.scope).toBe("global");
  });

  it("parses a project service string", () => {
    const r = parseServiceName("q-ring:project:abc123");
    expect(r.scope).toBe("project");
  });

  it("parses a team service string", () => {
    const r = parseServiceName("q-ring:team:my-team");
    expect(r.scope).toBe("team");
  });

  it("falls back to global for unknown patterns", () => {
    const r = parseServiceName("unknown-service");
    expect(r.scope).toBe("global");
  });
});
