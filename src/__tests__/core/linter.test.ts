import { describe, it, expect, afterAll } from "vitest";
import { lintFiles } from "../../core/linter.js";
import { writeFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const TMP_DIR = join(tmpdir(), `qring-lint-test-${Date.now()}`);

function setup() {
  mkdirSync(TMP_DIR, { recursive: true });
}

afterAll(() => {
  rmSync(TMP_DIR, { recursive: true, force: true });
});

describe("lintFiles", () => {
  it("detects secrets in a file without fixing", () => {
    setup();
    const file = join(TMP_DIR, "app.ts");
    writeFileSync(
      file,
      'const api_key = "sk-abcdef1234567890abcdef1234567890";\n',
    );
    const results = lintFiles([file]);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].fixed).toBe(false);
  });

  it("returns empty for clean files", () => {
    setup();
    const file = join(TMP_DIR, "clean.ts");
    writeFileSync(file, 'const name = "hello world";\n');
    const results = lintFiles([file]);
    expect(results).toHaveLength(0);
  });

  it("skips nonexistent files", () => {
    const results = lintFiles(["/tmp/does-not-exist-qring-lint.ts"]);
    expect(results).toHaveLength(0);
  });

  it("ignores placeholder values", () => {
    setup();
    const file = join(TMP_DIR, "safe.py");
    writeFileSync(file, 'password = "replace_me_with_real_password"\n');
    const results = lintFiles([file]);
    expect(results).toHaveLength(0);
  });
});
