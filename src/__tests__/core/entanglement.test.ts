import { describe, it, expect, beforeEach } from "vitest";
import {
  entangle,
  disentangle,
  findEntangled,
  listEntanglements,
} from "../../core/entanglement.js";

const src = { service: "vitest-src", key: "KEY_A" };
const tgt = { service: "vitest-tgt", key: "KEY_B" };

describe("entanglement", () => {
  beforeEach(() => {
    disentangle(src, tgt);
  });

  it("entangles two secrets and creates bidirectional links", () => {
    entangle(src, tgt);
    const partners = findEntangled(src);
    expect(partners).toContainEqual(tgt);
    const reverse = findEntangled(tgt);
    expect(reverse).toContainEqual(src);
  });

  it("does not duplicate pairs on repeated entangle calls", () => {
    entangle(src, tgt);
    entangle(src, tgt);
    const all = listEntanglements().filter(
      (p) =>
        p.source.service === src.service &&
        p.source.key === src.key &&
        p.target.service === tgt.service &&
        p.target.key === tgt.key,
    );
    expect(all.length).toBe(1);
  });

  it("disentangle removes both forward and reverse links", () => {
    entangle(src, tgt);
    disentangle(src, tgt);
    expect(findEntangled(src)).not.toContainEqual(tgt);
    expect(findEntangled(tgt)).not.toContainEqual(src);
  });

  it("findEntangled returns empty for unlinked secrets", () => {
    expect(findEntangled({ service: "nope", key: "X" })).toEqual([]);
  });

  it("listEntanglements returns all pairs", () => {
    entangle(src, tgt);
    const pairs = listEntanglements();
    expect(pairs.length).toBeGreaterThanOrEqual(2);
  });
});
