import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getSecret,
  setSecret,
  listSecrets,
} from "../../core/keyring.js";
import { teleportPack, teleportUnpack } from "../../core/teleport.js";
import { text, opts, enforceToolPolicy, commonSchemas } from "./_shared.js";

const { teamId, orgId, scope, projectPath } = commonSchemas;

export function registerTeleportTools(server: McpServer): void {
  server.tool(
    "teleport_pack",
    "[teleport] Pack secrets into an AES-256-GCM encrypted bundle for sharing between machines (quantum teleportation).",
    {
      keys: z
        .array(z.string())
        .optional()
        .describe("Specific keys to pack (all if omitted)"),
      passphrase: z.string().describe("Encryption passphrase"),
      scope,
      projectPath,
      teamId,
      orgId,
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
    "[teleport] Decrypt and import secrets from a teleport bundle.",
    {
      bundle: z.string().describe("Base64-encoded encrypted bundle"),
      passphrase: z.string().describe("Decryption passphrase"),
      scope: scope.default("global"),
      projectPath,
      teamId,
      orgId,
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
          return text(
            `Would import ${payload.secrets.length} secrets:\n${preview}`,
          );
        }

        const o = opts(params);
        for (const s of payload.secrets) {
          setSecret(s.key, s.value, o);
        }

        return text(
          `Imported ${payload.secrets.length} secret(s) from teleport bundle`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return text(JSON.stringify({ ok: false, error: { message: msg } }), true);
      }
    },
  );
}
