/**
 * Secret-Aware Linter
 *
 * Scans individual files (or staged git content) for hardcoded secrets and
 * optionally rewrites them with `process.env.KEY` references, storing the
 * discovered values in q-ring.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { basename, extname } from "node:path";
import { scanCodebase, type ScanResult } from "./scan.js";
import { setSecret, hasSecret } from "./keyring.js";

export interface LintResult extends ScanResult {
  fixed: boolean;
}

export interface LintOptions {
  fix?: boolean;
  scope?: import("./scope.js").Scope;
  projectPath?: string;
}

const ENV_REF_BY_EXT: Record<string, (key: string) => string> = {
  ".ts": (k) => `process.env.${k}`,
  ".tsx": (k) => `process.env.${k}`,
  ".js": (k) => `process.env.${k}`,
  ".jsx": (k) => `process.env.${k}`,
  ".mjs": (k) => `process.env.${k}`,
  ".cjs": (k) => `process.env.${k}`,
  ".py": (k) => `os.environ["${k}"]`,
  ".rb": (k) => `ENV["${k}"]`,
  ".go": (k) => `os.Getenv("${k}")`,
  ".rs": (k) => `std::env::var("${k}")`,
  ".java": (k) => `System.getenv("${k}")`,
  ".kt": (k) => `System.getenv("${k}")`,
  ".cs": (k) => `Environment.GetEnvironmentVariable("${k}")`,
  ".php": (k) => `getenv('${k}')`,
  ".sh": (k) => `\${${k}}`,
  ".bash": (k) => `\${${k}}`,
};

function getEnvRef(filePath: string, keyName: string): string {
  const ext = extname(filePath).toLowerCase();
  const formatter = ENV_REF_BY_EXT[ext];
  return formatter ? formatter(keyName) : `process.env.${keyName}`;
}

/**
 * Lint specific files for hardcoded secrets.
 */
export function lintFiles(
  files: string[],
  opts: LintOptions = {},
): LintResult[] {
  const results: LintResult[] = [];

  for (const file of files) {
    if (!existsSync(file)) continue;

    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }

    if (content.includes("\0")) continue;

    const SECRET_KEYWORDS =
      /((?:api_?key|secret|token|password|auth|credential|access_?key)[a-z0-9_]*)\s*[:=]\s*(['"])([^'"]+)\2/gi;

    const lines = content.split(/\r?\n/);
    const fixes: Array<{ line: number; original: string; replacement: string; keyName: string; value: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length > 500) continue;

      let match: RegExpExecArray | null;
      SECRET_KEYWORDS.lastIndex = 0;

      while ((match = SECRET_KEYWORDS.exec(line)) !== null) {
        const varName = match[1].toUpperCase();
        const quote = match[2];
        const value = match[3];

        if (value.length < 8) continue;
        const lv = value.toLowerCase();
        if (
          lv.includes("example") ||
          lv.includes("your_") ||
          lv.includes("placeholder") ||
          lv.includes("replace_me") ||
          lv.includes("xxx")
        ) continue;

        const entropy = calculateEntropy(value);
        if (entropy <= 3.5 && !value.startsWith("sk-") && !value.startsWith("ghp_")) continue;

        const shouldFix = opts.fix === true;

        if (shouldFix) {
          const envRef = getEnvRef(file, varName);
          fixes.push({
            line: i,
            original: `${quote}${value}${quote}`,
            replacement: envRef,
            keyName: varName,
            value,
          });
        }

        results.push({
          file,
          line: i + 1,
          keyName: varName,
          match: value,
          context: line.trim(),
          entropy: parseFloat(entropy.toFixed(2)),
          fixed: shouldFix,
        });
      }
    }

    if (opts.fix && fixes.length > 0) {
      let newContent = content;
      // Apply fixes in reverse order to preserve line positions
      for (const fix of fixes.reverse()) {
        newContent = newContent.replace(fix.original, fix.replacement);

        if (!hasSecret(fix.keyName, { scope: opts.scope, projectPath: opts.projectPath })) {
          setSecret(fix.keyName, fix.value, {
            scope: opts.scope ?? "global",
            projectPath: opts.projectPath,
            source: "cli",
            description: `Auto-imported from ${basename(file)}:${fix.line + 1}`,
          });
        }
      }

      writeFileSync(file, newContent, "utf8");
    }
  }

  return results;
}

function calculateEntropy(str: string): number {
  if (!str) return 0;
  const len = str.length;
  const frequencies = new Map<string, number>();
  for (let i = 0; i < len; i++) {
    const ch = str[i];
    frequencies.set(ch, (frequencies.get(ch) || 0) + 1);
  }
  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}
