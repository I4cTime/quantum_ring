#!/usr/bin/env node
/**
 * Sync version from package.json into plugin + marketplace + SECURITY.md supported table.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const v = pkg.version;
if (!v) throw new Error("Missing package.json version");

const pluginJsonPath = join(root, "cursor-plugin", ".cursor-plugin", "plugin.json");
const pluginJson = JSON.parse(readFileSync(pluginJsonPath, "utf8"));
pluginJson.version = v;
writeFileSync(pluginJsonPath, JSON.stringify(pluginJson, null, 2) + "\n", "utf8");

const marketplacePath = join(root, ".cursor-plugin", "marketplace.json");
const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
if (marketplace.plugins?.[0]) {
  marketplace.plugins[0].version = v;
}
writeFileSync(marketplacePath, JSON.stringify(marketplace, null, 2) + "\n", "utf8");

const securityPath = join(root, "SECURITY.md");
let sec = readFileSync(securityPath, "utf8");
const parts = v.split(".");
const mm = `${parts[0]}.${parts[1]}`;
const table = `| Version | Supported |\n|---------|-----------|\n| ${mm}.x   | Yes       |\n| < ${mm}   | No        |\n`;
sec = sec.replace(
  /## Supported Versions\n\n(?:\|[^\n]+\n)+/,
  `## Supported Versions\n\n${table}`,
);
writeFileSync(securityPath, sec, "utf8");

console.log(`sync-versions: set ${v} in plugin.json, marketplace.json, SECURITY.md`);
