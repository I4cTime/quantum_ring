import { describe, it, expect } from "vitest";
import { createProgram } from "../../cli/commands.js";

describe("--help output", () => {
  it("produces help text containing the program name", () => {
    const program = createProgram();
    const help = program.helpInformation();
    expect(help).toContain("qring");
  });

  it("lists key commands in help output", () => {
    const program = createProgram();
    const help = program.helpInformation();
    const expectedKeywords = [
      "set", "get", "delete", "list", "tunnel", "teleport",
      "audit", "generate", "scan", "lint", "agent",
    ];
    for (const kw of expectedKeywords) {
      expect(help).toContain(kw);
    }
  });

  it("each command has a description", () => {
    const program = createProgram();
    for (const cmd of program.commands) {
      expect(cmd.description()).toBeTruthy();
    }
  });
});
