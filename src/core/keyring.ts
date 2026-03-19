import { Entry, findCredentials } from "@napi-rs/keyring";
import {
  resolveScope,
  globalService,
  projectService,
  type Scope,
} from "./scope.js";
import {
  type QuantumEnvelope,
  type Environment,
  createEnvelope,
  parseEnvelope,
  wrapLegacy,
  serializeEnvelope,
  collapseValue,
  checkDecay,
  recordAccess,
  type DecayStatus,
  type EntanglementLink,
} from "./envelope.js";
import { collapseEnvironment, type CollapseContext } from "./collapse.js";
import { logAudit, type AuditAction } from "./observer.js";
import { findEntangled, entangle as entangleLink } from "./entanglement.js";

export interface SecretEntry {
  key: string;
  scope: Scope;
  value?: string;
  envelope?: QuantumEnvelope;
  decay?: DecayStatus;
}

export interface KeyringOptions {
  scope?: Scope;
  projectPath?: string;
  /** Environment for superposition collapse */
  env?: Environment;
  /** Audit source */
  source?: "cli" | "mcp" | "agent" | "api";
}

export interface SetSecretOptions extends KeyringOptions {
  /** Environment states for superposition */
  states?: Record<Environment, string>;
  /** Default environment */
  defaultEnv?: Environment;
  /** TTL in seconds (quantum decay) */
  ttlSeconds?: number;
  /** Expiry timestamp */
  expiresAt?: string;
  /** Description */
  description?: string;
  /** Tags */
  tags?: string[];
}

function readEnvelope(service: string, key: string): QuantumEnvelope | null {
  const entry = new Entry(service, key);
  const raw = entry.getPassword();
  if (raw === null) return null;

  const envelope = parseEnvelope(raw);
  return envelope ?? wrapLegacy(raw);
}

function writeEnvelope(
  service: string,
  key: string,
  envelope: QuantumEnvelope,
): void {
  const entry = new Entry(service, key);
  entry.setPassword(serializeEnvelope(envelope));
}

function resolveEnv(opts: KeyringOptions): Environment | undefined {
  if (opts.env) return opts.env;
  const result = collapseEnvironment({ projectPath: opts.projectPath });
  return result?.env;
}

/**
 * Retrieve a secret by key, with scope resolution and superposition collapse.
 * Records the access in the audit log (observer effect).
 */
export function getSecret(
  key: string,
  opts: KeyringOptions = {},
): string | null {
  const scopes = resolveScope(opts);
  const env = resolveEnv(opts);
  const source = opts.source ?? "cli";

  for (const { service, scope } of scopes) {
    const envelope = readEnvelope(service, key);
    if (!envelope) continue;

    // Check decay
    const decay = checkDecay(envelope);
    if (decay.isExpired) {
      logAudit({
        action: "read",
        key,
        scope,
        source,
        detail: "blocked: secret expired (quantum decay)",
      });
      continue;
    }

    // Collapse superposition
    const value = collapseValue(envelope, env);
    if (value === null) continue;

    // Observer effect: record access and persist
    const updated = recordAccess(envelope);
    writeEnvelope(service, key, updated);

    logAudit({ action: "read", key, scope, env, source });

    return value;
  }

  return null;
}

/**
 * Get the full envelope for a secret (for inspection, no value extraction).
 */
export function getEnvelope(
  key: string,
  opts: KeyringOptions = {},
): { envelope: QuantumEnvelope; scope: Scope } | null {
  const scopes = resolveScope(opts);

  for (const { service, scope } of scopes) {
    const envelope = readEnvelope(service, key);
    if (envelope) return { envelope, scope };
  }

  return null;
}

/**
 * Store a secret with quantum metadata.
 */
export function setSecret(
  key: string,
  value: string,
  opts: SetSecretOptions = {},
): void {
  const scope = opts.scope ?? "global";
  const scopes = resolveScope({ ...opts, scope });
  const { service } = scopes[0];
  const source = opts.source ?? "cli";

  // Check if there's an existing envelope to preserve metadata
  const existing = readEnvelope(service, key);

  let envelope: QuantumEnvelope;

  if (opts.states) {
    envelope = createEnvelope("", {
      states: opts.states,
      defaultEnv: opts.defaultEnv,
      description: opts.description,
      tags: opts.tags,
      ttlSeconds: opts.ttlSeconds,
      expiresAt: opts.expiresAt,
      entangled: existing?.meta.entangled,
    });
  } else {
    envelope = createEnvelope(value, {
      description: opts.description,
      tags: opts.tags,
      ttlSeconds: opts.ttlSeconds,
      expiresAt: opts.expiresAt,
      entangled: existing?.meta.entangled,
    });
  }

  // Preserve access count from existing
  if (existing) {
    envelope.meta.createdAt = existing.meta.createdAt;
    envelope.meta.accessCount = existing.meta.accessCount;
  }

  writeEnvelope(service, key, envelope);
  logAudit({ action: "write", key, scope, source });

  // Propagate to entangled secrets
  const entangled = findEntangled({ service, key });
  for (const target of entangled) {
    try {
      const targetEnvelope = readEnvelope(target.service, target.key);
      if (targetEnvelope) {
        if (opts.states) {
          targetEnvelope.states = opts.states;
        } else {
          targetEnvelope.value = value;
        }
        targetEnvelope.meta.updatedAt = new Date().toISOString();
        writeEnvelope(target.service, target.key, targetEnvelope);
        logAudit({
          action: "entangle",
          key: target.key,
          scope: "global",
          source,
          detail: `propagated from ${key}`,
        });
      }
    } catch {
      // entangled target may not exist
    }
  }
}

