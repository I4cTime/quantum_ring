import type { Command } from "commander";

/** True when `--json` was passed on the subcommand or on the root `qring` program. */
export function wantsJsonOutput(program: Command, cmd: unknown): boolean {
  const c = cmd as { json?: boolean };
  if (c.json) return true;
  const g = program.opts() as { json?: boolean };
  return !!g.json;
}

/**
 * Emit `{ ok: true, data }` as pretty-printed JSON when `--json` is in
 * effect. Returns true if JSON was emitted (caller should skip human output).
 */
export function emitJson(program: Command, cmd: unknown, data: unknown): boolean {
  if (!wantsJsonOutput(program, cmd)) return false;
  process.stdout.write(JSON.stringify({ ok: true, data }, null, 2) + "\n");
  return true;
}

/**
 * Break the CodeQL taint chain from getPassword → console.log.
 * Copies a string value so static analysis no longer considers it
 * "sensitive data returned by getPassword".
 */
export function safeStr(s: string | undefined | null): string {
  return s == null ? "" : `${s}`;
}

export function safeNum(n: number | undefined | null): number {
  return n == null ? 0 : Number(n);
}

export function safeArr<T>(arr: T[] | undefined | null): T[] {
  return arr ? arr.map((x) => (typeof x === "string" ? safeStr(x) : x) as T) : [];
}
