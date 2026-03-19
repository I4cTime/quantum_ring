/**
 * Minimal ANSI color helpers. No dependencies.
 */

const enabled = process.stdout.isTTY !== false && !process.env.NO_COLOR;

function wrap(code: string, text: string): string {
  return enabled ? `\x1b[${code}m${text}\x1b[0m` : text;
}

export const c = {
  bold: (t: string) => wrap("1", t),
  dim: (t: string) => wrap("2", t),
  italic: (t: string) => wrap("3", t),
  underline: (t: string) => wrap("4", t),

  red: (t: string) => wrap("31", t),
  green: (t: string) => wrap("32", t),
  yellow: (t: string) => wrap("33", t),
  blue: (t: string) => wrap("34", t),
  magenta: (t: string) => wrap("35", t),
  cyan: (t: string) => wrap("36", t),
  white: (t: string) => wrap("37", t),
  gray: (t: string) => wrap("90", t),

  bgRed: (t: string) => wrap("41", t),
  bgGreen: (t: string) => wrap("42", t),
  bgYellow: (t: string) => wrap("43", t),
  bgBlue: (t: string) => wrap("44", t),
  bgMagenta: (t: string) => wrap("45", t),
  bgCyan: (t: string) => wrap("46", t),
};

export function scopeColor(scope: string): string {
  return scope === "project" ? c.cyan(scope) : c.blue(scope);
}

export function decayIndicator(percent: number, expired: boolean): string {
  if (expired) return c.bgRed(c.white(" EXPIRED "));
  if (percent >= 90) return c.red(`[decay ${percent}%]`);
  if (percent >= 75) return c.yellow(`[decay ${percent}%]`);
  if (percent > 0) return c.green(`[decay ${percent}%]`);
  return "";
}

export function envBadge(env: string): string {
  switch (env) {
    case "prod":
      return c.bgRed(c.white(` ${env} `));
    case "staging":
      return c.bgYellow(c.white(` ${env} `));
    case "dev":
      return c.bgGreen(c.white(` ${env} `));
    case "test":
      return c.bgBlue(c.white(` ${env} `));
    default:
      return c.bgMagenta(c.white(` ${env} `));
  }
}

export const SYMBOLS = {
  check: enabled ? "\u2713" : "[ok]",
  cross: enabled ? "\u2717" : "[x]",
  arrow: enabled ? "\u2192" : "->",
  dot: enabled ? "\u2022" : "*",
  lock: enabled ? "\u{1f512}" : "[locked]",
  key: enabled ? "\u{1f511}" : "[key]",
  link: enabled ? "\u{1f517}" : "[link]",
  warning: enabled ? "\u26a0\ufe0f" : "[!]",
  clock: enabled ? "\u23f0" : "[time]",
  shield: enabled ? "\u{1f6e1}\ufe0f" : "[shield]",
  zap: enabled ? "\u26a1" : "[zap]",
  eye: enabled ? "\u{1f441}\ufe0f" : "[eye]",
  ghost: enabled ? "\u{1f47b}" : "[ghost]",
  package: enabled ? "\u{1f4e6}" : "[pkg]",
  sparkle: enabled ? "\u2728" : "[*]",
} as const;
