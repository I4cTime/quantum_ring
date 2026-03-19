import { hashProjectPath } from "../utils/hash.js";

const SERVICE_PREFIX = "q-ring";

export type Scope = "global" | "project";

export interface ResolvedScope {
  scope: Scope;
  service: string;
  projectPath?: string;
}

export function globalService(): string {
  return `${SERVICE_PREFIX}:global`;
}

export function projectService(projectPath: string): string {
  const hash = hashProjectPath(projectPath);
  return `${SERVICE_PREFIX}:project:${hash}`;
}

export function resolveScope(opts: {
  scope?: Scope;
  projectPath?: string;
}): ResolvedScope[] {
  const { scope, projectPath } = opts;

  if (scope === "global") {
    return [{ scope: "global", service: globalService() }];
  }

  if (scope === "project") {
    if (!projectPath) {
      throw new Error("Project path is required for project scope");
    }
    return [
      { scope: "project", service: projectService(projectPath), projectPath },
    ];
  }

  // No explicit scope: return project-first for resolution (project overrides global)
  if (projectPath) {
    return [
      { scope: "project", service: projectService(projectPath), projectPath },
      { scope: "global", service: globalService() },
    ];
  }

  return [{ scope: "global", service: globalService() }];
}

export function parseServiceName(service: string): ResolvedScope {
  if (service === globalService()) {
    return { scope: "global", service };
  }

  if (service.startsWith(`${SERVICE_PREFIX}:project:`)) {
    return { scope: "project", service };
  }

  return { scope: "global", service };
}