/**
 * Delete a secret from the specified scope (or both if unscoped).
 */
export function deleteSecret(
  key: string,
  opts: KeyringOptions = {},
): boolean {
  const scopes = resolveScope(opts);
  const source = opts.source ?? "cli";
  let deleted = false;

  for (const { service, scope } of scopes) {
    const entry = new Entry(service, key);
    try {
      if (entry.deleteCredential()) {
        deleted = true;
        logAudit({ action: "delete", key, scope, source });
      }
    } catch {
      // not found
    }
  }

  return deleted;
}

/**
 * Check whether a secret exists in any applicable scope.
 */
export function hasSecret(
  key: string,
  opts: KeyringOptions = {},
): boolean {
  const scopes = resolveScope(opts);

  for (const { service } of scopes) {
    const envelope = readEnvelope(service, key);
    if (envelope) {
      const decay = checkDecay(envelope);
      if (!decay.isExpired) return true;
    }
  }

  return false;
}

/**
 * List all secrets across applicable scopes with quantum metadata.
 */
export function listSecrets(opts: KeyringOptions = {}): SecretEntry[] {
  const source = opts.source ?? "cli";
  const services: { service: string; scope: Scope }[] = [];

  if (!opts.scope || opts.scope === "global") {
    services.push({ service: globalService(), scope: "global" });
  }

  if ((!opts.scope || opts.scope === "project") && opts.projectPath) {
    services.push({
      service: projectService(opts.projectPath),
      scope: "project",
    });
  }

  const results: SecretEntry[] = [];
  const seen = new Set<string>();

  for (const { service, scope } of services) {
    try {
      const credentials = findCredentials(service);
      for (const cred of credentials) {
        const id = `${scope}:${cred.account}`;
        if (seen.has(id)) continue;
        seen.add(id);

        const envelope = parseEnvelope(cred.password) ?? wrapLegacy(cred.password);
        const decay = checkDecay(envelope);

        results.push({
          key: cred.account,
          scope,
          envelope,
          decay,
        });
      }
    } catch {
      // keyring unavailable
    }
  }

  logAudit({ action: "list", source });

  return results.sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Export all secrets with their values (for .env or JSON export).
 * Collapses superposition based on detected environment.
 */
export function exportSecrets(
  opts: KeyringOptions & { format?: "env" | "json" } = {},
): string {
  const format = opts.format ?? "env";
  const env = resolveEnv(opts);
  const entries = listSecrets(opts);
  const source = opts.source ?? "cli";

  const merged = new Map<string, string>();

  const globalEntries = entries.filter((e) => e.scope === "global");
  const projectEntries = entries.filter((e) => e.scope === "project");

  for (const entry of [...globalEntries, ...projectEntries]) {
    if (entry.envelope) {
      const decay = checkDecay(entry.envelope);
      if (decay.isExpired) continue;

      const value = collapseValue(entry.envelope, env);
      if (value !== null) {
        merged.set(entry.key, value);
      }
    }
  }

  logAudit({ action: "export", source, detail: `format=${format}` });

  if (format === "json") {
    const obj: Record<string, string> = {};
    for (const [key, value] of merged) {
      obj[key] = value;
    }
    return JSON.stringify(obj, null, 2);
  }

  const lines: string[] = [];
  for (const [key, value] of merged) {
    const escaped = value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n");
    lines.push(`${key}="${escaped}"`);
  }
  return lines.join("\n");
}

/**
 * Create an entanglement between two secrets.
 */
export function entangleSecrets(
  sourceKey: string,
  sourceOpts: KeyringOptions,
  targetKey: string,
  targetOpts: KeyringOptions,
): void {
  const sourceScopes = resolveScope({ ...sourceOpts, scope: sourceOpts.scope ?? "global" });
  const targetScopes = resolveScope({ ...targetOpts, scope: targetOpts.scope ?? "global" });

  const source = { service: sourceScopes[0].service, key: sourceKey };
  const target = { service: targetScopes[0].service, key: targetKey };

  entangleLink(source, target);
  logAudit({
    action: "entangle",
    key: sourceKey,
    source: sourceOpts.source ?? "cli",
    detail: `entangled with ${targetKey}`,
  });
}
