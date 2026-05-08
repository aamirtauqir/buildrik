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
  it("extends Error with sourceId + targetId", () => {
    const err = new AliasDepthError("color-primary", "color-brand");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("AliasDepthError");
    expect(err.sourceId).toBe("color-primary");
    expect(err.targetId).toBe("color-brand");
  });

  it("message indicates depth-1 violation with both ids", () => {
    const err = new AliasDepthError("a", "b");
    expect(err.message).toContain("depth-1");
    expect(err.message).toContain("a");
    expect(err.message).toContain("b");
  });
});
