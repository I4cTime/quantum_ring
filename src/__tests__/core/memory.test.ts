import { describe, it, expect, beforeEach } from "vitest";
import {
  remember,
  recall,
  listMemory,
  forget,
  clearMemory,
} from "../../core/memory.js";

describe("agent memory", () => {
  beforeEach(() => {
    clearMemory();
  });

  it("stores and recalls a value", () => {
    remember("note", "hello world");
    expect(recall("note")).toBe("hello world");
  });

  it("returns null for a key that was never stored", () => {
    expect(recall("missing")).toBeNull();
  });

  it("overwrites a key on re-remember", () => {
    remember("key", "v1");
    remember("key", "v2");
    expect(recall("key")).toBe("v2");
  });

  it("lists all stored keys", () => {
    remember("a", "1");
    remember("b", "2");
    const list = listMemory();
    const keys = list.map((m) => m.key);
    expect(keys).toContain("a");
    expect(keys).toContain("b");
  });

  it("forgets a key and returns true", () => {
    remember("del", "gone");
    expect(forget("del")).toBe(true);
    expect(recall("del")).toBeNull();
  });

  it("returns false when forgetting a non-existent key", () => {
    expect(forget("nope")).toBe(false);
  });

  it("clearMemory removes all keys", () => {
    remember("x", "1");
    remember("y", "2");
    clearMemory();
    expect(listMemory()).toHaveLength(0);
  });
});
