import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { filterSecretsByKeyGlob } from "../../services/list-secrets-filter.js";
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
} from "../../core/keyring.js";
import { checkDecay } from "../../core/envelope.js";
import type { Scope } from "../../core/scope.js";
import {
  generateSecret,
  estimateEntropy,
  type NoiseFormat,
} from "../../core/noise.js";
import { importDotenv } from "../../core/import.js";
import { checkKeyReadPolicy } from "../../core/policy.js";
import { text, opts, enforceToolPolicy, commonSchemas } from "./_shared.js";

const { teamId, orgId, scope, projectPath, env } = commonSchemas;

export function registerSecretTools(server: McpServer): void {
  server.tool(
    "get_secret",
    "[secrets] Retrieve a secret by key. Collapses superposition if the secret has multiple environment states. Records access in audit log (observer effect).",
    {
      key: z.string().describe("The secret key name"),
      scope,
      projectPath,
      env,
      teamId,
      orgId,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("get_secret", params.projectPath);
      if (toolBlock) return toolBlock;

      try {
        const keyBlock = checkKeyReadPolicy(
          params.key,
          undefined,
          params.projectPath,
        );
        if (!keyBlock.allowed) {
          return text(`Policy Denied: ${keyBlock.reason}`, true);
        }

        const value = getSecret(params.key, opts(params));
        if (value === null) return text(`Secret "${params.key}" not found`, true);
        return text(
          JSON.stringify({ ok: true, data: { key: params.key, value } }, null, 2),
        );
      } catch (err) {
        return text(err instanceof Error ? err.message : String(err), true);
      }
    },
  );

  server.tool(
    "list_secrets",
    "[secrets] List all secret keys with quantum metadata (scope, decay status, superposition states, entanglement, access count). Values are never exposed. Supports filtering by tag, expiry state, and key pattern.",
    {
      scope,
      projectPath,
      tag: z.string().optional().describe("Filter by tag"),
      expired: z.boolean().optional().describe("Show only expired secrets"),
      stale: z
        .boolean()
        .optional()
        .describe("Show only stale secrets (75%+ decay)"),
      filter: z
        .string()
        .optional()
        .describe("Glob pattern on key name (e.g., 'API_*')"),
      teamId,
      orgId,
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
        entries = filterSecretsByKeyGlob(entries, params.filter);
      }
      const rows = entries.map((e) => ({
        scope: e.scope,
        key: e.key,
        stateKeys: e.envelope?.states
          ? Object.keys(e.envelope.states)
          : undefined,
        expired: !!e.decay?.isExpired,
        stale: !!e.decay?.isStale && !e.decay?.isExpired,
        lifetimePercent: e.decay?.lifetimePercent,
        timeRemaining: e.decay?.timeRemaining ?? null,
        entangledCount: e.envelope?.meta.entangled?.length ?? 0,
        accessCount: e.envelope?.meta.accessCount ?? 0,
      }));

      return text(JSON.stringify({ ok: true, data: { entries: rows } }, null, 2));
    },
  );

  server.tool(
    "set_secret",
    "[secrets] Create or overwrite a secret value plus optional metadata (TTL/decay, per-env superposition, description, tags). Overwrites existing values for the same key/scope; records access in the audit log. Use import_dotenv for bulk .env ingest. Subject to tool policy; no external rate limits beyond provider calls when validating elsewhere.",
    {
      key: z.string().describe("The secret key name"),
      value: z.string().describe("The secret value"),
      scope: scope.default("global"),
      projectPath,
      env: z
        .string()
        .optional()
        .describe(
          "If provided, sets the value for this specific environment (superposition)",
        ),
      ttlSeconds: z
        .number()
        .optional()
        .describe("Time-to-live in seconds (quantum decay)"),
      description: z.string().optional().describe("Human-readable description"),
      tags: z.array(z.string()).optional().describe("Tags for organization"),
      rotationFormat: z
        .enum([
          "hex",
          "base64",
          "alphanumeric",
          "uuid",
          "api-key",
          "token",
          "password",
        ])
        .optional()
        .describe("Format for auto-rotation when this secret expires"),
      rotationPrefix: z
        .string()
        .optional()
        .describe("Prefix for auto-rotation (e.g. 'sk-')"),
      teamId,
      orgId,
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

        return text(
          `[${params.scope ?? "global"}] ${params.key} set for env:${params.env}`,
        );
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
    "[secrets] Permanently remove a secret value from the keyring for the given scope/path (not recoverable from q-ring). Does not remove hooks, tunnels, or entanglement metadata alone—use remove_hook, tunnel_destroy, or disentangle_secrets respectively. Returns success or not-found text; subject to tool policy.",
    {
      key: z.string().describe("The secret key name"),
      scope,
      projectPath,
      teamId,
      orgId,
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
    "[secrets] Check if a secret exists. Returns boolean. Never reveals the value. Respects decay — expired secrets return false.",
    {
      key: z.string().describe("The secret key name"),
      scope,
      projectPath,
      teamId,
      orgId,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("has_secret", params.projectPath);
      if (toolBlock) return toolBlock;

      return text(hasSecret(params.key, opts(params)) ? "true" : "false");
    },
  );

  server.tool(
    "export_secrets",
    "[secrets] Export secrets as .env or JSON format. Collapses superposition. Supports filtering by specific keys or tags.",
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
      scope,
      projectPath,
      env,
      teamId,
      orgId,
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
    "[secrets] Import secrets from .env file content. Parses standard dotenv syntax (comments, quotes, multiline escapes) and stores each key/value pair in q-ring.",
    {
      content: z.string().describe("The .env file content to parse and import"),
      scope: scope.default("global"),
      projectPath,
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
        params.dryRun
          ? "Dry run — no changes made"
          : `Imported ${result.imported.length} secret(s)`,
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
    "inspect_secret",
    "[secrets] Show full quantum state of a secret: superposition states, decay status, entanglement links, access history. Never reveals the actual value.",
    {
      key: z.string().describe("The secret key name"),
      scope,
      projectPath,
      teamId,
      orgId,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("inspect_secret", params.projectPath);
      if (toolBlock) return toolBlock;

      const result = getEnvelope(params.key, opts(params));
      if (!result) return text(`Secret "${params.key}" not found`, true);

      const { envelope, scope: entryScope } = result;
      const decay = checkDecay(envelope);

      const info: Record<string, unknown> = {
        key: params.key,
        scope: entryScope,
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

      if (envelope.meta.description)
        info.description = envelope.meta.description;
      if (envelope.meta.tags?.length) info.tags = envelope.meta.tags;

      return text(JSON.stringify(info, null, 2));
    },
  );

  server.tool(
    "generate_secret",
    "[secrets] Generate a cryptographic secret (quantum noise). Formats: hex, base64, alphanumeric, uuid, api-key, token, password. Optionally save directly to the keyring.",
    {
      format: z
        .enum([
          "hex",
          "base64",
          "alphanumeric",
          "uuid",
          "api-key",
          "token",
          "password",
        ])
        .optional()
        .default("api-key")
        .describe("Output format"),
      length: z.number().optional().describe("Length in bytes or characters"),
      prefix: z.string().optional().describe("Prefix for api-key/token format"),
      saveAs: z
        .string()
        .optional()
        .describe("If provided, save the generated secret with this key name"),
      scope: scope.default("global"),
      projectPath,
      teamId,
      orgId,
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

      return text(JSON.stringify({ ok: true, data: { value: secret } }, null, 2));
    },
  );

  server.tool(
    "entangle_secrets",
    "[secrets] Link two keys so source updates/rotations propagate the same value to the target (mutates metadata; future writes sync). Reverse with disentangle_secrets without deleting values; do not confuse with set_secret (single-key write). Subject to tool policy.",
    {
      sourceKey: z.string().describe("Source secret key"),
      targetKey: z.string().describe("Target secret key"),
      sourceScope: scope.default("global"),
      targetScope: scope.default("global"),
      sourceProjectPath: z.string().optional(),
      targetProjectPath: z.string().optional(),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy(
        "entangle_secrets",
        params.sourceProjectPath,
      );
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
    "[secrets] Remove the sync link between two keys so rotations stop propagating. Does not delete either secret—use delete_secret to erase values. Contrast entangle_secrets (creates link). Safe if the link was already absent; updates metadata; subject to tool policy.",
    {
      sourceKey: z.string().describe("Source secret key"),
      targetKey: z.string().describe("Target secret key"),
      sourceScope: scope.default("global"),
      targetScope: scope.default("global"),
      sourceProjectPath: z.string().optional(),
      targetProjectPath: z.string().optional(),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy(
        "disentangle_secrets",
        params.sourceProjectPath,
      );
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
}
