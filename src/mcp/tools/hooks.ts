import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  registerHook,
  removeHook,
  listHooks as listAllHooks,
  type HookType,
  type HookAction,
} from "../../core/hooks.js";
import { text, enforceToolPolicy } from "./_shared.js";

export function registerHookTools(server: McpServer): void {
  server.tool(
    "register_hook",
    "[hooks] Register a webhook/callback that fires when a secret is updated, deleted, or rotated. Supports shell commands, HTTP webhooks, and process signals.",
    {
      type: z.enum(["shell", "http", "signal"]).describe("Hook type"),
      key: z.string().optional().describe("Trigger on exact key match"),
      keyPattern: z
        .string()
        .optional()
        .describe("Trigger on key glob pattern (e.g. DB_*)"),
      tag: z.string().optional().describe("Trigger on secrets with this tag"),
      scope: z
        .enum(["global", "project"])
        .optional()
        .describe("Trigger only for this scope"),
      actions: z
        .array(z.enum(["write", "delete", "rotate"]))
        .optional()
        .default(["write", "delete", "rotate"])
        .describe("Which actions trigger this hook"),
      command: z
        .string()
        .optional()
        .describe("Shell command to execute (for shell type)"),
      url: z.string().optional().describe("URL to POST to (for http type)"),
      signalTarget: z
        .string()
        .optional()
        .describe("Process name or PID (for signal type)"),
      signalName: z
        .string()
        .optional()
        .default("SIGHUP")
        .describe("Signal to send (for signal type)"),
      description: z.string().optional().describe("Human-readable description"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("register_hook");
      if (toolBlock) return toolBlock;

      if (!params.key && !params.keyPattern && !params.tag) {
        return text(
          "At least one match criterion required: key, keyPattern, or tag",
          true,
        );
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
        signal: params.signalTarget
          ? { target: params.signalTarget, signal: params.signalName }
          : undefined,
        description: params.description,
        enabled: true,
      });

      return text(JSON.stringify(entry, null, 2));
    },
  );

  server.tool(
    "list_hooks",
    "[hooks] List all registered secret change hooks with their match criteria, type, and status.",
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
    "[hooks] Remove a registered hook by ID.",
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
}
