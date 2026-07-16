/**
 * constants/uiStyles — mergeStyles helper.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import type { CSSProperties } from "react";
import { mergeStyles } from "../uiStyles";

describe("mergeStyles", () => {
  it("layers additional styles over the base", () => {
    const base: CSSProperties = { color: "red", margin: 0 };
    expect(mergeStyles(base, { color: "blue" })).toEqual({ color: "blue", margin: 0 });
  });

  it("skips null / undefined / false entries", () => {
    const base: CSSProperties = { color: "red" };
    expect(mergeStyles(base, undefined, false, null, { padding: 4 })).toEqual({
      color: "red",
      padding: 4,
    });
  });

  it("does not mutate the base object", () => {
    const base: CSSProperties = { color: "red" };
    mergeStyles(base, { color: "green" });
    expect(base).toEqual({ color: "red" });
  });

  it("returns a shallow copy of the base when no overrides are given", () => {
    const base: CSSProperties = { color: "red" };
    const result = mergeStyles(base);
    expect(result).toEqual(base);
    expect(result).not.toBe(base);
  });
});
