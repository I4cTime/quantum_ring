import type { Scope } from "../core/scope.js";
import type { KeyringOptions } from "../core/keyring.js";

export function buildOpts(cmd: {
  global?: boolean;
  project?: boolean;
  team?: string;
  org?: string;
  projectPath?: string;
  env?: string;
}): KeyringOptions {
  let scope: Scope | undefined;
  if (cmd.global) scope = "global";
  else if (cmd.project) scope = "project";
  else if (cmd.team) scope = "team";
  else if (cmd.org) scope = "org";

  const projectPath =
    cmd.projectPath ?? (cmd.project ? process.cwd() : undefined);

  if (scope === "project" && !projectPath) {
    throw new Error("Project path is required for project scope");
  }

  return {
    scope,
    projectPath: projectPath ?? process.cwd(),
    teamId: cmd.team,
    orgId: cmd.org,
    env: cmd.env,
    source: "cli",
  };
}
