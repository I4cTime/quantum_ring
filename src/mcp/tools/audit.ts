import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listSecrets } from "../../core/keyring.js";
import {
  queryAudit,
  detectAnomalies,
  verifyAuditChain,
  exportAudit,
} from "../../core/observer.js";
import { text, opts, enforceToolPolicy, commonSchemas } from "./_shared.js";

const { teamId, orgId, scope, projectPath } = commonSchemas;

export function registerAuditTools(server: McpServer): void {
  server.tool(
    "audit_log",
    "[audit] Query the audit log for secret access history (observer effect). Shows who accessed what and when.",
    {
      key: z.string().optional().describe("Filter by key"),
      action: z
        .enum([
          "read",
          "write",
          "delete",
          "list",
          "export",
          "generate",
          "entangle",
          "tunnel",
          "teleport",
          "collapse",
        ])
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
    "[audit] Scan for anomalous secret access patterns: burst reads, unusual-hour access. Returns findings and recommendations.",
    {
      key: z.string().optional().describe("Check anomalies for a specific key"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("detect_anomalies");
      if (toolBlock) return toolBlock;

      const anomalies = detectAnomalies(params.key);
      if (anomalies.length === 0) return text("No anomalies detected");

      const lines = anomalies.map((a) => `[${a.type}] ${a.description}`);
      return text(lines.join("\n"));
    },
  );

  server.tool(
    "health_check",
    "[health] Run a comprehensive health check on all secrets: decay status, staleness, anomalies, entropy assessment.",
    {
      scope,
      projectPath,
      teamId,
      orgId,
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

  server.tool(
    "verify_audit_chain",
    "[audit] Verify the tamper-evident hash chain of the audit log. Returns integrity status and the first break point if tampered.",
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
    "[audit] Export audit events in a portable format (jsonl, json, or csv) with optional time range filtering.",
    {
      since: z.string().optional().describe("Start date (ISO 8601)"),
      until: z.string().optional().describe("End date (ISO 8601)"),
      format: z
        .enum(["jsonl", "json", "csv"])
        .optional()
        .default("jsonl")
        .describe("Output format"),
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
}
