import { z } from "zod";
import type { KeyringOptions } from "../../core/keyring.js";
import type { Scope } from "../../core/scope.js";
import { checkToolPolicy } from "../../core/policy.js";

/**
 * Standard MCP tool response shape for text content.
 * Set `isError: true` for failure responses so clients surface them appropriately.
 */
export function text(t: string, isError = false) {
  return {
    content: [{ type: "text" as const, text: t }],
    ...(isError ? { isError: true } : {}),
  };
}

/** Build `KeyringOptions` from MCP tool params with `source: "mcp"` baked in. */
export function opts(params: {
  scope?: string;
  projectPath?: string;
  env?: string;
  teamId?: string;
  orgId?: string;
}): KeyringOptions {
  return {
    scope: params.scope as Scope | undefined,
    projectPath: params.projectPath ?? process.cwd(),
    teamId: params.teamId,
    orgId: params.orgId,
    env: params.env,
    source: "mcp",
  };
}

/**
 * Short-circuit guard: returns a "Policy Denied" text response if the tool
 * is blocked by project governance, else `null` to continue.
 */
export function enforceToolPolicy(toolName: string, projectPath?: string) {
  const decision = checkToolPolicy(toolName, projectPath);
  if (!decision.allowed) {
    return text(
      `Policy Denied: ${decision.reason} (source: ${decision.policySource})`,
      true,
    );
  }
  return null;
}

/** Reusable zod schemas for the common MCP tool parameters. */
export const commonSchemas = {
  teamId: z
    .string()
    .optional()
    .describe("Team identifier for team-scoped secrets"),
  orgId: z
    .string()
    .optional()
    .describe("Org identifier for org-scoped secrets"),
  scope: z
    .enum(["global", "project", "team", "org"])
    .optional()
    .describe("Scope: global, project, team, or org"),
  projectPath: z
    .string()
    .optional()
    .describe("Project root path for project-scoped secrets"),
  env: z
    .string()
    .optional()
    .describe("Environment for superposition collapse (e.g., dev, staging, prod)"),
} as const;
