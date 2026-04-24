/**
 * Governance-As-Code Policy Engine
 *
 * Evaluates project-level policies declared in `.q-ring.json` under the
 * `policy` key. Enforces MCP tool gating, key/tag access restrictions,
 * exec allowlists, and mandatory metadata requirements.
 */

import { readProjectConfig } from "./collapse.js";

export interface PolicyConfig {
  mcp?: {
    allowTools?: string[];
    denyTools?: string[];
    readableKeys?: string[];
    deniedKeys?: string[];
    deniedTags?: string[];
  };
  exec?: {
    allowCommands?: string[];
    denyCommands?: string[];
    maxRuntimeSeconds?: number;
    allowNetwork?: boolean;
  };
  secrets?: {
    requireApprovalForTags?: string[];
    requireRotationFormatForTags?: string[];
    maxTtlSeconds?: number;
  };
}

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
  policySource: string;
}

let cachedPolicy: { path: string; policy: PolicyConfig } | null = null;

export function loadPolicy(projectPath?: string): PolicyConfig {
  const pp = projectPath ?? process.cwd();
  if (cachedPolicy && cachedPolicy.path === pp) {
    return cachedPolicy.policy;
  }

  const config = readProjectConfig(pp);
  const policy: PolicyConfig = (config as any)?.policy ?? {};
  cachedPolicy = { path: pp, policy };
  return policy;
}

export function clearPolicyCache(): void {
  cachedPolicy = null;
}

export function checkToolPolicy(toolName: string, projectPath?: string): PolicyDecision {
  const policy = loadPolicy(projectPath);
  if (!policy.mcp) return { allowed: true, policySource: "no-policy" };

  if (policy.mcp.denyTools?.includes(toolName)) {
    return {
      allowed: false,
      reason: `Tool "${toolName}" is denied by project policy`,
      policySource: ".q-ring.json policy.mcp.denyTools",
    };
  }

  if (policy.mcp.allowTools && !policy.mcp.allowTools.includes(toolName)) {
    return {
      allowed: false,
      reason: `Tool "${toolName}" is not in the allowlist`,
      policySource: ".q-ring.json policy.mcp.allowTools",
    };
  }

  return { allowed: true, policySource: ".q-ring.json" };
}

/** Enforce `policy.secrets` from `.q-ring.json` on writes. */
export function checkSecretLifecyclePolicy(
  input: {
    tags?: string[];
    ttlSeconds?: number;
    rotationFormat?: string;
    requiresApproval?: boolean;
  },
  projectPath?: string,
): PolicyDecision {
  const policy = loadPolicy(projectPath);
  if (!policy.secrets) return { allowed: true, policySource: "no-policy" };
  const s = policy.secrets;

  if (s.maxTtlSeconds != null && input.ttlSeconds != null && input.ttlSeconds > s.maxTtlSeconds) {
    return {
      allowed: false,
      reason: `TTL ${input.ttlSeconds}s exceeds policy maximum ${s.maxTtlSeconds}s`,
      policySource: ".q-ring.json policy.secrets.maxTtlSeconds",
    };
  }

  if (s.requireApprovalForTags?.length && input.tags?.length) {
    const hit = input.tags.find((t) => s.requireApprovalForTags!.includes(t));
    if (hit && !input.requiresApproval) {
      return {
        allowed: false,
        reason: `Tag "${hit}" requires explicit approval metadata (set requiresApproval / --requires-approval)`,
        policySource: ".q-ring.json policy.secrets.requireApprovalForTags",
      };
    }
  }

  if (s.requireRotationFormatForTags?.length && input.tags?.length) {
    const hit = input.tags.find((t) => s.requireRotationFormatForTags!.includes(t));
    if (hit && !input.rotationFormat) {
      return {
        allowed: false,
        reason: `Tag "${hit}" requires a rotationFormat to be set`,
        policySource: ".q-ring.json policy.secrets.requireRotationFormatForTags",
      };
    }
  }

  return { allowed: true, policySource: ".q-ring.json" };
}

export function checkKeyReadPolicy(key: string, tags: string[] | undefined, projectPath?: string): PolicyDecision {
  const policy = loadPolicy(projectPath);
  if (!policy.mcp) return { allowed: true, policySource: "no-policy" };

  if (policy.mcp.deniedKeys?.includes(key)) {
    return {
      allowed: false,
      reason: `Key "${key}" is denied by project policy`,
      policySource: ".q-ring.json policy.mcp.deniedKeys",
    };
  }

  if (policy.mcp.readableKeys && !policy.mcp.readableKeys.includes(key)) {
    return {
      allowed: false,
      reason: `Key "${key}" is not in the readable keys allowlist`,
      policySource: ".q-ring.json policy.mcp.readableKeys",
    };
  }

  if (tags && policy.mcp.deniedTags) {
    const blocked = tags.find((t) => policy.mcp!.deniedTags!.includes(t));
    if (blocked) {
      return {
        allowed: false,
        reason: `Tag "${blocked}" is denied by project policy`,
        policySource: ".q-ring.json policy.mcp.deniedTags",
      };
    }
  }

  return { allowed: true, policySource: ".q-ring.json" };
}

export function checkExecPolicy(command: string, projectPath?: string): PolicyDecision {
  const policy = loadPolicy(projectPath);
  if (!policy.exec) return { allowed: true, policySource: "no-policy" };

  if (policy.exec.denyCommands) {
    const denied = policy.exec.denyCommands.find((d) => command.includes(d));
    if (denied) {
      return {
        allowed: false,
        reason: `Command containing "${denied}" is denied by project policy`,
        policySource: ".q-ring.json policy.exec.denyCommands",
      };
    }
  }

  if (policy.exec.allowCommands) {
    const allowed = policy.exec.allowCommands.some((a) => command.startsWith(a));
    if (!allowed) {
      return {
        allowed: false,
        reason: `Command "${command}" is not in the exec allowlist`,
        policySource: ".q-ring.json policy.exec.allowCommands",
      };
    }
  }

  return { allowed: true, policySource: ".q-ring.json" };
}

export function getExecMaxRuntime(projectPath?: string): number | undefined {
  return loadPolicy(projectPath).exec?.maxRuntimeSeconds;
}

export function getPolicySummary(projectPath?: string): {
  hasMcpPolicy: boolean;
  hasExecPolicy: boolean;
  hasSecretPolicy: boolean;
  details: PolicyConfig;
} {
  const policy = loadPolicy(projectPath);
  return {
    hasMcpPolicy: !!policy.mcp,
    hasExecPolicy: !!policy.exec,
    hasSecretPolicy: !!policy.secrets,
    details: policy,
  };
}
