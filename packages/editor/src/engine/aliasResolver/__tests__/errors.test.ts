import { describe, it, expect } from "vitest";
import { AliasCycleError, AliasDepthError } from "../errors";

describe("AliasCycleError", () => {
  it("extends Error with chain field", () => {
    const err = new AliasCycleError(["color-primary", "color-brand", "color-primary"]);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("AliasCycleError");
    expect(err.chain).toEqual(["color-primary", "color-brand", "color-primary"]);
  });

  it("message includes the chain joined by arrows", () => {
    const err = new AliasCycleError(["a", "b", "a"]);
    expect(err.message).toContain("a → b → a");
  });

  it("preserves chain across .toJSON for transport", () => {
    const err = new AliasCycleError(["x", "y", "x"]);
    const json = err.toJSON();
    expect(json).toMatchObject({ name: "AliasCycleError", chain: ["x", "y", "x"] });
  });
});

describe("AliasDepthError", () => {
  // B2 upgrade (2026-05-16): constructor takes the full chain, not (source, target).
  // sourceId + targetId derived from chain[0] and chain[last] for back-compat.

  it("extends Error with sourceId + targetId + chain fields", () => {
    const err = new AliasDepthError(["a", "b", "c", "d", "e"]);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("AliasDepthError");
    expect(err.sourceId).toBe("a");
    expect(err.targetId).toBe("e");
    expect(err.chain).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("message indicates depth violation with full chain joined by arrows", () => {
    const err = new AliasDepthError(["a", "b", "c", "d", "e"]);
    expect(err.message).toContain("max depth 3");
    expect(err.message).toContain("a → b → c → d → e");
  });
});
