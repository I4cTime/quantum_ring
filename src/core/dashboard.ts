/**
 * Quantum Status Dashboard: local HTTP server with SSE live updates.
 *
 * Collects a full snapshot of all quantum state every few seconds and
 * pushes it to connected browsers. Never exposes secret values.
 */

import { createServer, type IncomingMessage, type ServerResponse, type Server } from "node:http";
import { listSecrets } from "./keyring.js";
import { checkDecay, type DecayStatus, type QuantumEnvelope } from "./envelope.js";
import { listEntanglements, type EntanglementPair } from "./entanglement.js";
import { tunnelList } from "./tunnel.js";
import { queryAudit, detectAnomalies, type AuditEvent, type AccessAnomaly } from "./observer.js";
import { collapseEnvironment, type CollapseResult } from "./collapse.js";
import { getDashboardHtml } from "./dashboard-html.js";

export interface SecretSnapshot {
  key: string;
  scope: string;
  type: "collapsed" | "superposition";
  environments?: string[];
  defaultEnv?: string;
  decay: DecayStatus;
  accessCount: number;
  lastAccessedAt?: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  tags?: string[];
  entangled?: { service: string; key: string }[];
}

export interface TunnelSnapshot {
  id: string;
  createdAt: number;
  expiresAt?: number;
  accessCount: number;
  maxReads?: number;
}

export interface DashboardSnapshot {
  timestamp: string;
  secrets: SecretSnapshot[];
  health: { healthy: number; stale: number; expired: number; noDecay: number; total: number };
  entanglements: EntanglementPair[];
  tunnels: TunnelSnapshot[];
  audit: AuditEvent[];
  anomalies: AccessAnomaly[];
  environment: CollapseResult | null;
}

function toSecretSnapshot(entry: {
  key: string;
  scope: string;
  envelope?: QuantumEnvelope;
  decay?: DecayStatus;
}): SecretSnapshot {
  const envelope = entry.envelope;
  const decay = envelope ? checkDecay(envelope) : {
    isExpired: false,
    isStale: false,
    lifetimePercent: 0,
    secondsRemaining: null,
    timeRemaining: null,
  };

  return {
    key: entry.key,
    scope: entry.scope,
    type: envelope?.states ? "superposition" : "collapsed",
    environments: envelope?.states ? Object.keys(envelope.states) : undefined,
    defaultEnv: envelope?.defaultEnv,
    decay,
    accessCount: envelope?.meta.accessCount ?? 0,
    lastAccessedAt: envelope?.meta.lastAccessedAt,
    createdAt: envelope?.meta.createdAt ?? "",
    updatedAt: envelope?.meta.updatedAt ?? "",
    description: envelope?.meta.description,
    tags: envelope?.meta.tags,
    entangled: envelope?.meta.entangled,
  };
}

export function collectSnapshot(): DashboardSnapshot {
  const entries = listSecrets({ source: "api", silent: true });

  const secrets = entries.map(toSecretSnapshot);

  let healthy = 0;
  let stale = 0;
  let expired = 0;
  let noDecay = 0;

  for (const s of secrets) {
    if (!s.decay.timeRemaining) {
      noDecay++;
    } else if (s.decay.isExpired) {
      expired++;
    } else if (s.decay.isStale) {
      stale++;
    } else {
      healthy++;
    }
  }

  return {
    timestamp: new Date().toISOString(),
    secrets,
    health: { healthy, stale, expired, noDecay, total: secrets.length },
    entanglements: listEntanglements(),
    tunnels: tunnelList(),
    audit: queryAudit({ limit: 50 }).filter(e => e.action !== "list"),
    anomalies: detectAnomalies(),
    environment: collapseEnvironment(),
  };
}

export interface DashboardServerOptions {
  port?: number;
}

export function startDashboardServer(
  options: DashboardServerOptions = {},
): { port: number; close: () => void; server: Server } {
  const port = options.port ?? 9876;
  const clients = new Set<ServerResponse>();
  let intervalHandle: ReturnType<typeof setInterval> | null = null;

  const html = getDashboardHtml();

  function broadcast() {
    const snapshot = collectSnapshot();
    const data = `data: ${JSON.stringify(snapshot)}\n\n`;
    for (const res of clients) {
      try {
        res.write(data);
      } catch {
        clients.delete(res);
      }
    }
  }

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? "/";

    if (url === "/events") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });

      // Send initial snapshot immediately
      const snapshot = collectSnapshot();
      res.write(`data: ${JSON.stringify(snapshot)}\n\n`);

      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }

    if (url === "/api/status") {
      const snapshot = collectSnapshot();
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(JSON.stringify(snapshot, null, 2));
      return;
    }

    // Serve the dashboard HTML
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
  });

  server.listen(port, "127.0.0.1", () => {
    intervalHandle = setInterval(broadcast, 5000);
    if (intervalHandle && typeof intervalHandle === "object" && "unref" in intervalHandle) {
      intervalHandle.unref();
    }
  });

  return {
    port,
    close: () => {
      if (intervalHandle) clearInterval(intervalHandle);
      for (const res of clients) {
        try { res.end(); } catch { /* noop */ }
      }
      clients.clear();
      server.close();
    },
    server,
  };
}
