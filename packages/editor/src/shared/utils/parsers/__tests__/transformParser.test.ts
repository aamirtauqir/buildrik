import { describe, it, expect } from "vitest";
import {
  parseTransform,
  serializeTransform,
  updateTransformFunction,
  removeTransformFunction,
  isOpaqueTransform,
} from "../transformParser";

describe("parseTransform", () => {
  it("returns empty array for empty/undefined input", () => {
    expect(parseTransform("")).toEqual([]);
    expect(parseTransform("none")).toEqual([]);
  });

  it("parses a single transform function", () => {
    expect(parseTransform("scale(1.5)")).toEqual([{ name: "scale", args: [1.5] }]);
  });

  it("parses multiple transform functions preserving order", () => {
    const result = parseTransform("scale(1.5) rotate(45deg)");
    expect(result).toEqual([
      { name: "scale", args: [1.5] },
      { name: "rotate", args: [45] },
    ]);
  });

  it("parses matrix as opaque function", () => {
    const result = parseTransform("matrix(1, 0, 0, 1, 0, 0)");
    expect(result).toEqual([{ name: "matrix", args: [1, 0, 0, 1, 0, 0] }]);
  });

  it("roundtrips through serializeTransform", () => {
    const input = "scale(1.5) rotate(45) translateX(10)";
    const fns = parseTransform(input);
    const output = serializeTransform(fns);
    expect(output).toBe("scale(1.5) rotate(45) translateX(10)");
  });
});

describe("updateTransformFunction", () => {
  it("updates an existing function", () => {
    const fns = parseTransform("scale(1) rotate(45deg)");
    const updated = updateTransformFunction(fns, "scale", [2]);
    expect(updated[0].args).toEqual([2]);
    expect(updated[1].args).toEqual([45]);
  });

  it("appends a new function if not found", () => {
    const fns = parseTransform("scale(1.5)");
    const updated = updateTransformFunction(fns, "rotate", [90]);
    expect(updated).toHaveLength(2);
    expect(updated[1]).toEqual({ name: "rotate", args: [90] });
  });
});

describe("removeTransformFunction", () => {
  it("removes a function by name", () => {
    const fns = parseTransform("scale(1.5) rotate(45deg)");
    const removed = removeTransformFunction(fns, "rotate");
    expect(removed).toEqual([{ name: "scale", args: [1.5] }]);
  });
});

describe("isOpaqueTransform", () => {
  it("returns true for matrix", () => {
    expect(isOpaqueTransform("matrix(1,0,0,1,0,0)")).toBe(true);
  });

  it("returns true for matrix3d", () => {
    expect(isOpaqueTransform("matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)")).toBe(true);
  });

  it("returns true for perspective", () => {
    expect(isOpaqueTransform("perspective(500px)")).toBe(true);
  });

  it("returns false for scale/rotate", () => {
    expect(isOpaqueTransform("scale(1.5) rotate(45deg)")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isOpaqueTransform("")).toBe(false);
  });
});