/**
 * Quantum Envelope: the storage format for all q-ring secrets.
 *
 * Instead of storing raw strings, every secret is wrapped in an envelope
 * that carries quantum metadata: environment states (superposition),
 * TTL/expiry (decay), entanglement links, and access tracking (observer).
 */

export type Environment = string; // "dev" | "staging" | "prod" | custom

export interface EntanglementLink {
  /** Service name of the entangled scope */
  service: string;
  /** Key name in the entangled scope */
  key: string;
}

export interface SecretMetadata {
  createdAt: string;
  updatedAt: string;
  /** ISO timestamp when this secret expires (quantum decay) */
  expiresAt?: string;
  /** TTL in seconds from creation/update */
  ttlSeconds?: number;
  /** Human-readable description */
  description?: string;
  /** Tags for organization */
  tags?: string[];
  /** Entanglement links to other secrets */
  entangled?: EntanglementLink[];
  /** Total number of times this secret has been read */
  accessCount: number;
  /** ISO timestamp of last read */
  lastAccessedAt?: string;
  /** Whether this secret is ephemeral (tunneling - not persisted to keyring) */
  ephemeral?: boolean;
}

export interface QuantumEnvelope {
  /** Schema version for forward compatibility */
  v: 1;
  /** Simple value (when not in superposition) */
  value?: string;
  /** Superposition: environment-keyed values */
  states?: Record<Environment, string>;
  /** Default environment to collapse to when no context is available */
  defaultEnv?: Environment;
  /** Quantum metadata */
  meta: SecretMetadata;
}

export function createEnvelope(
  value: string,
  opts?: Partial<Pick<QuantumEnvelope, "states" | "defaultEnv">> & {
    description?: string;
    tags?: string[];
    ttlSeconds?: number;
    expiresAt?: string;
    entangled?: EntanglementLink[];
  },
): QuantumEnvelope {
  const now = new Date().toISOString();

  let expiresAt = opts?.expiresAt;
  if (!expiresAt && opts?.ttlSeconds) {
    expiresAt = new Date(Date.now() + opts.ttlSeconds * 1000).toISOString();
  }

  return {
    v: 1,
    value: opts?.states ? undefined : value,
    states: opts?.states,
    defaultEnv: opts?.defaultEnv,
    meta: {
      createdAt: now,
      updatedAt: now,
      expiresAt,
      ttlSeconds: opts?.ttlSeconds,
      description: opts?.description,
      tags: opts?.tags,
      entangled: opts?.entangled,
      accessCount: 0,
    },
  };
}

export function parseEnvelope(raw: string): QuantumEnvelope | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.v === 1) {
      return parsed as QuantumEnvelope;
    }
  } catch {
    // Not a quantum envelope - legacy raw string
  }
  return null;
}

/**
 * Wrap a legacy raw string value into a quantum envelope.
 * Used for backward compatibility with secrets stored before the envelope format.
 */
export function wrapLegacy(rawValue: string): QuantumEnvelope {
  const now = new Date().toISOString();
  return {
    v: 1,
    value: rawValue,
    meta: {
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
    },
  };
}

export function serializeEnvelope(envelope: QuantumEnvelope): string {
  return JSON.stringify(envelope);
}

/**
 * Resolve the concrete value from a quantum envelope.
 * If in superposition, collapses based on the provided environment.
 */
export function collapseValue(
  envelope: QuantumEnvelope,
  env?: Environment,
): string | null {
  if (envelope.states) {
    const targetEnv = env ?? envelope.defaultEnv;
    if (targetEnv && envelope.states[targetEnv]) {
      return envelope.states[targetEnv];
    }
    // If no env match, try default, then return null
    if (envelope.defaultEnv && envelope.states[envelope.defaultEnv]) {
      return envelope.states[envelope.defaultEnv];
    }
    // Last resort: return the first state
    const keys = Object.keys(envelope.states);
    if (keys.length > 0) {
      return envelope.states[keys[0]];
    }
    return null;
  }

  return envelope.value ?? null;
}

export interface DecayStatus {
  isExpired: boolean;
  isStale: boolean;
  /** Percentage of lifetime elapsed (0-100+) */
  lifetimePercent: number;
  /** Seconds remaining until expiry, or negative if expired */
  secondsRemaining: number | null;
  /** Human-readable time remaining */
  timeRemaining: string | null;
}

export function checkDecay(envelope: QuantumEnvelope): DecayStatus {
  if (!envelope.meta.expiresAt) {
    return {
      isExpired: false,
      isStale: false,
      lifetimePercent: 0,
      secondsRemaining: null,
      timeRemaining: null,
    };
  }

  const now = Date.now();
  const expires = new Date(envelope.meta.expiresAt).getTime();
  const created = new Date(envelope.meta.createdAt).getTime();
  const totalLifetime = expires - created;
  const elapsed = now - created;
  const remaining = expires - now;

  const lifetimePercent =
    totalLifetime > 0 ? Math.round((elapsed / totalLifetime) * 100) : 100;

  const secondsRemaining = Math.floor(remaining / 1000);

  let timeRemaining: string | null = null;
  if (remaining > 0) {
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);

    if (days > 0) timeRemaining = `${days}d ${hours}h`;
    else if (hours > 0) timeRemaining = `${hours}h ${minutes}m`;
    else timeRemaining = `${minutes}m`;
  } else {
    timeRemaining = "expired";
  }

  return {
    isExpired: remaining <= 0,
    isStale: lifetimePercent >= 75,
    lifetimePercent,
    secondsRemaining,
    timeRemaining,
  };
}

/**
 * Record an access event on the envelope (observer effect).
 * Returns a new envelope with updated access metadata.
 */
export function recordAccess(envelope: QuantumEnvelope): QuantumEnvelope {
  return {
    ...envelope,
    meta: {
      ...envelope.meta,
      accessCount: envelope.meta.accessCount + 1,
      lastAccessedAt: new Date().toISOString(),
    },
  };
}
