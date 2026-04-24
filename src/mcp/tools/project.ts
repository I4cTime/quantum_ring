import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSecret, getEnvelope } from "../../core/keyring.js";
import { checkDecay } from "../../core/envelope.js";
import { collapseEnvironment, readProjectConfig } from "../../core/collapse.js";
import { getProjectContext } from "../../core/context.js";
import { text, opts, enforceToolPolicy, commonSchemas } from "./_shared.js";

const { teamId, orgId, scope, projectPath, env } = commonSchemas;

export function registerProjectTools(server: McpServer): void {
  server.tool(
    "check_project",
    "[project] Validate project secrets against the .q-ring.json manifest. Returns which required secrets are present, missing, expired, or stale. Use this to verify project readiness.",
    {
      projectPath,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("check_project", params.projectPath);
      if (toolBlock) return toolBlock;

      const pp = params.projectPath ?? process.cwd();
      const config = readProjectConfig(pp);

      if (!config?.secrets || Object.keys(config.secrets).length === 0) {
        return text("No secrets manifest found in .q-ring.json", true);
      }

      const results: Record<string, unknown>[] = [];
      let presentCount = 0;
      let missingCount = 0;
      let expiredCount = 0;
      let staleCount = 0;

      for (const [key, manifest] of Object.entries(config.secrets)) {
        const result = getEnvelope(key, { projectPath: pp, source: "mcp" });

        if (!result) {
          const status = manifest.required !== false ? "missing" : "optional_missing";
          if (manifest.required !== false) missingCount++;
          results.push({
            key,
            status,
            required: manifest.required !== false,
            description: manifest.description,
          });
          continue;
        }

        const decay = checkDecay(result.envelope);

        if (decay.isExpired) {
          expiredCount++;
          results.push({
            key,
            status: "expired",
            timeRemaining: decay.timeRemaining,
            description: manifest.description,
          });
        } else if (decay.isStale) {
          staleCount++;
          results.push({
            key,
            status: "stale",
            lifetimePercent: decay.lifetimePercent,
            timeRemaining: decay.timeRemaining,
            description: manifest.description,
          });
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
    "[project] Generate .env file content from the project manifest (.q-ring.json). Resolves each declared secret from q-ring, collapses superposition, and returns .env formatted output. Warns about missing or expired secrets.",
    {
      projectPath,
      env,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("env_generate", params.projectPath);
      if (toolBlock) return toolBlock;

      const pp = params.projectPath ?? process.cwd();
      const config = readProjectConfig(pp);

      if (!config?.secrets || Object.keys(config.secrets).length === 0) {
        return text("No secrets manifest found in .q-ring.json", true);
      }

      const lines: string[] = [];
      const warnings: string[] = [];

      for (const [key, manifest] of Object.entries(config.secrets)) {
        const value = getSecret(key, {
          projectPath: pp,
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

        const result = getEnvelope(key, { projectPath: pp, source: "mcp" });
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
      const result =
        warnings.length > 0
          ? `${output}\n\n# Warnings:\n${warnings.map((w) => `# ${w}`).join("\n")}`
          : output;

      return text(result);
    },
  );

  server.tool(
    "detect_environment",
    "[project] Detect the current environment context (wavefunction collapse). Returns the detected environment and its source (NODE_ENV, git branch, project config, etc.).",
    {
      projectPath,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy(
        "detect_environment",
        params.projectPath,
      );
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
    "get_project_context",
    "[agent] Get a safe, redacted overview of the project's secrets, environment, manifest, providers, hooks, and recent audit activity. No secret values are ever exposed. Use this to understand what secrets exist before asking to read them.",
    {
      scope,
      projectPath,
      teamId,
      orgId,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy(
        "get_project_context",
        params.projectPath,
      );
      if (toolBlock) return toolBlock;

      const context = getProjectContext(opts(params));
      return text(JSON.stringify(context, null, 2));
    },
  );
}
