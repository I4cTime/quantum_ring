import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listSecrets } from "../../core/keyring.js";
import { runHealthScan } from "../../core/agent.js";
import { queryAudit } from "../../core/observer.js";
import { execCommand } from "../../core/exec.js";
import { scanCodebase } from "../../core/scan.js";
import { lintFiles } from "../../core/linter.js";
import { checkExecPolicy } from "../../core/policy.js";
import { text, opts, enforceToolPolicy, commonSchemas } from "./_shared.js";

const { teamId, orgId, scope, projectPath } = commonSchemas;

export function registerToolingTools(server: McpServer): void {
  server.tool(
    "exec_with_secrets",
    "[exec] Run a shell command securely. Project secrets are injected into the environment, and any secret values in the output are automatically redacted to prevent leaking into transcripts.",
    {
      command: z.string().describe("Command to run"),
      args: z.array(z.string()).optional().describe("Command arguments"),
      keys: z
        .array(z.string())
        .optional()
        .describe("Only inject these specific keys"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Only inject secrets with these tags"),
      profile: z
        .enum(["unrestricted", "restricted", "ci"])
        .optional()
        .default("restricted")
        .describe("Exec profile: unrestricted, restricted, or ci"),
      scope,
      projectPath,
      teamId,
      orgId,
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

        const output: string[] = [];
        output.push(`Exit code: ${result.code}`);
        if (result.stdout) output.push(`STDOUT:\n${result.stdout}`);
        if (result.stderr) output.push(`STDERR:\n${result.stderr}`);

        return text(output.join("\n\n"));
      } catch (err) {
        return text(
          `Execution failed: ${err instanceof Error ? err.message : String(err)}`,
          true,
        );
      }
    },
  );

  server.tool(
    "scan_codebase_for_secrets",
    "[scan] Scan a directory for hardcoded secrets using regex heuristics and Shannon entropy analysis. Returns file paths, line numbers, and the matched key/value to help migrate legacy codebases into q-ring.",
    {
      dirPath: z
        .string()
        .describe("Absolute or relative path to the directory to scan"),
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
        return text(
          `Scan failed: ${err instanceof Error ? err.message : String(err)}`,
          true,
        );
      }
    },
  );

  server.tool(
    "lint_files",
    "[scan] Scan specific files for hardcoded secrets. Optionally auto-fix by replacing them with process.env references and storing the values in q-ring.",
    {
      files: z.array(z.string()).describe("File paths to lint"),
      fix: z
        .boolean()
        .optional()
        .default(false)
        .describe("Auto-replace and store secrets"),
      scope,
      projectPath,
      teamId,
      orgId,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("lint_files", params.projectPath);
      if (toolBlock) return toolBlock;

      try {
        const results = lintFiles(params.files, {
          fix: params.fix,
          scope: params.scope as "global" | "project" | undefined,
          projectPath: params.projectPath,
        });
        if (results.length === 0) {
          return text("No hardcoded secrets found in the specified files.");
        }
        return text(JSON.stringify(results, null, 2));
      } catch (err) {
        return text(
          `Lint failed: ${err instanceof Error ? err.message : String(err)}`,
          true,
        );
      }
    },
  );

  server.tool(
    "analyze_secrets",
    "[agent] Analyze secret usage patterns and provide optimization suggestions including most accessed, stale, unused, and rotation recommendations.",
    {
      scope,
      projectPath,
      teamId,
      orgId,
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
        expired: entries.filter((e) => e.decay?.isExpired).length,
        stale: entries.filter((e) => e.decay?.isStale && !e.decay?.isExpired)
          .length,
        neverAccessed: entries
          .filter((e) => (e.envelope?.meta.accessCount ?? 0) === 0)
          .map((e) => e.key),
        noRotationFormat: entries
          .filter((e) => !e.envelope?.meta.rotationFormat)
          .map((e) => e.key),
        mostAccessed: [...accessMap.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([key, count]) => ({ key, reads: count })),
      };

      return text(JSON.stringify(analysis, null, 2));
    },
  );

  // One process-scoped instance; reusing across tool invocations avoids
  // leaking listeners when the MCP client pings `status_dashboard` twice.
  let dashboardInstance: { port: number; close: () => void } | null = null;

  server.tool(
    "status_dashboard",
    "[dashboard] Launch the quantum status dashboard — a local web page showing live health, decay timers, superposition states, entanglement graph, tunnels, audit log, and anomaly alerts. Returns the URL to open in a browser.",
    {
      port: z.number().optional().default(9876).describe("Port to serve on"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("status_dashboard");
      if (toolBlock) return toolBlock;

      if (dashboardInstance) {
        return text(
          `Dashboard already running at http://127.0.0.1:${dashboardInstance.port}`,
        );
      }

      const { startDashboardServer } = await import("../../core/dashboard.js");
      dashboardInstance = startDashboardServer({ port: params.port });

      return text(
        `Dashboard started at http://127.0.0.1:${dashboardInstance.port}\nOpen this URL in a browser to see live quantum status.`,
      );
    },
  );

  server.tool(
    "agent_scan",
    "[agent] Run an autonomous agent health scan: checks decay, staleness, anomalies, and optionally auto-rotates expired secrets. Returns a structured report.",
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
}
