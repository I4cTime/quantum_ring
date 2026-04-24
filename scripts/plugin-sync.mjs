#!/usr/bin/env node
/**
 * Copy `cursor-plugin/` into the local Cursor plugins folder (default: ~/.cursor/plugins/local/my-plugin).
 * Usage: node scripts/plugin-sync.mjs [destDir]
 */
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "cursor-plugin");
const dest =
  process.argv[2] ?? join(homedir(), ".cursor", "plugins", "local", "my-plugin");

if (!existsSync(src)) {
  console.error("Missing cursor-plugin directory");
  process.exit(1);
}
mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`plugin-sync: copied ${src} -> ${dest}`);
