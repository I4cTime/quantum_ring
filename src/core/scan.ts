/**
 * Codebase Secret Scanner
 *
 * Scans a directory for hardcoded secrets using regex heuristics
 * and Shannon entropy analysis. Useful for migrating legacy codebases
 * into q-ring.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { findSecretsInLine, calculateEntropy } from "./secrets-detect.js";

export interface ScanResult {
  file: string;
  line: number;
  keyName: string;
  match: string;
  context: string;
  entropy: number;
}

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  ".cursor",
  "venv",
  "__pycache__",
]);

const IGNORE_EXTS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp",
  ".mp4", ".mp3", ".wav", ".ogg",
  ".pdf", ".zip", ".tar", ".gz", ".xz",
  ".ttf", ".woff", ".woff2", ".eot",
  ".exe", ".dll", ".so", ".dylib",
  ".lock",
]);

export function scanCodebase(dir: string): ScanResult[] {
  const results: ScanResult[] = [];

  function walk(currentDir: string) {
    let entries;
    try {
      entries = readdirSync(currentDir);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry)) continue;

      const fullPath = join(currentDir, entry);
      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile()) {
        const ext = fullPath.slice(fullPath.lastIndexOf(".")).toLowerCase();
        if (IGNORE_EXTS.has(ext) || entry.endsWith(".lock")) continue;

        let content;
        try {
          content = readFileSync(fullPath, "utf8");
        } catch {
          continue;
        }

        if (content.includes("\0")) continue;

        const lines = content.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const matches = findSecretsInLine(line);
          for (const m of matches) {
            const entropy = calculateEntropy(m.value);
            const relPath = fullPath.startsWith(dir)
              ? fullPath.slice(dir.length).replace(/^[/\\]+/, "")
              : fullPath;

            results.push({
              file: relPath || fullPath,
              line: i + 1,
              keyName: m.varName,
              match: m.value,
              context: line.trim(),
              entropy: parseFloat(entropy.toFixed(2)),
            });
          }
        }
      }
    }
  }

  walk(dir);
  return results;
}
