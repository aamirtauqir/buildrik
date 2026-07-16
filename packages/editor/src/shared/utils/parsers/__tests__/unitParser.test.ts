/**
 * parsers/unitParser — CSS value parsing + unit conversion.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  parseCSSValue,
  convertToPixels,
  convertFromPixels,
  formatCSSValue,
} from "../unitParser";

describe("parseCSSValue", () => {
  it("parses a numeric value with an explicit unit", () => {
    expect(parseCSSValue("12px")).toEqual({ value: 12, unit: "px" });
    expect(parseCSSValue("1.5rem")).toEqual({ value: 1.5, unit: "rem" });
    expect(parseCSSValue("-3em")).toEqual({ value: -3, unit: "em" });
    expect(parseCSSValue("50%")).toEqual({ value: 50, unit: "%" });
  });

  it("defaults to px when no unit is present", () => {
    expect(parseCSSValue("10")).toEqual({ value: 10, unit: "px" });
  });

  it("trims and lowercases the unit", () => {
    expect(parseCSSValue("  20VH  ")).toEqual({ value: 20, unit: "vh" });
  });

  it("returns null for non-numeric input", () => {
    expect(parseCSSValue("auto")).toBeNull();
    expect(parseCSSValue("10foo")).toBeNull();
  });
});

describe("convertToPixels", () => {
  it("passes px straight through", () => {
    expect(convertToPixels("16px")).toBe(16);
  });

  it("scales rem/em by font sizes", () => {
    expect(convertToPixels("1rem")).toBe(16); // default root 16
    expect(convertToPixels("2rem", { rootFontSize: 10 })).toBe(20);
    expect(convertToPixels("1em", { parentFontSize: 20 })).toBe(20);
  });

  it("scales % by parentSize", () => {
    expect(convertToPixels("50%", { parentSize: 200 })).toBe(100);
  });

  it("scales viewport units", () => {
    expect(convertToPixels("50vh", { viewportHeight: 1000 })).toBe(500);
    expect(convertToPixels("50vw", { viewportWidth: 800 })).toBe(400);
    expect(convertToPixels("10vmin", { viewportWidth: 800, viewportHeight: 600 })).toBe(60);
    expect(convertToPixels("10vmax", { viewportWidth: 800, viewportHeight: 600 })).toBe(80);
  });

  it("converts physical units", () => {
    expect(convertToPixels("72pt")).toBeCloseTo(96);
    expect(convertToPixels("2.54cm")).toBeCloseTo(96);
    expect(convertToPixels("25.4mm")).toBeCloseTo(96);
    expect(convertToPixels("1in")).toBe(96);
  });

  it("accepts a pre-parsed CSSValue object", () => {
    expect(convertToPixels({ value: 3, unit: "px" })).toBe(3);
  });

  it("returns 0 when the value cannot be parsed", () => {
    expect(convertToPixels("auto")).toBe(0);
  });
});

describe("convertFromPixels", () => {
  it("is the inverse of convertToPixels for scalar units", () => {
    expect(convertFromPixels(16, "px")).toEqual({ value: 16, unit: "px" });
    expect(convertFromPixels(32, "rem")).toEqual({ value: 2, unit: "rem" });
    expect(convertFromPixels(96, "in")).toEqual({ value: 1, unit: "in" });
  });

  it("converts to % against parentSize", () => {
    expect(convertFromPixels(50, "%", { parentSize: 200 })).toEqual({ value: 25, unit: "%" });
  });

  it("converts to viewport units", () => {
    expect(convertFromPixels(500, "vh", { viewportHeight: 1000 })).toEqual({
      value: 50,
      unit: "vh",
    });
  });
});

describe("formatCSSValue", () => {
  it("rounds to the requested precision and appends the unit", () => {
    expect(formatCSSValue({ value: 1.23456, unit: "px" })).toBe("1.23px");
    expect(formatCSSValue({ value: 1.23456, unit: "rem" }, 1)).toBe("1.2rem");
    expect(formatCSSValue({ value: 10, unit: "%" }, 0)).toBe("10%");
  });
});
