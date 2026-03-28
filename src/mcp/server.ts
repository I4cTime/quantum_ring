import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getSecret,
  setSecret,
  deleteSecret,
  hasSecret,
  listSecrets,
  getEnvelope,
  entangleSecrets,
  disentangleSecrets,
  exportSecrets,
  type KeyringOptions,
} from "../core/keyring.js";
import { runHealthScan } from "../core/agent.js";
import { checkDecay, collapseValue } from "../core/envelope.js";
import { collapseEnvironment, readProjectConfig } from "../core/collapse.js";
import type { Scope } from "../core/scope.js";
import { queryAudit, detectAnomalies, verifyAuditChain, exportAudit } from "../core/observer.js";
import {
  generateSecret,
  estimateEntropy,
  type NoiseFormat,
} from "../core/noise.js";
import {
  tunnelCreate,
  tunnelRead,
  tunnelDestroy,
  tunnelList,
} from "../core/tunnel.js";
import { teleportPack, teleportUnpack } from "../core/teleport.js";
import { importDotenv, parseDotenv } from "../core/import.js";
import { execCommand } from "../core/exec.js";
import { scanCodebase } from "../core/scan.js";
import { lintFiles } from "../core/linter.js";
import { getProjectContext } from "../core/context.js";
import { remember, recall, listMemory, forget } from "../core/memory.js";
import { checkToolPolicy, checkKeyReadPolicy, checkExecPolicy, getPolicySummary } from "../core/policy.js";
import { validateSecret, rotateWithProvider, ciValidateBatch, registry as providerRegistry } from "../core/validate.js";
import {
  registerHook,
  removeHook,
  listHooks as listAllHooks,
  type HookType,
  type HookAction,
} from "../core/hooks.js";

function text(t: string, isError = false) {
  return {
    content: [{ type: "text" as const, text: t }],
    ...(isError ? { isError: true } : {}),
  };
}

