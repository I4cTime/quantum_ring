import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: "esm",
    target: "node18",
    platform: "node",
    banner: { js: "#!/usr/bin/env node" },
    clean: true,
    sourcemap: true,
  },
  {
    entry: { mcp: "src/mcp.ts" },
    format: "esm",
    target: "node18",
    platform: "node",
    sourcemap: true,
  },
]);
