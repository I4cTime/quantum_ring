/**
 * Hook system: fire callbacks when secrets are created, updated, or deleted.
 * Supports shell commands, HTTP webhooks, and process signals.
 *
 * Registry stored at ~/.config/q-ring/hooks.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { exec } from "node:child_process";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import { randomUUID } from "node:crypto";
import { logAudit } from "./observer.js";

export type HookType = "shell" | "http" | "signal";
export type HookAction = "write" | "delete" | "rotate";

export interface HookMatch {
  key?: string;
  keyPattern?: string;
  tag?: string;
  scope?: "global" | "project";
  action?: HookAction[];
}

export interface HookEntry {
  id: string;
  type: HookType;
  match: HookMatch;
  command?: string;
  url?: string;
  signal?: { target: string; signal?: string };
  description?: string;
  createdAt: string;
  enabled: boolean;
}

export interface HookPayload {
  action: HookAction;
  key: string;
  scope: string;
  timestamp: string;
  source: "cli" | "mcp" | "agent" | "api";
}

export interface HookResult {
  hookId: string;
  success: boolean;
  message: string;
}

interface HookRegistry {
  hooks: HookEntry[];
}

function getRegistryPath(): string {
  const dir = join(homedir(), ".config", "q-ring");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return join(dir, "hooks.json");
}

function loadRegistry(): HookRegistry {
  const path = getRegistryPath();
  if (!existsSync(path)) {
    return { hooks: [] };
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return { hooks: [] };
  }
}

function saveRegistry(registry: HookRegistry): void {
  writeFileSync(getRegistryPath(), JSON.stringify(registry, null, 2));
}

export function registerHook(
  entry: Omit<HookEntry, "id" | "createdAt">,
): HookEntry {
  const registry = loadRegistry();
  const hook: HookEntry = {
    ...entry,
    id: randomUUID().slice(0, 8),
    createdAt: new Date().toISOString(),
  };
  registry.hooks.push(hook);
  saveRegistry(registry);
  return hook;
}

export function removeHook(id: string): boolean {
  const registry = loadRegistry();
  const before = registry.hooks.length;
  registry.hooks = registry.hooks.filter((h) => h.id !== id);
  if (registry.hooks.length < before) {
    saveRegistry(registry);
    return true;
  }
  return false;
}

export function listHooks(): HookEntry[] {
  return loadRegistry().hooks;
}

export function enableHook(id: string): boolean {
  const registry = loadRegistry();
  const hook = registry.hooks.find((h) => h.id === id);
  if (!hook) return false;
  hook.enabled = true;
  saveRegistry(registry);
  return true;
}

export function disableHook(id: string): boolean {
  const registry = loadRegistry();
  const hook = registry.hooks.find((h) => h.id === id);
  if (!hook) return false;
  hook.enabled = false;
  saveRegistry(registry);
  return true;
}

function matchesHook(
  hook: HookEntry,
  payload: HookPayload,
  tags?: string[],
): boolean {
  if (!hook.enabled) return false;

  const m = hook.match;

  if (m.action?.length && !m.action.includes(payload.action)) return false;

  if (m.key && m.key !== payload.key) return false;

  if (m.keyPattern) {
    const regex = new RegExp(
      "^" + m.keyPattern.replace(/\*/g, ".*") + "$",
      "i",
    );
    if (!regex.test(payload.key)) return false;
  }

  if (m.tag && (!tags || !tags.includes(m.tag))) return false;

  if (m.scope && m.scope !== payload.scope) return false;

  return true;
}

function executeShell(command: string, payload: HookPayload): Promise<HookResult> {
  return new Promise((resolve) => {
    const env = {
      ...process.env,
      QRING_HOOK_KEY: payload.key,
      QRING_HOOK_ACTION: payload.action,
      QRING_HOOK_SCOPE: payload.scope,
    };

    exec(command, { timeout: 30000, env }, (err, stdout, stderr) => {
      if (err) {
        resolve({ hookId: "", success: false, message: `Shell error: ${err.message}` });
      } else {
        resolve({ hookId: "", success: true, message: stdout.trim() || "OK" });
      }
    });
  });
}

