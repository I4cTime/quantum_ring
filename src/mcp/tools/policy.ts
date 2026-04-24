import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  checkToolPolicy,
  checkKeyReadPolicy,
  checkExecPolicy,
  getPolicySummary,
} from "../../core/policy.js";
import { text, enforceToolPolicy, commonSchemas } from "./_shared.js";

const { projectPath } = commonSchemas;

export function registerPolicyTools(server: McpServer): void {
  server.tool(
    "check_policy",
    "[policy] Check if an action is allowed by the project's governance policy. Returns the policy decision and source.",
    {
      action: z
        .enum(["tool", "key_read", "exec"])
        .describe("Type of policy check"),
      toolName: z
        .string()
        .optional()
        .describe("Tool name to check (for action=tool)"),
      key: z.string().optional().describe("Secret key to check (for action=key_read)"),
      command: z
        .string()
        .optional()
        .describe("Command to check (for action=exec)"),
      projectPath,
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
      return text(
        "Missing required parameter for the selected action type",
        true,
      );
    },
  );

  server.tool(
    "get_policy_summary",
    "[policy] Get a summary of the project's governance policy configuration.",
    {
      projectPath,
    },
    async (params) => {
      const toolBlock = enforceToolPolicy(
        "get_policy_summary",
        params.projectPath,
      );
      if (toolBlock) return toolBlock;
      const summary = getPolicySummary(params.projectPath);
      return text(JSON.stringify(summary, null, 2));
    },
  );
}
