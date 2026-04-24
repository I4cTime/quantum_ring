import { describe, it, expect } from "vitest";
import { filterSecretsByKeyGlob } from "../../services/list-secrets-filter.js";
import type { SecretEntry } from "../../core/keyring.js";

function entry(key: string): SecretEntry {
  return { key, scope: "global" };
}

describe("filterSecretsByKeyGlob", () => {
  it("returns all when filter empty", () => {
    const list = [entry("API_KEY"), entry("OTHER")];
    expect(filterSecretsByKeyGlob(list, "")).toHaveLength(2);
    expect(filterSecretsByKeyGlob(list, undefined)).toHaveLength(2);
  });

  it("matches glob with escaped regex chars", () => {
    const list = [entry("API_KEY"), entry("API_SECRET"), entry("OTHER")];
    const out = filterSecretsByKeyGlob(list, "API_*");
    expect(out.map((e) => e.key).sort()).toEqual(["API_KEY", "API_SECRET"]);
  });

  it("supports single-character ?", () => {
    const list = [entry("A1"), entry("A2"), entry("A12")];
    const out = filterSecretsByKeyGlob(list, "A?");
    expect(out.map((e) => e.key).sort()).toEqual(["A1", "A2"]);
  });
});
