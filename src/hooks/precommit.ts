/**
 * Git Pre-Commit Hook for Secret Scanning
 *
 * Scans staged files for hardcoded secrets using the q-ring scanner.
 * If any are found, blocks the commit and reports locations.
 *
 * Install via: qring hook:install
 * Runs via: .git/hooks/pre-commit
 */

import { execSync } from "node:child_process";
import { existsSync, writeFileSync, chmodSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { lintFiles } from "../core/linter.js";

/**
 * Get the list of staged files from git.
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return output
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  } catch {
    return [];
  }
}

/**
 * Run the pre-commit scan on staged files.
 * Returns exit code 0 (clean) or 1 (secrets found).
 */
export function runPreCommitScan(): number {
  const staged = getStagedFiles();
  if (staged.length === 0) return 0;

  const results = lintFiles(staged);

  if (results.length === 0) return 0;

  console.error("\n[q-ring] Pre-commit scan found hardcoded secrets:\n");
  for (const r of results) {
    console.error(`  ${r.file}:${r.line}  ${r.keyName}  (entropy: ${r.entropy})`);
  }
  console.error(
    `\n[q-ring] Commit blocked. Use "qring scan --fix" to auto-migrate, or "git commit --no-verify" to bypass.\n`,
  );

  return 1;
}

const HOOK_SCRIPT = `#!/bin/sh
# q-ring pre-commit hook — scans staged files for hardcoded secrets
npx qring hook:run 2>&1
exit $?
`;

/**
 * Install the pre-commit hook into the repository's .git/hooks directory.
 */
export function installPreCommitHook(repoPath?: string): { installed: boolean; path: string; message: string } {
  const root = repoPath ?? process.cwd();
  const hooksDir = join(root, ".git", "hooks");

  if (!existsSync(join(root, ".git"))) {
    return { installed: false, path: "", message: "Not a git repository" };
  }

  const hookPath = join(hooksDir, "pre-commit");

  if (existsSync(hookPath)) {
    const existing = readFileSync(hookPath, "utf8");
    if (existing.includes("q-ring")) {
      return { installed: true, path: hookPath, message: "Hook already installed" };
    }
    // Prepend to existing hook
    writeFileSync(hookPath, HOOK_SCRIPT + "\n" + existing, "utf8");
  } else {
    writeFileSync(hookPath, HOOK_SCRIPT, "utf8");
  }

  chmodSync(hookPath, 0o755);
  return { installed: true, path: hookPath, message: "Pre-commit hook installed" };
}

/**
 * Uninstall the pre-commit hook.
 */
export function uninstallPreCommitHook(repoPath?: string): boolean {
  const root = repoPath ?? process.cwd();
  const hookPath = join(root, ".git", "hooks", "pre-commit");

  if (!existsSync(hookPath)) return false;

  const content = readFileSync(hookPath, "utf8");
  if (!content.includes("q-ring")) return false;

  // Remove q-ring lines
  const lines = content.split("\n");
  const cleaned = lines.filter(
    (l) => !l.includes("q-ring") && !l.includes("npx qring hook:run"),
  );

  if (cleaned.filter((l) => l.trim() && !l.startsWith("#!")).length === 0) {
    // Nothing left, delete the file
    unlinkSync(hookPath);
  } else {
    writeFileSync(hookPath, cleaned.join("\n"), "utf8");
  }

  return true;
}
