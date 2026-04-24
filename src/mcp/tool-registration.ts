import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSecretTools } from "./tools/secrets.js";
import { registerProjectTools } from "./tools/project.js";
import { registerTunnelTools } from "./tools/tunnel.js";
import { registerTeleportTools } from "./tools/teleport.js";
import { registerAuditTools } from "./tools/audit.js";
import { registerValidationTools } from "./tools/validation.js";
import { registerHookTools } from "./tools/hooks.js";
import { registerToolingTools } from "./tools/tooling.js";
import { registerAgentTools } from "./tools/agent.js";
import { registerPolicyTools } from "./tools/policy.js";

/**
 * Register every MCP tool on the given server.
 *
 * Tools are grouped by concern in `src/mcp/tools/*.ts`. Keep the registration
 * order stable — some MCP clients cache the tool list ordering.
 */
export function registerMcpTools(server: McpServer): void {
  registerSecretTools(server);
  registerProjectTools(server);
  registerTunnelTools(server);
  registerTeleportTools(server);
  registerAuditTools(server);
  registerValidationTools(server);
  registerHookTools(server);
  registerToolingTools(server);
  registerAgentTools(server);
  registerPolicyTools(server);
}
