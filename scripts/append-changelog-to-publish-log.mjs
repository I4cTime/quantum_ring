#!/usr/bin/env node
/**
 * P7d: Append the first version section from CHANGELOG.md to docs/publishing-log.md (manual release note).
 */
import { readFileSync, appendFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
const firstBlock = changelog.split(/\n## /)[0]?.trim() ?? "";
const logPath = join(root, "docs", "publishing-log.md");
if (!existsSync(logPath)) process.exit(1);
const stamp = new Date().toISOString().slice(0, 10);
appendFileSync(
  logPath,
  `\n\n---\n\n## Changelog snapshot (${stamp})\n\n${firstBlock}\n`,
  "utf8",
);
console.log("Appended CHANGELOG lead section to docs/publishing-log.md");
