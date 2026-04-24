import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  tunnelCreate,
  tunnelRead,
  tunnelDestroy,
  tunnelList,
} from "../../core/tunnel.js";
import { text, enforceToolPolicy } from "./_shared.js";

export function registerTunnelTools(server: McpServer): void {
  server.tool(
    "tunnel_create",
    "[tunnel] Create an ephemeral secret that exists only in memory (quantum tunneling). Never persisted to disk. Optional TTL and max-reads for self-destruction.",
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
      return text(JSON.stringify({ ok: true, data: { id } }, null, 2));
    },
  );

  server.tool(
    "tunnel_read",
    "[tunnel] Read an ephemeral tunneled secret by ID. May self-destruct if max-reads is reached.",
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
      return text(
        JSON.stringify({ ok: true, data: { id: params.id, value } }, null, 2),
      );
    },
  );

  server.tool(
    "tunnel_list",
    "[tunnel] List active tunneled secrets (IDs and metadata only, never values).",
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
          const rem = Math.max(
            0,
            Math.floor((t.expiresAt - Date.now()) / 1000),
          );
          parts.push(`expires:${rem}s`);
        }
        return parts.join(" | ");
      });

      return text(lines.join("\n"));
    },
  );

  server.tool(
    "tunnel_destroy",
    "[tunnel] Immediately destroy a tunneled secret.",
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
}
