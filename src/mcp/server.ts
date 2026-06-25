import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PACKAGE_VERSION } from "../version.js";
import { registerMcpTools } from "./tool-registration.js";
import { setPolicyRoot } from "../core/policy.js";

export function createMcpServer(): McpServer {
  // Anchor governance policy to the directory the operator launched the server
  // in. Agents pass projectPath freely, so resolving policy from it would let a
  // malicious agent escape `.q-ring.json` restrictions by pointing elsewhere.
  setPolicyRoot(process.cwd());

  const server = new McpServer({
    name: "q-ring",
    version: PACKAGE_VERSION,
  });
  registerMcpTools(server);
  return server;
}
