/**
 * Codebase Secret Scanner
 *
 * Scans a directory for hardcoded secrets using regex heuristics
 * and Shannon entropy analysis. Useful for migrating legacy codebases
 * into q-ring.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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

// Matches common secret assignments: API_KEY = "sk-..." or { password: '...' }
const SECRET_KEYWORDS = /((?:api_?key|secret|token|password|auth|credential|access_?key)[a-z0-9_]*)\s*[:=]\s*(['"])([^'"]+)\2/i;

function calculateEntropy(str: string): number {
  if (!str) return 0;
  const len = str.length;
  const frequencies = new Map<string, number>();

  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

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
          // Read chunk to check if binary
          content = readFileSync(fullPath, "utf8");
        } catch {
          continue; // skip unreadable
        }

        // Quick heuristic: ignore files with null bytes
        if (content.includes("\0")) continue;

        const lines = content.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Skip long lines (minified code)
          if (line.length > 500) continue;

          const match = line.match(SECRET_KEYWORDS);
          if (match) {
            const varName = match[1];
            const value = match[3];

            // Ignore very short strings or obvious placeholders
            if (value.length < 8) continue;
            const lowerValue = value.toLowerCase();
            if (
              lowerValue.includes("example") ||
              lowerValue.includes("your_") ||
              lowerValue.includes("placeholder") ||
              lowerValue.includes("replace_me")
            ) {
              continue;
            }

            const entropy = calculateEntropy(value);

            // Flag if entropy is decently high (e.g. > 3.5) or looks like a known prefix
            if (entropy > 3.5 || value.startsWith("sk-") || value.startsWith("ghp_")) {
              // Convert absolute path to relative for cleaner output
              const relPath = fullPath.startsWith(dir)
                ? fullPath.slice(dir.length).replace(/^[/\\]+/, "")
                : fullPath;

              results.push({
                file: relPath || fullPath,
                line: i + 1,
                keyName: varName,
                match: value,
                context: line.trim(),
                entropy: parseFloat(entropy.toFixed(2)),
              });
            }
          }
        }
      }
    }
  }

  walk(dir);
  return results;
}
