import { describe, it, expect, beforeEach } from "vitest";
import {
  registerHook,
  removeHook,
  listHooks,
  enableHook,
  disableHook,
} from "../../core/hooks.js";

describe("hooks lifecycle", () => {
  let hookId: string;

  beforeEach(() => {
    for (const h of listHooks()) removeHook(h.id);

    const entry = registerHook({
      type: "shell",
      match: { key: "TEST_KEY", action: ["write"] },
      command: 'echo "rotated"',
      enabled: true,
    });
    hookId = entry.id;
  });

  it("registerHook returns an entry with id and createdAt", () => {
    const entry = registerHook({
      type: "shell",
      match: { key: "OTHER" },
      command: "echo hi",
      enabled: true,
    });
    expect(entry.id).toBeTruthy();
    expect(entry.createdAt).toBeTruthy();
    expect(entry.type).toBe("shell");
  });

  it("listHooks includes the registered hook", () => {
    const hooks = listHooks();
    expect(hooks.some((h) => h.id === hookId)).toBe(true);
  });

  it("disableHook sets enabled to false", () => {
    expect(disableHook(hookId)).toBe(true);
    const h = listHooks().find((h) => h.id === hookId);
    expect(h?.enabled).toBe(false);
  });

  it("enableHook sets enabled to true", () => {
    disableHook(hookId);
    expect(enableHook(hookId)).toBe(true);
    const h = listHooks().find((h) => h.id === hookId);
    expect(h?.enabled).toBe(true);
  });

  it("removeHook deletes the hook and returns true", () => {
    expect(removeHook(hookId)).toBe(true);
    expect(listHooks().some((h) => h.id === hookId)).toBe(false);
  });

  it("removeHook returns false for unknown id", () => {
    expect(removeHook("nonexistent")).toBe(false);
  });
});
