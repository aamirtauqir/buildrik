/**
 * parseCssShorthand — CSS 1-to-4 value shorthand expansion into
 * top/right/bottom/left, with empty + overflow guards.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { parseCssShorthand } from "../parseCssShorthand";

describe("parseCssShorthand", () => {
  it("returns blank sides for an empty string", () => {
    expect(parseCssShorthand("")).toEqual({ top: "", right: "", bottom: "", left: "" });
  });

  it("applies one value to all four sides", () => {
    expect(parseCssShorthand("10px")).toEqual({
      top: "10px",
      right: "10px",
      bottom: "10px",
      left: "10px",
    });
  });

  it("maps two values to vertical / horizontal", () => {
    expect(parseCssShorthand("10px 20px")).toEqual({
      top: "10px",
      right: "20px",
      bottom: "10px",
      left: "20px",
    });
  });

  it("maps three values to top / horizontal / bottom", () => {
    expect(parseCssShorthand("10px 20px 30px")).toEqual({
      top: "10px",
      right: "20px",
      bottom: "30px",
      left: "20px",
    });
  });

  it("maps four values clockwise", () => {
    expect(parseCssShorthand("10px 20px 30px 40px")).toEqual({
      top: "10px",
      right: "20px",
      bottom: "30px",
      left: "40px",
    });
  });

  it("collapses extra whitespace between tokens", () => {
    expect(parseCssShorthand("10px   20px")).toEqual({
      top: "10px",
      right: "20px",
      bottom: "10px",
      left: "20px",
    });
  });

  it("returns blank sides for more than four values", () => {
    expect(parseCssShorthand("1px 2px 3px 4px 5px")).toEqual({
      top: "",
      right: "",
      bottom: "",
      left: "",
    });
  });
});
