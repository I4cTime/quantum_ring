import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { remember, recall, listMemory, forget } from "../../core/memory.js";
import { text, enforceToolPolicy } from "./_shared.js";

export function registerAgentTools(server: McpServer): void {
  server.tool(
    "agent_remember",
    "[agent] Store a key-value pair in encrypted agent memory that persists across sessions. Use this to remember decisions, rotation history, or project-specific context.",
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
    "[agent] Retrieve a value from agent memory, or list all stored keys if no key is provided.",
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
      if (value === null)
        return text(`No memory found for "${params.key}"`, true);
      return text(
        JSON.stringify({ ok: true, data: { key: params.key, value } }, null, 2),
      );
    },
  );

  server.tool(
    "agent_forget",
    "[agent] Delete a key from agent memory.",
    {
      key: z.string().describe("Memory key to forget"),
    },
    async (params) => {
      const toolBlock = enforceToolPolicy("agent_forget");
      if (toolBlock) return toolBlock;

      const removed = forget(params.key);
      return text(
        removed ? `Forgot "${params.key}"` : `No memory found for "${params.key}"`,
        !removed,
      );
    },
  );
}
