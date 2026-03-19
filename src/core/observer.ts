/**
 * Observer Effect: every secret read/write/delete is logged.
 * Audit trail stored at ~/.config/q-ring/audit.jsonl
 *
 * The act of observation changes the state — each access increments
 * the envelope's access counter and records a timestamp.
 */

import { existsSync, mkdirSync, appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export type AuditAction =
  | "read"
  | "write"
  | "delete"
  | "list"
  | "export"
  | "generate"
  | "entangle"
  | "tunnel"
  | "teleport"
  | "collapse";

export interface AuditEvent {
  timestamp: string;
  action: AuditAction;
  key?: string;
  scope?: string;
  env?: string;
  source: "cli" | "mcp" | "agent" | "api";
  /** Additional context */
  detail?: string;
  /** Process ID for tracking */
  pid: number;
}

function getAuditDir(): string {
  const dir = join(homedir(), ".config", "q-ring");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getAuditPath(): string {
  return join(getAuditDir(), "audit.jsonl");
}

export function logAudit(event: Omit<AuditEvent, "timestamp" | "pid">): void {
  const full: AuditEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    pid: process.pid,
  };

  try {
    appendFileSync(getAuditPath(), JSON.stringify(full) + "\n");
  } catch {
    // audit logging should never crash the app
  }
}

export interface AuditQuery {
  key?: string;
  action?: AuditAction;
  since?: string;
  limit?: number;
}

export function queryAudit(query: AuditQuery = {}): AuditEvent[] {
  const path = getAuditPath();
  if (!existsSync(path)) return [];

  try {
    const lines = readFileSync(path, "utf8")
      .split("\n")
      .filter((l) => l.trim());

    let events: AuditEvent[] = lines
      .map((line) => {
        try {
          return JSON.parse(line) as AuditEvent;
        } catch {
          return null;
        }
      })
      .filter((e): e is AuditEvent => e !== null);

    if (query.key) {
      events = events.filter((e) => e.key === query.key);
    }
    if (query.action) {
      events = events.filter((e) => e.action === query.action);
    }
    if (query.since) {
      const since = new Date(query.since).getTime();
      events = events.filter(
        (e) => new Date(e.timestamp).getTime() >= since,
      );
    }

    events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    if (query.limit) {
      events = events.slice(0, query.limit);
    }

    return events;
  } catch {
    return [];
  }
}

export interface AccessAnomaly {
  type: "burst" | "unusual-hour" | "new-source";
  description: string;
  events: AuditEvent[];
}

/**
 * Detect anomalous access patterns in the audit log.
 */
export function detectAnomalies(key?: string): AccessAnomaly[] {
  const recent = queryAudit({
    key,
    action: "read",
    since: new Date(Date.now() - 3600000).toISOString(), // last hour
  });

  const anomalies: AccessAnomaly[] = [];

  // Burst detection: more than 50 reads of the same key in an hour
  if (key && recent.length > 50) {
    anomalies.push({
      type: "burst",
      description: `${recent.length} reads of "${key}" in the last hour`,
      events: recent.slice(0, 10),
    });
  }

  // Unusual hour detection: access between 1am-5am local time
  const nightAccess = recent.filter((e) => {
    const hour = new Date(e.timestamp).getHours();
    return hour >= 1 && hour < 5;
  });

  if (nightAccess.length > 0) {
    anomalies.push({
      type: "unusual-hour",
      description: `${nightAccess.length} access(es) during unusual hours (1am-5am)`,
      events: nightAccess,
    });
  }

  return anomalies;
}
