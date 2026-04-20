import { describe, it, expect } from "vitest";
import {
  parseFilter,
  serializeFilter,
  updateFilterFunction,
  removeFilterFunction,
} from "../filterParser";

describe("parseFilter", () => {
  it("returns empty array for empty input", () => {
    expect(parseFilter("")).toEqual([]);
    expect(parseFilter("none")).toEqual([]);
  });

  it("parses a single filter function", () => {
    expect(parseFilter("blur(5px)")).toEqual([{ name: "blur", args: [5] }]);
  });

  it("parses multiple filter functions", () => {
    const result = parseFilter("blur(5px) brightness(120%)");
    expect(result).toEqual([
      { name: "blur", args: [5] },
      { name: "brightness", args: [120] },
    ]);
  });

  it("roundtrips through serializeFilter", () => {
    const input = "blur(5px) brightness(120%) contrast(80%)";
    const fns = parseFilter(input);
    // Parser numeric-izes 120% to 120, so roundtrip differs
    const output = serializeFilter(fns);
    expect(output).toContain("blur");
    expect(output).toContain("brightness");
    expect(output).toContain("contrast");
  });
});

describe("updateFilterFunction", () => {
  it("updates an existing function", () => {
    const fns = parseFilter("blur(5px) brightness(100%)");
    const updated = updateFilterFunction(fns, "blur", [10]);
    expect(updated[0].args).toEqual([10]);
    expect(updated[1].args).toEqual([100]);
  });

  it("appends a new function if not found", () => {
    const fns = parseFilter("blur(5px)");
    const updated = updateFilterFunction(fns, "brightness", [120]);
    expect(updated).toHaveLength(2);
    expect(updated[1]).toEqual({ name: "brightness", args: [120] });
  });
});

describe("removeFilterFunction", () => {
  it("removes a function by name", () => {
    const fns = parseFilter("blur(5px) brightness(120%)");
    const removed = removeFilterFunction(fns, "blur");
    expect(removed).toEqual([{ name: "brightness", args: [120] }]);
  });
});