function opts(params: {
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

function enforceToolPolicy(toolName: string, projectPath?: string) {
  const decision = checkToolPolicy(toolName, projectPath);
  if (!decision.allowed) {
    return text(`Policy Denied: ${decision.reason} (source: ${decision.policySource})`, true);
  }
  return null;
}

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "q-ring",
    version: "0.2.0",
  });

  const teamIdSchema = z.string().optional().describe("Team identifier for team-scoped secrets");
  const orgIdSchema = z.string().optional().describe("Org identifier for org-scoped secrets");
  const scopeSchema = z
    .enum(["global", "project", "team", "org"])
    .optional()
    .describe("Scope: global, project, team, or org");
  const projectPathSchema = z
    .string()
    .optional()
    .describe("Project root path for project-scoped secrets");
  const envSchema = z
    .string()
    .optional()
    .describe("Environment for superposition collapse (e.g., dev, staging, prod)");

  // ─── Core Tools ───

  server.tool(
    "get_secret",
    "Retrieve a secret by key. Collapses superposition if the secret has multiple environment states. Records access in audit log (observer effect).",
    {
      key: z.string().describe("The secret key name"),
      scope: scopeSchema,
      projectPath: projectPathSchema,
      env: envSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("get_secret", params.projectPath);
      if (toolBlock) return toolBlock;

      try {
        const keyBlock = checkKeyReadPolicy(params.key, undefined, params.projectPath);
        if (!keyBlock.allowed) {
          return text(`Policy Denied: ${keyBlock.reason}`, true);
        }

        const value = getSecret(params.key, opts(params));
        if (value === null) return text(`Secret "${params.key}" not found`, true);
        return text(value);
      } catch (err) {
        return text(err instanceof Error ? err.message : String(err), true);
      }
    },
  );

  server.tool(
    "list_secrets",
    "List all secret keys with quantum metadata (scope, decay status, superposition states, entanglement, access count). Values are never exposed. Supports filtering by tag, expiry state, and key pattern.",
    {
      scope: scopeSchema,
      projectPath: projectPathSchema,
      tag: z.string().optional().describe("Filter by tag"),
      expired: z.boolean().optional().describe("Show only expired secrets"),
      stale: z.boolean().optional().describe("Show only stale secrets (75%+ decay)"),
      filter: z.string().optional().describe("Glob pattern on key name (e.g., 'API_*')"),
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("list_secrets", params.projectPath);
      if (toolBlock) return toolBlock;

      let entries = listSecrets(opts(params));

      if (params.tag) {
        entries = entries.filter((e) =>
          e.envelope?.meta.tags?.includes(params.tag!),
        );
      }
      if (params.expired) {
        entries = entries.filter((e) => e.decay?.isExpired);
      }
      if (params.stale) {
        entries = entries.filter(
          (e) => e.decay?.isStale && !e.decay?.isExpired,
        );
      }
      if (params.filter) {
        const escaped = params.filter.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
        const regex = new RegExp("^" + escaped + "$", "i");
        entries = entries.filter((e) => regex.test(e.key));
      }
      if (entries.length === 0) return text("No secrets found");

      const lines = entries.map((e) => {
        const parts = [`[${e.scope}] ${e.key}`];

        if (e.envelope?.states) {
          parts.push(`states:[${Object.keys(e.envelope.states).join(",")}]`);
        }
        if (e.decay?.isExpired) {
          parts.push("EXPIRED");
        } else if (e.decay?.isStale) {
          parts.push(`stale(${e.decay.lifetimePercent}%)`);
        }
        if (e.decay?.timeRemaining && !e.decay.isExpired) {
          parts.push(`ttl:${e.decay.timeRemaining}`);
        }
        if (e.envelope?.meta.entangled?.length) {
          parts.push(`entangled:${e.envelope.meta.entangled.length}`);
        }
        if (e.envelope && e.envelope.meta.accessCount > 0) {
          parts.push(`reads:${e.envelope.meta.accessCount}`);
        }

        return parts.join(" | ");
      });

      return text(lines.join("\n"));
    },
  );

  server.tool(
    "set_secret",
    "Store a secret with optional quantum metadata: TTL (decay), environment state (superposition), description, tags.",
    {
      key: z.string().describe("The secret key name"),
      value: z.string().describe("The secret value"),
      scope: scopeSchema.default("global"),
      projectPath: projectPathSchema,
      env: z
        .string()
        .optional()
        .describe("If provided, sets the value for this specific environment (superposition)"),
      ttlSeconds: z
        .number()
        .optional()
        .describe("Time-to-live in seconds (quantum decay)"),
      description: z.string().optional().describe("Human-readable description"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Tags for organization"),
      rotationFormat: z
        .enum(["hex", "base64", "alphanumeric", "uuid", "api-key", "token", "password"])
        .optional()
        .describe("Format for auto-rotation when this secret expires"),
      rotationPrefix: z
        .string()
        .optional()
        .describe("Prefix for auto-rotation (e.g. 'sk-')"),
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("set_secret", params.projectPath);
      if (toolBlock) return toolBlock;

      const o = opts(params);

      if (params.env) {
        const existing = getEnvelope(params.key, o);
        const states = existing?.envelope?.states ?? {};
        states[params.env] = params.value;

        if (existing?.envelope?.value && !states["default"]) {
          states["default"] = existing.envelope.value;
        }

        setSecret(params.key, "", {
          ...o,
          states,
          defaultEnv: existing?.envelope?.defaultEnv ?? params.env,
          ttlSeconds: params.ttlSeconds,
          description: params.description,
          tags: params.tags,
          rotationFormat: params.rotationFormat,
          rotationPrefix: params.rotationPrefix,
        });

        return text(`[${params.scope ?? "global"}] ${params.key} set for env:${params.env}`);
      }

      setSecret(params.key, params.value, {
        ...o,
        ttlSeconds: params.ttlSeconds,
        description: params.description,
        tags: params.tags,
        rotationFormat: params.rotationFormat,
        rotationPrefix: params.rotationPrefix,
      });

      return text(`[${params.scope ?? "global"}] ${params.key} saved`);
    },
  );

  server.tool(
    "delete_secret",
    "Remove a secret from the keyring.",
    {
      key: z.string().describe("The secret key name"),
      scope: scopeSchema,
      projectPath: projectPathSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("delete_secret", params.projectPath);
      if (toolBlock) return toolBlock;

      const deleted = deleteSecret(params.key, opts(params));
      return text(
        deleted ? `Deleted "${params.key}"` : `Secret "${params.key}" not found`,
        !deleted,
      );
    },
  );

  server.tool(
    "has_secret",
    "Check if a secret exists. Returns boolean. Never reveals the value. Respects decay — expired secrets return false.",
    {
      key: z.string().describe("The secret key name"),
      scope: scopeSchema,
      projectPath: projectPathSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("has_secret", params.projectPath);
      if (toolBlock) return toolBlock;

      return text(hasSecret(params.key, opts(params)) ? "true" : "false");
    },
  );

  server.tool(
    "export_secrets",
    "Export secrets as .env or JSON format. Collapses superposition. Supports filtering by specific keys or tags.",
    {
      format: z
        .enum(["env", "json"])
        .optional()
        .default("env")
        .describe("Output format"),
      keys: z
        .array(z.string())
        .optional()
        .describe("Only export these specific key names"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Only export secrets with any of these tags"),
      scope: scopeSchema,
      projectPath: projectPathSchema,
      env: envSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("export_secrets", params.projectPath);
      if (toolBlock) return toolBlock;

      const output = exportSecrets({
        ...opts(params),
        format: params.format as "env" | "json",
        keys: params.keys,
        tags: params.tags,
      });

      if (!output.trim()) return text("No secrets matched the filters", true);
      return text(output);
    },
  );

  server.tool(
    "import_dotenv",
    "Import secrets from .env file content. Parses standard dotenv syntax (comments, quotes, multiline escapes) and stores each key/value pair in q-ring.",
    {
      content: z.string().describe("The .env file content to parse and import"),
      scope: scopeSchema.default("global"),
      projectPath: projectPathSchema,
      skipExisting: z
        .boolean()
        .optional()
        .default(false)
        .describe("Skip keys that already exist in q-ring"),
      dryRun: z
        .boolean()
        .optional()
        .default(false)
        .describe("Preview what would be imported without saving"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("import_dotenv", params.projectPath);
      if (toolBlock) return toolBlock;

      const result = importDotenv(params.content, {
        scope: params.scope as "global" | "project",
        projectPath: params.projectPath ?? process.cwd(),
        source: "mcp",
        skipExisting: params.skipExisting,
        dryRun: params.dryRun,
      });

      const lines = [
        params.dryRun ? "Dry run — no changes made" : `Imported ${result.imported.length} secret(s)`,
      ];

      if (result.imported.length > 0) {
        lines.push(`Keys: ${result.imported.join(", ")}`);
      }
      if (result.skipped.length > 0) {
        lines.push(`Skipped (existing): ${result.skipped.join(", ")}`);
      }

      return text(lines.join("\n"));
    },
  );

  server.tool(
    "check_project",
    "Validate project secrets against the .q-ring.json manifest. Returns which required secrets are present, missing, expired, or stale. Use this to verify project readiness.",
    {
      projectPath: projectPathSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("check_project", params.projectPath);
      if (toolBlock) return toolBlock;

      const projectPath = params.projectPath ?? process.cwd();
      const config = readProjectConfig(projectPath);

      if (!config?.secrets || Object.keys(config.secrets).length === 0) {
        return text("No secrets manifest found in .q-ring.json", true);
      }

      const results: Record<string, unknown>[] = [];
      let presentCount = 0;
      let missingCount = 0;
      let expiredCount = 0;
      let staleCount = 0;

      for (const [key, manifest] of Object.entries(config.secrets)) {
        const result = getEnvelope(key, { projectPath, source: "mcp" });

        if (!result) {
          const status = manifest.required !== false ? "missing" : "optional_missing";
          if (manifest.required !== false) missingCount++;
          results.push({ key, status, required: manifest.required !== false, description: manifest.description });
          continue;
        }

        const decay = checkDecay(result.envelope);

        if (decay.isExpired) {
          expiredCount++;
          results.push({ key, status: "expired", timeRemaining: decay.timeRemaining, description: manifest.description });
        } else if (decay.isStale) {
          staleCount++;
          results.push({ key, status: "stale", lifetimePercent: decay.lifetimePercent, timeRemaining: decay.timeRemaining, description: manifest.description });
        } else {
          presentCount++;
          results.push({ key, status: "ok", description: manifest.description });
        }
      }

      const summary = {
        total: Object.keys(config.secrets).length,
        present: presentCount,
        missing: missingCount,
        expired: expiredCount,
        stale: staleCount,
        ready: missingCount === 0 && expiredCount === 0,
        secrets: results,
      };

      return text(JSON.stringify(summary, null, 2));
    },
  );

  server.tool(
    "env_generate",
    "Generate .env file content from the project manifest (.q-ring.json). Resolves each declared secret from q-ring, collapses superposition, and returns .env formatted output. Warns about missing or expired secrets.",
    {
      projectPath: projectPathSchema,
      env: envSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("env_generate", params.projectPath);
      if (toolBlock) return toolBlock;

      const projectPath = params.projectPath ?? process.cwd();
      const config = readProjectConfig(projectPath);

      if (!config?.secrets || Object.keys(config.secrets).length === 0) {
        return text("No secrets manifest found in .q-ring.json", true);
      }

      const lines: string[] = [];
      const warnings: string[] = [];

      for (const [key, manifest] of Object.entries(config.secrets)) {
        const value = getSecret(key, {
          projectPath,
          env: params.env,
          source: "mcp",
        });

        if (value === null) {
          if (manifest.required !== false) {
            warnings.push(`MISSING (required): ${key}`);
          }
          lines.push(`# ${key}=`);
          continue;
        }

        const result = getEnvelope(key, { projectPath, source: "mcp" });
        if (result) {
          const decay = checkDecay(result.envelope);
          if (decay.isExpired) warnings.push(`EXPIRED: ${key}`);
          else if (decay.isStale) warnings.push(`STALE: ${key}`);
        }

        const escaped = value
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\n/g, "\\n");
        lines.push(`${key}="${escaped}"`);
      }

      const output = lines.join("\n");
      const result = warnings.length > 0
        ? `${output}\n\n# Warnings:\n${warnings.map((w) => `# ${w}`).join("\n")}`
        : output;

      return text(result);
    },
  );

  // ─── Quantum Tools ───

  server.tool(
    "inspect_secret",
    "Show full quantum state of a secret: superposition states, decay status, entanglement links, access history. Never reveals the actual value.",
    {
      key: z.string().describe("The secret key name"),
      scope: scopeSchema,
      projectPath: projectPathSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("inspect_secret", params.projectPath);
      if (toolBlock) return toolBlock;

      const result = getEnvelope(params.key, opts(params));
      if (!result) return text(`Secret "${params.key}" not found`, true);

      const { envelope, scope } = result;
      const decay = checkDecay(envelope);

      const info: Record<string, unknown> = {
        key: params.key,
        scope,
        type: envelope.states ? "superposition" : "collapsed",
        created: envelope.meta.createdAt,
        updated: envelope.meta.updatedAt,
        accessCount: envelope.meta.accessCount,
        lastAccessed: envelope.meta.lastAccessedAt ?? "never",
      };

      if (envelope.states) {
        info.environments = Object.keys(envelope.states);
        info.defaultEnv = envelope.defaultEnv;
      }

      if (decay.timeRemaining) {
        info.decay = {
          expired: decay.isExpired,
          stale: decay.isStale,
          lifetimePercent: decay.lifetimePercent,
          timeRemaining: decay.timeRemaining,
        };
      }

      if (envelope.meta.entangled?.length) {
        info.entangled = envelope.meta.entangled;
      }

      if (envelope.meta.description) info.description = envelope.meta.description;
      if (envelope.meta.tags?.length) info.tags = envelope.meta.tags;

      return text(JSON.stringify(info, null, 2));
    },
  );

  server.tool(
    "detect_environment",
    "Detect the current environment context (wavefunction collapse). Returns the detected environment and its source (NODE_ENV, git branch, project config, etc.).",
    {
      projectPath: projectPathSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("detect_environment", params.projectPath);
      if (toolBlock) return toolBlock;

      const result = collapseEnvironment({
        projectPath: params.projectPath ?? process.cwd(),
      });

      if (!result) {
        return text(
          "No environment detected. Set QRING_ENV, NODE_ENV, or create .q-ring.json",
        );
      }

      return text(JSON.stringify(result, null, 2));
    },
  );

  server.tool(
    "generate_secret",
    "Generate a cryptographic secret (quantum noise). Formats: hex, base64, alphanumeric, uuid, api-key, token, password. Optionally save directly to the keyring.",
    {
      format: z
        .enum(["hex", "base64", "alphanumeric", "uuid", "api-key", "token", "password"])
        .optional()
        .default("api-key")
        .describe("Output format"),
      length: z.number().optional().describe("Length in bytes or characters"),
      prefix: z.string().optional().describe("Prefix for api-key/token format"),
      saveAs: z.string().optional().describe("If provided, save the generated secret with this key name"),
      scope: scopeSchema.default("global"),
      projectPath: projectPathSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("generate_secret", params.projectPath);
      if (toolBlock) return toolBlock;

      const secret = generateSecret({
        format: params.format as NoiseFormat,
        length: params.length,
        prefix: params.prefix,
      });

      if (params.saveAs) {
        setSecret(params.saveAs, secret, {
          ...opts(params),
          description: `Generated ${params.format} secret`,
        });
        const entropy = estimateEntropy(secret);
        return text(
          `Generated and saved as "${params.saveAs}" (${params.format}, ~${entropy} bits entropy)`,
        );
      }

      return text(secret);
    },
  );

  server.tool(
    "entangle_secrets",
    "Create a quantum entanglement between two secrets. When the source is rotated/updated, the target automatically receives the same value.",
    {
      sourceKey: z.string().describe("Source secret key"),
      targetKey: z.string().describe("Target secret key"),
      sourceScope: scopeSchema.default("global"),
      targetScope: scopeSchema.default("global"),
      sourceProjectPath: z.string().optional(),
      targetProjectPath: z.string().optional(),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("entangle_secrets", params.sourceProjectPath);
      if (toolBlock) return toolBlock;

      entangleSecrets(
        params.sourceKey,
        {
          scope: params.sourceScope as Scope,
          projectPath: params.sourceProjectPath ?? process.cwd(),
          source: "mcp",
        },
        params.targetKey,
        {
          scope: params.targetScope as Scope,
          projectPath: params.targetProjectPath ?? process.cwd(),
          source: "mcp",
        },
      );

      return text(`Entangled: ${params.sourceKey} <-> ${params.targetKey}`);
    },
  );

  server.tool(
    "disentangle_secrets",
    "Remove a quantum entanglement between two secrets. They will no longer synchronize on rotation.",
    {
      sourceKey: z.string().describe("Source secret key"),
      targetKey: z.string().describe("Target secret key"),
      sourceScope: scopeSchema.default("global"),
      targetScope: scopeSchema.default("global"),
      sourceProjectPath: z.string().optional(),
      targetProjectPath: z.string().optional(),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("disentangle_secrets", params.sourceProjectPath);
      if (toolBlock) return toolBlock;

      disentangleSecrets(
        params.sourceKey,
        {
          scope: params.sourceScope as Scope,
          projectPath: params.sourceProjectPath ?? process.cwd(),
          source: "mcp",
        },
        params.targetKey,
        {
          scope: params.targetScope as Scope,
          projectPath: params.targetProjectPath ?? process.cwd(),
          source: "mcp",
        },
      );

      return text(`Disentangled: ${params.sourceKey} </> ${params.targetKey}`);
    },
  );

  // ─── Tunneling Tools ───

  server.tool(
    "tunnel_create",
    "Create an ephemeral secret that exists only in memory (quantum tunneling). Never persisted to disk. Optional TTL and max-reads for self-destruction.",
    {
      value: z.string().describe("The secret value"),
      ttlSeconds: z.number().optional().describe("Auto-expire after N seconds"),
      maxReads: z.number().optional().describe("Self-destruct after N reads"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("tunnel_create");
      if (toolBlock) return toolBlock;

      const id = tunnelCreate(params.value, {
        ttlSeconds: params.ttlSeconds,
        maxReads: params.maxReads,
      });
      return text(id);
    },
  );

  server.tool(
    "tunnel_read",
    "Read an ephemeral tunneled secret by ID. May self-destruct if max-reads is reached.",
    {
      id: z.string().describe("Tunnel ID"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("tunnel_read");
      if (toolBlock) return toolBlock;

      const value = tunnelRead(params.id);
      if (value === null) {
        return text(`Tunnel "${params.id}" not found or expired`, true);
      }
      return text(value);
    },
  );

  server.tool(
    "tunnel_list",
    "List active tunneled secrets (IDs and metadata only, never values).",
    {},
    async () => {
      const toolBlock = enforceToolPolicy("tunnel_list");
      if (toolBlock) return toolBlock;

      const tunnels = tunnelList();
      if (tunnels.length === 0) return text("No active tunnels");

      const lines = tunnels.map((t) => {
        const parts = [t.id];
        parts.push(`reads:${t.accessCount}`);
        if (t.maxReads) parts.push(`max:${t.maxReads}`);
        if (t.expiresAt) {
          const rem = Math.max(0, Math.floor((t.expiresAt - Date.now()) / 1000));
          parts.push(`expires:${rem}s`);
        }
        return parts.join(" | ");
      });

      return text(lines.join("\n"));
    },
  );

  server.tool(
    "tunnel_destroy",
    "Immediately destroy a tunneled secret.",
    {
      id: z.string().describe("Tunnel ID"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("tunnel_destroy");
      if (toolBlock) return toolBlock;

      const destroyed = tunnelDestroy(params.id);
      return text(
        destroyed ? `Destroyed ${params.id}` : `Tunnel "${params.id}" not found`,
        !destroyed,
      );
    },
  );

  // ─── Teleportation Tools ───

  server.tool(
    "teleport_pack",
    "Pack secrets into an AES-256-GCM encrypted bundle for sharing between machines (quantum teleportation).",
    {
      keys: z
        .array(z.string())
        .optional()
        .describe("Specific keys to pack (all if omitted)"),
      passphrase: z.string().describe("Encryption passphrase"),
      scope: scopeSchema,
      projectPath: projectPathSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("teleport_pack", params.projectPath);
      if (toolBlock) return toolBlock;

      const o = opts(params);
      const entries = listSecrets(o);

      const secrets: { key: string; value: string; scope?: string }[] = [];
      for (const entry of entries) {
        if (params.keys && !params.keys.includes(entry.key)) continue;
        const value = getSecret(entry.key, { ...o, scope: entry.scope });
        if (value !== null) {
          secrets.push({ key: entry.key, value, scope: entry.scope });
        }
      }

      if (secrets.length === 0) return text("No secrets to pack", true);

      const bundle = teleportPack(secrets, params.passphrase);
      return text(bundle);
    },
  );

  server.tool(
    "teleport_unpack",
    "Decrypt and import secrets from a teleport bundle.",
    {
      bundle: z.string().describe("Base64-encoded encrypted bundle"),
      passphrase: z.string().describe("Decryption passphrase"),
      scope: scopeSchema.default("global"),
      projectPath: projectPathSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
      dryRun: z
        .boolean()
        .optional()
        .default(false)
        .describe("Preview without importing"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("teleport_unpack", params.projectPath);
      if (toolBlock) return toolBlock;

      try {
        const payload = teleportUnpack(params.bundle, params.passphrase);

        if (params.dryRun) {
          const preview = payload.secrets
            .map((s) => `${s.key} [${s.scope ?? "global"}]`)
            .join("\n");
          return text(`Would import ${payload.secrets.length} secrets:\n${preview}`);
        }

        const o = opts(params);
        for (const s of payload.secrets) {
          setSecret(s.key, s.value, o);
        }

        return text(`Imported ${payload.secrets.length} secret(s) from teleport bundle`);
      } catch {
        return text("Failed to unpack: wrong passphrase or corrupted bundle", true);
      }
    },
  );

  // ─── Observer / Audit Tools ───

  server.tool(
    "audit_log",
    "Query the audit log for secret access history (observer effect). Shows who accessed what and when.",
    {
      key: z.string().optional().describe("Filter by key"),
      action: z
        .enum(["read", "write", "delete", "list", "export", "generate", "entangle", "tunnel", "teleport", "collapse"])
        .optional()
        .describe("Filter by action"),
      limit: z.number().optional().default(20).describe("Max events to return"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("audit_log");
      if (toolBlock) return toolBlock;

      const events = queryAudit({
        key: params.key,
        action: params.action,
        limit: params.limit,
      });

      if (events.length === 0) return text("No audit events found");

      const lines = events.map((e) => {
        const parts = [e.timestamp, e.action];
        if (e.key) parts.push(e.key);
        if (e.scope) parts.push(`[${e.scope}]`);
        if (e.env) parts.push(`env:${e.env}`);
        if (e.detail) parts.push(e.detail);
        return parts.join(" | ");
      });

      return text(lines.join("\n"));
    },
  );

  server.tool(
    "detect_anomalies",
    "Scan for anomalous secret access patterns: burst reads, unusual-hour access. Returns findings and recommendations.",
    {
      key: z.string().optional().describe("Check anomalies for a specific key"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("detect_anomalies");
      if (toolBlock) return toolBlock;

      const anomalies = detectAnomalies(params.key);
      if (anomalies.length === 0) return text("No anomalies detected");

      const lines = anomalies.map(
        (a) => `[${a.type}] ${a.description}`,
      );
      return text(lines.join("\n"));
    },
  );

  // ─── Health ───

  server.tool(
    "health_check",
    "Run a comprehensive health check on all secrets: decay status, staleness, anomalies, entropy assessment.",
    {
      scope: scopeSchema,
      projectPath: projectPathSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("health_check", params.projectPath);
      if (toolBlock) return toolBlock;

      const entries = listSecrets(opts(params));
      const anomalies = detectAnomalies();

      let healthy = 0;
      let stale = 0;
      let expired = 0;
      let noDecay = 0;
      const issues: string[] = [];

      for (const entry of entries) {
        if (!entry.decay?.timeRemaining) {
          noDecay++;
          continue;
        }
        if (entry.decay.isExpired) {
          expired++;
          issues.push(`EXPIRED: ${entry.key}`);
        } else if (entry.decay.isStale) {
          stale++;
          issues.push(
            `STALE: ${entry.key} (${entry.decay.lifetimePercent}%, ${entry.decay.timeRemaining} left)`,
          );
        } else {
          healthy++;
        }
      }

      const summary = [
        `Secrets: ${entries.length} total`,
        `Healthy: ${healthy} | Stale: ${stale} | Expired: ${expired} | No decay: ${noDecay}`,
        `Anomalies: ${anomalies.length}`,
      ];

      if (issues.length > 0) {
        summary.push("", "Issues:", ...issues);
      }
      if (anomalies.length > 0) {
        summary.push(
          "",
          "Anomalies:",
          ...anomalies.map((a) => `[${a.type}] ${a.description}`),
        );
      }

      return text(summary.join("\n"));
    },
  );

  // ─── Validation Tools ───

  server.tool(
    "validate_secret",
    "Test if a secret is actually valid with its target service (e.g., OpenAI, Stripe, GitHub). Uses provider auto-detection based on key prefixes, or accepts an explicit provider name. Never logs the secret value.",
    {
      key: z.string().describe("The secret key name"),
      provider: z.string().optional().describe("Force a specific provider (openai, stripe, github, aws, http)"),
      scope: scopeSchema,
      projectPath: projectPathSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("validate_secret", params.projectPath);
      if (toolBlock) return toolBlock;

      const value = getSecret(params.key, opts(params));
      if (value === null) return text(`Secret "${params.key}" not found`, true);

      const envelope = getEnvelope(params.key, opts(params));
      const provHint = params.provider ?? envelope?.envelope.meta.provider;

      const result = await validateSecret(value, { provider: provHint });
      return text(JSON.stringify(result, null, 2));
    },
  );

  server.tool(
    "list_providers",
    "List all available validation providers for secret liveness testing.",
    {},
    async () => {
      const toolBlock = enforceToolPolicy("list_providers");
      if (toolBlock) return toolBlock;

      const providers = providerRegistry.listProviders().map((p) => ({
        name: p.name,
        description: p.description,
        prefixes: p.prefixes ?? [],
      }));
      return text(JSON.stringify(providers, null, 2));
    },
  );

  // ─── Hook Tools ───

  server.tool(
    "register_hook",
    "Register a webhook/callback that fires when a secret is updated, deleted, or rotated. Supports shell commands, HTTP webhooks, and process signals.",
    {
      type: z.enum(["shell", "http", "signal"]).describe("Hook type"),
      key: z.string().optional().describe("Trigger on exact key match"),
      keyPattern: z.string().optional().describe("Trigger on key glob pattern (e.g. DB_*)"),
      tag: z.string().optional().describe("Trigger on secrets with this tag"),
      scope: z.enum(["global", "project"]).optional().describe("Trigger only for this scope"),
      actions: z.array(z.enum(["write", "delete", "rotate"])).optional().default(["write", "delete", "rotate"]).describe("Which actions trigger this hook"),
      command: z.string().optional().describe("Shell command to execute (for shell type)"),
      url: z.string().optional().describe("URL to POST to (for http type)"),
      signalTarget: z.string().optional().describe("Process name or PID (for signal type)"),
      signalName: z.string().optional().default("SIGHUP").describe("Signal to send (for signal type)"),
      description: z.string().optional().describe("Human-readable description"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("register_hook");
      if (toolBlock) return toolBlock;

      if (!params.key && !params.keyPattern && !params.tag) {
        return text("At least one match criterion required: key, keyPattern, or tag", true);
      }

      const entry = registerHook({
        type: params.type as HookType,
        match: {
          key: params.key,
          keyPattern: params.keyPattern,
          tag: params.tag,
          scope: params.scope as "global" | "project" | undefined,
          action: params.actions as HookAction[],
        },
        command: params.command,
        url: params.url,
        signal: params.signalTarget ? { target: params.signalTarget, signal: params.signalName } : undefined,
        description: params.description,
        enabled: true,
      });

      return text(JSON.stringify(entry, null, 2));
    },
  );

  server.tool(
    "list_hooks",
    "List all registered secret change hooks with their match criteria, type, and status.",
    {},
    async () => {
      const toolBlock = enforceToolPolicy("list_hooks");
      if (toolBlock) return toolBlock;

      const hooks = listAllHooks();
      if (hooks.length === 0) return text("No hooks registered");
      return text(JSON.stringify(hooks, null, 2));
    },
  );

  server.tool(
    "remove_hook",
    "Remove a registered hook by ID.",
    {
      id: z.string().describe("Hook ID to remove"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("remove_hook");
      if (toolBlock) return toolBlock;

      const removed = removeHook(params.id);
      return text(
        removed ? `Removed hook ${params.id}` : `Hook "${params.id}" not found`,
        !removed,
      );
    },
  );

  // ─── Exec Tools ───

  server.tool(
    "exec_with_secrets",
    "Run a shell command securely. Project secrets are injected into the environment, and any secret values in the output are automatically redacted to prevent leaking into transcripts.",
    {
      command: z.string().describe("Command to run"),
      args: z.array(z.string()).optional().describe("Command arguments"),
      keys: z.array(z.string()).optional().describe("Only inject these specific keys"),
      tags: z.array(z.string()).optional().describe("Only inject secrets with these tags"),
      profile: z.enum(["unrestricted", "restricted", "ci"]).optional().default("restricted").describe("Exec profile: unrestricted, restricted, or ci"),
      scope: scopeSchema,
      projectPath: projectPathSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("exec_with_secrets", params.projectPath);
      if (toolBlock) return toolBlock;

      const execBlock = checkExecPolicy(params.command, params.projectPath);
      if (!execBlock.allowed) {
        return text(`Policy Denied: ${execBlock.reason}`, true);
      }

      try {
        const result = await execCommand({
          command: params.command,
          args: params.args ?? [],
          keys: params.keys,
          tags: params.tags,
          profile: params.profile,
          scope: params.scope,
          projectPath: params.projectPath,
          source: "mcp",
          captureOutput: true,
        });

        const output = [];
        output.push(`Exit code: ${result.code}`);
        if (result.stdout) output.push(`STDOUT:\n${result.stdout}`);
        if (result.stderr) output.push(`STDERR:\n${result.stderr}`);

        return text(output.join("\n\n"));
      } catch (err) {
        return text(`Execution failed: ${err instanceof Error ? err.message : String(err)}`, true);
      }
    },
  );

  // ─── Scan Tools ───

  server.tool(
    "scan_codebase_for_secrets",
    "Scan a directory for hardcoded secrets using regex heuristics and Shannon entropy analysis. Returns file paths, line numbers, and the matched key/value to help migrate legacy codebases into q-ring.",
    {
      dirPath: z.string().describe("Absolute or relative path to the directory to scan"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("scan_codebase_for_secrets");
      if (toolBlock) return toolBlock;

      try {
        const results = scanCodebase(params.dirPath);
        if (results.length === 0) {
          return text("No hardcoded secrets found in the specified directory.");
        }
        
        return text(JSON.stringify(results, null, 2));
      } catch (err) {
        return text(`Scan failed: ${err instanceof Error ? err.message : String(err)}`, true);
      }
    },
  );

  // ─── AI Agent Tools ───

  server.tool(
    "get_project_context",
    "Get a safe, redacted overview of the project's secrets, environment, manifest, providers, hooks, and recent audit activity. No secret values are ever exposed. Use this to understand what secrets exist before asking to read them.",
    {
      scope: scopeSchema,
      projectPath: projectPathSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("get_project_context", params.projectPath);
      if (toolBlock) return toolBlock;

      const context = getProjectContext(opts(params));
      return text(JSON.stringify(context, null, 2));
    },
  );

  server.tool(
    "agent_remember",
    "Store a key-value pair in encrypted agent memory that persists across sessions. Use this to remember decisions, rotation history, or project-specific context.",
    {
      key: z.string().describe("Memory key"),
      value: z.string().describe("Value to store"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("agent_remember");
      if (toolBlock) return toolBlock;

      remember(params.key, params.value);
      return text(`Remembered "${params.key}"`);
    },
  );

  server.tool(
    "agent_recall",
    "Retrieve a value from agent memory, or list all stored keys if no key is provided.",
    {
      key: z.string().optional().describe("Memory key to recall (omit to list all)"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("agent_recall");
      if (toolBlock) return toolBlock;

      if (!params.key) {
        const entries = listMemory();
        if (entries.length === 0) return text("Agent memory is empty");
        return text(JSON.stringify(entries, null, 2));
      }
      const value = recall(params.key);
      if (value === null) return text(`No memory found for "${params.key}"`, true);
      return text(value);
    },
  );

  server.tool(
    "agent_forget",
    "Delete a key from agent memory.",
    {
      key: z.string().describe("Memory key to forget"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("agent_forget");
      if (toolBlock) return toolBlock;

      const removed = forget(params.key);
      return text(removed ? `Forgot "${params.key}"` : `No memory found for "${params.key}"`, !removed);
    },
  );

  server.tool(
    "lint_files",
    "Scan specific files for hardcoded secrets. Optionally auto-fix by replacing them with process.env references and storing the values in q-ring.",
    {
      files: z.array(z.string()).describe("File paths to lint"),
      fix: z.boolean().optional().default(false).describe("Auto-replace and store secrets"),
      scope: scopeSchema,
      projectPath: projectPathSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("lint_files", params.projectPath);
      if (toolBlock) return toolBlock;

      try {
        const results = lintFiles(params.files, {
          fix: params.fix,
          scope: params.scope as any,
          projectPath: params.projectPath,
        });
        if (results.length === 0) {
          return text("No hardcoded secrets found in the specified files.");
        }
        return text(JSON.stringify(results, null, 2));
      } catch (err) {
        return text(`Lint failed: ${err instanceof Error ? err.message : String(err)}`, true);
      }
    },
  );

  server.tool(
    "analyze_secrets",
    "Analyze secret usage patterns and provide optimization suggestions including most accessed, stale, unused, and rotation recommendations.",
    {
      scope: scopeSchema,
      projectPath: projectPathSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("analyze_secrets", params.projectPath);
      if (toolBlock) return toolBlock;

      const o = opts(params);
      const entries = listSecrets({ ...o, silent: true });
      const audit = queryAudit({ limit: 500 });

      const accessMap = new Map<string, number>();
      for (const e of audit) {
        if (e.action === "read" && e.key) {
          accessMap.set(e.key, (accessMap.get(e.key) || 0) + 1);
        }
      }

      const analysis = {
        total: entries.length,
        expired: entries.filter(e => e.decay?.isExpired).length,
        stale: entries.filter(e => e.decay?.isStale && !e.decay?.isExpired).length,
        neverAccessed: entries.filter(e => (e.envelope?.meta.accessCount ?? 0) === 0).map(e => e.key),
        noRotationFormat: entries.filter(e => !e.envelope?.meta.rotationFormat).map(e => e.key),
        mostAccessed: [...accessMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([key, count]) => ({ key, reads: count })),
      };

      return text(JSON.stringify(analysis, null, 2));
    },
  );

  // ─── Status Dashboard ───

  let dashboardInstance: { port: number; close: () => void } | null = null;

  server.tool(
    "status_dashboard",
    "Launch the quantum status dashboard — a local web page showing live health, decay timers, superposition states, entanglement graph, tunnels, audit log, and anomaly alerts. Returns the URL to open in a browser.",
    {
      port: z.number().optional().default(9876).describe("Port to serve on"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("status_dashboard");
      if (toolBlock) return toolBlock;

      if (dashboardInstance) {
        return text(`Dashboard already running at http://127.0.0.1:${dashboardInstance.port}`);
      }

      const { startDashboardServer } = await import("../core/dashboard.js");
      dashboardInstance = startDashboardServer({ port: params.port });

      return text(`Dashboard started at http://127.0.0.1:${dashboardInstance.port}\nOpen this URL in a browser to see live quantum status.`);
    },
  );

  // ─── Agent ───

  server.tool(
    "agent_scan",
    "Run an autonomous agent health scan: checks decay, staleness, anomalies, and optionally auto-rotates expired secrets. Returns a structured report.",
    {
      autoRotate: z
        .boolean()
        .optional()
        .default(false)
        .describe("Auto-rotate expired secrets with generated values"),
      projectPaths: z
        .array(z.string())
        .optional()
        .describe("Project paths to monitor"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("agent_scan");
      if (toolBlock) return toolBlock;

      const report = runHealthScan({
        autoRotate: params.autoRotate,
        projectPaths: params.projectPaths ?? [process.cwd()],
      });
      return text(JSON.stringify(report, null, 2));
    },
  );

  // ─── Audit Integrity ───

  server.tool(
    "verify_audit_chain",
    "Verify the tamper-evident hash chain of the audit log. Returns integrity status and the first break point if tampered.",
    {},
    async () => {
      const toolBlock = enforceToolPolicy("verify_audit_chain");
      if (toolBlock) return toolBlock;

      const result = verifyAuditChain();
      return text(JSON.stringify(result, null, 2));
    },
  );

  server.tool(
    "export_audit",
    "Export audit events in a portable format (jsonl, json, or csv) with optional time range filtering.",
    {
      since: z.string().optional().describe("Start date (ISO 8601)"),
      until: z.string().optional().describe("End date (ISO 8601)"),
      format: z.enum(["jsonl", "json", "csv"]).optional().default("jsonl").describe("Output format"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("export_audit");
      if (toolBlock) return toolBlock;

      const output = exportAudit({
        since: params.since,
        until: params.until,
        format: params.format,
      });
      return text(output);
    },
  );

  // ─── Rotation & CI ───

  server.tool(
    "rotate_secret",
    "Attempt issuer-native rotation of a secret via its detected or specified provider. Returns rotation result.",
    {
      key: z.string().describe("The secret key to rotate"),
      provider: z.string().optional().describe("Force a specific provider"),
      scope: scopeSchema,
      projectPath: projectPathSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("rotate_secret", params.projectPath);
      if (toolBlock) return toolBlock;

      const value = getSecret(params.key, opts(params));
      if (!value) return text(`Secret "${params.key}" not found`, true);

      const result = await rotateWithProvider(value, params.provider);
      if (result.rotated && result.newValue) {
        setSecret(params.key, result.newValue, {
          scope: (params.scope as Scope) ?? "global",
          projectPath: params.projectPath,
          source: "mcp",
        });
      }
      return text(JSON.stringify(result, null, 2));
    },
  );

  server.tool(
    "ci_validate_secrets",
    "CI-oriented batch validation: validates all accessible secrets against their providers and returns a structured pass/fail report.",
    {
      scope: scopeSchema,
      projectPath: projectPathSchema,
      teamId: teamIdSchema,
      orgId: orgIdSchema,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("ci_validate_secrets", params.projectPath);
      if (toolBlock) return toolBlock;

      const entries = listSecrets(opts(params));
      const secrets = entries
        .map((e) => {
          const val = getSecret(e.key, { ...opts(params), scope: e.scope, silent: true });
          if (!val) return null;
          return {
            key: e.key,
            value: val,
            provider: e.envelope?.meta.provider,
            validationUrl: e.envelope?.meta.validationUrl,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      if (secrets.length === 0) return text("No secrets to validate");

      const report = await ciValidateBatch(secrets);
      return text(JSON.stringify(report, null, 2));
    },
  );

  // ─── Governance ───

  server.tool(
    "check_policy",
    "Check if an action is allowed by the project's governance policy. Returns the policy decision and source.",
    {
      action: z.enum(["tool", "key_read", "exec"]).describe("Type of policy check"),
      toolName: z.string().optional().describe("Tool name to check (for action=tool)"),
      key: z.string().optional().describe("Secret key to check (for action=key_read)"),
      command: z.string().optional().describe("Command to check (for action=exec)"),
      projectPath: projectPathSchema,
    },
    async (params) => {
      if (params.action === "tool" && params.toolName) {
        const d = checkToolPolicy(params.toolName, params.projectPath);
        return text(JSON.stringify(d, null, 2));
      }
      if (params.action === "key_read" && params.key) {
        const d = checkKeyReadPolicy(params.key, undefined, params.projectPath);
        return text(JSON.stringify(d, null, 2));
      }
      if (params.action === "exec" && params.command) {
        const d = checkExecPolicy(params.command, params.projectPath);
        return text(JSON.stringify(d, null, 2));
      }
      return text("Missing required parameter for the selected action type", true);
    },
  );

  server.tool(
    "get_policy_summary",
    "Get a summary of the project's governance policy configuration.",
    {
      projectPath: projectPathSchema,
    },
    async (params) => {
      const summary = getPolicySummary(params.projectPath);
      return text(JSON.stringify(summary, null, 2));
    },
  );

  return server;
}
