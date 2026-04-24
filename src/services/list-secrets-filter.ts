import type { SecretEntry } from "../core/keyring.js";

/**
 * Turn a user glob (`*`, `?`) into a case-insensitive RegExp source.
 * Other regex metacharacters are escaped.
 */
function globKeyPatternToRegexSource(pattern: string): string {
  let out = "";
  for (const c of pattern) {
    if (c === "*") out += ".*";
    else if (c === "?") out += ".";
    else if ("\\^$+{}()|[]".includes(c)) out += "\\" + c;
    else if (c === ".") out += "\\.";
    else out += c;
  }
  return out;
}

/**
 * Key name glob: `*` → `.*`, `?` → `.`, other regex metacharacters escaped (CLI + MCP aligned).
 */
export function filterSecretsByKeyGlob(
  entries: SecretEntry[],
  filter?: string,
): SecretEntry[] {
  if (!filter?.trim()) return entries;
  const regex = new RegExp("^" + globKeyPatternToRegexSource(filter) + "$", "i");
  return entries.filter((e) => regex.test(e.key));
}
