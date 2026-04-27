#!/usr/bin/env node
/**
 * Copy `kiro-plugin/` into a Kiro `.kiro/` config tree.
 *
 * Default destination: `~/.kiro` (user-level — applies to every Kiro project).
 * Pass an explicit destination as the first arg to install at project scope:
 *
 *   node scripts/plugin-sync-kiro.mjs /path/to/your/project/.kiro
 *
 * The destination is treated as a `.kiro` directory: this script copies
 *   kiro-plugin/mcp.json (Power root) -> $DEST/settings/mcp.json (safe — see below)
 *   kiro-plugin/steering/*            -> $DEST/steering/  (namespaced files)
 *   kiro-plugin/hooks/*              -> $DEST/hooks/     (namespaced files)
 *
 * Steering and hook files are namespaced (`qring-*`) so they do not collide
 * with user files. They are always overwritten.
 *
 * `settings/mcp.json` at the destination may already be customized by the user with other MCP
 * servers. By default, when that file already exists at the destination, this
 * script writes `mcp.json.qring-template` next to it and leaves the original
 * alone. Pass `--force` to overwrite anyway.
 */
import {
  cpSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  copyFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "kiro-plugin");

const args = process.argv.slice(2);
const force = args.includes("--force");
const positional = args.filter((a) => !a.startsWith("--"));
const dest = positional[0] ?? join(homedir(), ".kiro");

if (!existsSync(src)) {
  console.error(`plugin-sync-kiro: missing source directory ${src}`);
  process.exit(1);
}

let copiedFiles = 0;
const skipped = [];

const writeOrTemplate = (from, to) => {
  if (existsSync(to) && !force) {
    const tpl = `${to}.qring-template`;
    copyFileSync(from, tpl);
    skipped.push({ to, tpl });
    copiedFiles += 1;
    return;
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  copiedFiles += 1;
};

const mcpSrc = join(src, "mcp.json");
if (existsSync(mcpSrc)) {
  writeOrTemplate(mcpSrc, join(dest, "settings", "mcp.json"));
}

for (const sub of ["steering", "hooks"]) {
  const srcDir = join(src, sub);
  if (!existsSync(srcDir) || !statSync(srcDir).isDirectory()) continue;
  const destDir = join(dest, sub);
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir)) {
    if (entry.startsWith(".")) continue;
    const from = join(srcDir, entry);
    const to = join(destDir, entry);
    cpSync(from, to, { recursive: true });
    copiedFiles += 1;
  }
}

console.log(
  `plugin-sync-kiro: copied ${copiedFiles} entr${copiedFiles === 1 ? "y" : "ies"} from ${src} -> ${dest}`,
);

if (skipped.length > 0) {
  console.log("");
  console.log(
    "The following files already existed and were NOT overwritten. Saved a side-by-side template instead — review and merge by hand, or rerun with --force to overwrite:",
  );
  for (const { to, tpl } of skipped) {
    console.log(`  ${to}`);
    console.log(`    -> template: ${tpl}`);
  }
}

console.log("");
console.log(
  "Reload Kiro's MCP servers from the MCP Servers panel to pick up the new q-ring config.",
);
