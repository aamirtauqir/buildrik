/**
 * detectMixedValues — cross-element style diffing for the multi-select
 * "Mixed" badges.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { detectMixedValues } from "../detectMixedValues";

const el = (styles: Record<string, string>) => ({ getStyles: () => styles });

describe("detectMixedValues", () => {
  it("returns an empty set for a single element", () => {
    expect(detectMixedValues([el({ color: "red" })], ["color"]).size).toBe(0);
  });

  it("returns an empty set when all elements agree on every checked key", () => {
    const result = detectMixedValues(
      [el({ color: "red", width: "10px" }), el({ color: "red", width: "10px" })],
      ["color", "width"]
    );
    expect(result.size).toBe(0);
  });

  it("flags a key whose value differs across elements", () => {
    const result = detectMixedValues(
      [el({ color: "red" }), el({ color: "blue" })],
      ["color"]
    );
    expect(result.has("color")).toBe(true);
  });

  it("treats a missing key on one element as a difference", () => {
    const result = detectMixedValues([el({ color: "red" }), el({})], ["color"]);
    expect(result.has("color")).toBe(true);
  });

  it("only inspects the provided styleKeys", () => {
    const result = detectMixedValues(
      [el({ color: "red", width: "1px" }), el({ color: "red", width: "2px" })],
      ["color"]
    );
    expect(result.has("width")).toBe(false);
    expect(result.size).toBe(0);
  });

  it("detects a difference contributed by a third element", () => {
    const result = detectMixedValues(
      [el({ gap: "4px" }), el({ gap: "4px" }), el({ gap: "8px" })],
      ["gap"]
    );
    expect(result.has("gap")).toBe(true);
  });
});
