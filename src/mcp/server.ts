import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PACKAGE_VERSION } from "../version.js";
import { registerMcpTools } from "./tool-registration.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "q-ring",
    version: PACKAGE_VERSION,
  });
  registerMcpTools(server);
  return server;
}
