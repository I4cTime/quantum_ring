/**
 * Import module: parse .env files and bulk-store secrets into q-ring.
 */

import { readFileSync } from "node:fs";
import { setSecret, hasSecret, type SetSecretOptions } from "./keyring.js";

export interface ImportOptions {
  scope?: "global" | "project";
  projectPath?: string;
  env?: string;
  source?: "cli" | "mcp" | "agent" | "api";
  skipExisting?: boolean;
  dryRun?: boolean;
}

export interface ImportResult {
  imported: string[];
  skipped: string[];
  total: number;
}

/**
 * Parse .env content into key-value pairs.
 * Handles comments, blank lines, quoted values, and basic multiline.
 */
export function parseDotenv(content: string): Map<string, string> {
  const result = new Map<string, string>();
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line || line.startsWith("#")) continue;

    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;

    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    const escapeMap: Record<string, string> = {
      n: "\n", r: "\r", t: "\t", "\\": "\\", '"': '"',
    };
    value = value.replace(/\\([nrt"\\])/g, (_, ch) => escapeMap[ch] ?? ch);

    if (value.includes("#") && !line.includes('"') && !line.includes("'")) {
      value = value.split("#")[0].trim();
    }

    if (key) result.set(key, value);
  }

  return result;
}

/**
 * Import secrets from a .env file path or raw content string.
 */
export function importDotenv(
  filePathOrContent: string,
  options: ImportOptions = {},
): ImportResult {
  let content: string;

  try {
    content = readFileSync(filePathOrContent, "utf8");
  } catch {
    content = filePathOrContent;
  }

  const pairs = parseDotenv(content);
  const result: ImportResult = {
    imported: [],
    skipped: [],
    total: pairs.size,
  };

  for (const [key, value] of pairs) {
    if (options.skipExisting && hasSecret(key, {
      scope: options.scope,
      projectPath: options.projectPath,
      source: options.source ?? "cli",
    })) {
      result.skipped.push(key);
      continue;
    }

    if (options.dryRun) {
      result.imported.push(key);
      continue;
    }

    const setOpts: SetSecretOptions = {
      scope: options.scope ?? "global",
      projectPath: options.projectPath ?? process.cwd(),
      source: options.source ?? "cli",
    };

    setSecret(key, value, setOpts);
    result.imported.push(key);
  }

  return result;
}
