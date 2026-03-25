import { describe, it, expect, afterAll } from "vitest";
import { scanCodebase } from "../../core/scan.js";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const TMP_DIR = join(tmpdir(), `qring-scan-test-${Date.now()}`);

function setup() {
  mkdirSync(TMP_DIR, { recursive: true });
}

afterAll(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

describe("scanCodebase", () => {
  it("returns empty for a directory with no secrets", () => {
    setup();
    writeFileSync(join(TMP_DIR, "clean.ts"), 'const x = "hello";\n');
    const results = scanCodebase(TMP_DIR);
    expect(results.filter((r) => r.file.includes("clean.ts"))).toHaveLength(0);
  });

  it("detects a hardcoded API key", () => {
    setup();
    writeFileSync(
      join(TMP_DIR, "leaky.ts"),
      'const api_key = "sk-abcdef1234567890abcdef1234567890";\n',
    );
    const results = scanCodebase(TMP_DIR);
    const hit = results.find((r) => r.file.includes("leaky.ts"));
    expect(hit).toBeDefined();
    expect(hit!.keyName.toLowerCase()).toContain("api_key");
  });

  it("ignores placeholder values", () => {
    setup();
    writeFileSync(
      join(TMP_DIR, "placeholder.ts"),
      'const secret = "your_api_key_placeholder_here";\n',
    );
    const results = scanCodebase(TMP_DIR);
    const hit = results.find((r) => r.file.includes("placeholder.ts"));
    expect(hit).toBeUndefined();
  });

  it("ignores short values", () => {
    setup();
    writeFileSync(
      join(TMP_DIR, "short.ts"),
      'const token = "abc";\n',
    );
    const results = scanCodebase(TMP_DIR);
    const hit = results.find((r) => r.file.includes("short.ts"));
    expect(hit).toBeUndefined();
  });

  it("returns an empty array for a nonexistent directory", () => {
    const results = scanCodebase("/tmp/does-not-exist-qring");
    expect(results).toEqual([]);
  });

  it("detects ghp_ prefixed tokens", () => {
    setup();
    writeFileSync(
      join(TMP_DIR, "github.js"),
      'const token = "ghp_abcdef1234567890abcdef12345678901234";\n',
    );
    const results = scanCodebase(TMP_DIR);
    const hit = results.find((r) => r.file.includes("github.js"));
    expect(hit).toBeDefined();
  });
});