function executeHttp(url: string, payload: HookPayload): Promise<HookResult> {
  return new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const parsedUrl = new URL(url);
    const reqFn = parsedUrl.protocol === "https:" ? httpsRequest : httpRequest;

    const req = reqFn(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "User-Agent": "q-ring-hooks/1.0",
        },
        timeout: 10000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({
            hookId: "",
            success: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
            message: `HTTP ${res.statusCode}`,
          });
        });
      },
    );

    req.on("error", (err) => {
      resolve({ hookId: "", success: false, message: `HTTP error: ${err.message}` });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ hookId: "", success: false, message: "HTTP timeout" });
    });
    req.write(body);
    req.end();
  });
}

function executeSignal(
  target: string,
  signal: string = "SIGHUP",
): Promise<HookResult> {
  return new Promise((resolve) => {
    const pid = parseInt(target, 10);
    if (!isNaN(pid)) {
      try {
        process.kill(pid, signal as NodeJS.Signals);
        resolve({ hookId: "", success: true, message: `Signal ${signal} sent to PID ${pid}` });
      } catch (err) {
        resolve({ hookId: "", success: false, message: `Signal error: ${err instanceof Error ? err.message : String(err)}` });
      }
      return;
    }

    exec(`pgrep -f "${target}"`, { timeout: 5000 }, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve({ hookId: "", success: false, message: `Process "${target}" not found` });
        return;
      }
      const pids = stdout.trim().split("\n").map((p) => parseInt(p.trim(), 10)).filter((p) => !isNaN(p));
      let sent = 0;
      for (const p of pids) {
        try {
          process.kill(p, signal as NodeJS.Signals);
          sent++;
        } catch { /* ignore dead PIDs */ }
      }
      resolve({ hookId: "", success: sent > 0, message: `Signal ${signal} sent to ${sent} process(es)` });
    });
  });
}

async function executeHook(
  hook: HookEntry,
  payload: HookPayload,
): Promise<HookResult> {
  let result: HookResult;

  switch (hook.type) {
    case "shell":
      result = hook.command
        ? await executeShell(hook.command, payload)
        : { hookId: hook.id, success: false, message: "No command specified" };
      break;
    case "http":
      result = hook.url
        ? await executeHttp(hook.url, payload)
        : { hookId: hook.id, success: false, message: "No URL specified" };
      break;
    case "signal":
      result = hook.signal
        ? await executeSignal(hook.signal.target, hook.signal.signal)
        : { hookId: hook.id, success: false, message: "No signal target specified" };
      break;
    default:
      result = { hookId: hook.id, success: false, message: `Unknown hook type: ${hook.type}` };
  }

  result.hookId = hook.id;
  return result;
}

/**
 * Fire all matching hooks for a given payload. Fire-and-forget — never blocks
 * the caller on hook failures.
 */
export async function fireHooks(
  payload: HookPayload,
  tags?: string[],
): Promise<HookResult[]> {
  const hooks = listHooks();
  const matching = hooks.filter((h) => matchesHook(h, payload, tags));

  if (matching.length === 0) return [];

  const results = await Promise.allSettled(
    matching.map((h) => executeHook(h, payload)),
  );

  const hookResults: HookResult[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      hookResults.push(r.value);
    } else {
      hookResults.push({
        hookId: "unknown",
        success: false,
        message: r.reason?.message ?? "Hook execution failed",
      });
    }
  }

  for (const r of hookResults) {
    try {
      logAudit({
        action: "write",
        key: payload.key,
        scope: payload.scope,
        source: payload.source,
        detail: `hook:${r.hookId} ${r.success ? "ok" : "fail"} — ${r.message}`,
      });
    } catch { /* never crash on audit logging */ }
  }

  return hookResults;
}
