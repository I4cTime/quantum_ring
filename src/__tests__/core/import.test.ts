import { describe, it, expect } from "vitest";
import { parseDotenv } from "../../core/import.js";

describe("parseDotenv", () => {
  it("parses simple key=value pairs", () => {
    const result = parseDotenv("FOO=bar\nBAZ=qux");
    expect(result.get("FOO")).toBe("bar");
    expect(result.get("BAZ")).toBe("qux");
  });

  it("strips double and single quotes", () => {
    const result = parseDotenv('A="hello"\nB=\'world\'');
    expect(result.get("A")).toBe("hello");
    expect(result.get("B")).toBe("world");
  });

  it("skips comments and blank lines", () => {
    const result = parseDotenv("# comment\n\nKEY=val");
    expect(result.size).toBe(1);
    expect(result.get("KEY")).toBe("val");
  });

  it("unescapes \\n, \\r, \\t, \\\\ and \\\" correctly", () => {
    const result = parseDotenv(String.raw`NEWLINE="hello\nworld"`);
    expect(result.get("NEWLINE")).toBe("hello\nworld");

    const r2 = parseDotenv(String.raw`TAB="col1\tcol2"`);
    expect(r2.get("TAB")).toBe("col1\tcol2");

    const r3 = parseDotenv(String.raw`QUOTE="say \"hi\""`);
    expect(r3.get("QUOTE")).toBe('say "hi"');
  });

  it("handles escaped backslash before n (no double-unescape)", () => {
    const result = parseDotenv(String.raw`PATH="C:\\new"`);
    expect(result.get("PATH")).toBe("C:\\new");
  });

  it("handles double backslash standalone", () => {
    const result = parseDotenv(String.raw`BS="a\\b"`);
    expect(result.get("BS")).toBe("a\\b");
  });

  it("strips inline comments for unquoted values", () => {
    const result = parseDotenv("KEY=value # inline comment");
    expect(result.get("KEY")).toBe("value");
  });

  it("preserves hash in quoted values", () => {
    const result = parseDotenv('TAG="v1.0#beta"');
    expect(result.get("TAG")).toBe("v1.0#beta");
  });
});
