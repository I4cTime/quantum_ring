/**
 * Wavefunction Collapse: auto-detect the current environment context.
 *
 * Resolution order (first match wins):
 * 1. Explicit --env flag
 * 2. QRING_ENV environment variable
 * 3. NODE_ENV environment variable
 * 4. Git branch heuristics (main/master → prod, develop → dev, staging → staging)
 * 5. .q-ring.json project config
 * 6. Default environment from the envelope
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Environment } from "./envelope.js";

const BRANCH_ENV_MAP: Record<string, Environment> = {
  main: "prod",
  master: "prod",
  production: "prod",
  develop: "dev",
  development: "dev",
  dev: "dev",
  staging: "staging",
  stage: "staging",
  test: "test",
  testing: "test",
};

function detectGitBranch(cwd?: string): string | null {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: cwd ?? process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      encoding: "utf8",
      timeout: 3000,
    }).trim();
    return branch || null;
  } catch {
    return null;
  }
}

export interface ProjectConfig {
  env?: Environment;
  defaultEnv?: Environment;
  branchMap?: Record<string, Environment>;
}

function readProjectConfig(projectPath?: string): ProjectConfig | null {
  const configPath = join(projectPath ?? process.cwd(), ".q-ring.json");
  try {
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, "utf8"));
    }
  } catch {
    // invalid config
  }
  return null;
}

export interface CollapseContext {
  /** Explicitly provided environment */
  explicit?: Environment;
  /** Project path for git/config detection */
  projectPath?: string;
}

export interface CollapseResult {
  env: Environment;
  source:
    | "explicit"
    | "QRING_ENV"
    | "NODE_ENV"
    | "git-branch"
    | "project-config"
    | "default";
}

export function collapseEnvironment(
  ctx: CollapseContext = {},
): CollapseResult | null {
  if (ctx.explicit) {
    return { env: ctx.explicit, source: "explicit" };
  }

  const qringEnv = process.env.QRING_ENV;
  if (qringEnv) {
    return { env: qringEnv, source: "QRING_ENV" };
  }

  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv) {
    const mapped = mapEnvName(nodeEnv);
    return { env: mapped, source: "NODE_ENV" };
  }

  const config = readProjectConfig(ctx.projectPath);
  if (config?.env) {
    return { env: config.env, source: "project-config" };
  }

  const branch = detectGitBranch(ctx.projectPath);
  if (branch) {
    const branchMap = { ...BRANCH_ENV_MAP, ...config?.branchMap };
    const mapped = branchMap[branch];
    if (mapped) {
      return { env: mapped, source: "git-branch" };
    }
  }

  if (config?.defaultEnv) {
    return { env: config.defaultEnv, source: "project-config" };
  }

  return null;
}

function mapEnvName(raw: string): Environment {
  const lower = raw.toLowerCase();
  if (lower === "production") return "prod";
  if (lower === "development") return "dev";
  return lower;
}
