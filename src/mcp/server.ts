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
  exportSecrets,
  type KeyringOptions,
} from "../core/keyring.js";
import { runHealthScan } from "../core/agent.js";
import { checkDecay, collapseValue } from "../core/envelope.js";
import { collapseEnvironment } from "../core/collapse.js";
import type { Scope } from "../core/scope.js";
import { queryAudit, detectAnomalies } from "../core/observer.js";
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
}): KeyringOptions {
  return {
    scope: params.scope as Scope | undefined,
    projectPath: params.projectPath ?? process.cwd(),
    env: params.env,
    source: "mcp",
  };
}

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "q-ring",
    version: "0.2.0",
  });

  const scopeSchema = z
    .enum(["global", "project"])
    .optional()
    .describe("Scope: global or project");
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
    },
    async (params) => {
      const value = getSecret(params.key, opts(params));
      if (value === null) return text(`Secret "${params.key}" not found`, true);
      return text(value);
    },
  );

  server.tool(
    "list_secrets",
    "List all secret keys with quantum metadata (scope, decay status, superposition states, entanglement, access count). Values are never exposed.",
    {
      scope: scopeSchema,
      projectPath: projectPathSchema,
    },
    async (params) => {
      const entries = listSecrets(opts(params));
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
    },
    async (params) => {
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
        });

        return text(`[${params.scope ?? "global"}] ${params.key} set for env:${params.env}`);
      }

      setSecret(params.key, params.value, {
        ...o,
        ttlSeconds: params.ttlSeconds,
        description: params.description,
        tags: params.tags,
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
    },
    async (params) => {
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
    },
    async (params) => {
      return text(hasSecret(params.key, opts(params)) ? "true" : "false");
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
    },
    async (params) => {
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
    },
    async (params) => {
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
    },
    async (params) => {
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
      dryRun: z
        .boolean()
        .optional()
        .default(false)
        .describe("Preview without importing"),
    },
    async (params) => {
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
    },
    async (params) => {
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

  // ─── Status Dashboard ───

  let dashboardInstance: { port: number; close: () => void } | null = null;

  server.tool(
    "status_dashboard",
    "Launch the quantum status dashboard — a local web page showing live health, decay timers, superposition states, entanglement graph, tunnels, audit log, and anomaly alerts. Returns the URL to open in a browser.",
    {
      port: z.number().optional().default(9876).describe("Port to serve on"),
    },
    async (params) => {
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
      const report = runHealthScan({
        autoRotate: params.autoRotate,
        projectPaths: params.projectPaths ?? [process.cwd()],
      });
      return text(JSON.stringify(report, null, 2));
    },
  );

  return server;
}
