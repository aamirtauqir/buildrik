import { describe, it, expect } from "vitest";
import { applyContrastFix } from "../contrastFix";

describe("applyContrastFix", () => {
  it("darkens a mid-tone hex", () => {
    const before = "#888888";
    const after = applyContrastFix(before, "darken-22");
    expect(after).not.toBe(before);
    // mid-grey (53%) - 22% = 31% lightness ≈ ~#4F4F4F territory
    const num = parseInt(after.slice(1, 7), 16);
    expect(num).toBeLessThan(parseInt("888888", 16));
  });

  it("lightens a mid-tone hex", () => {
    const before = "#444444";
    const after = applyContrastFix(before, "lighten-22");
    const num = parseInt(after.slice(1, 7), 16);
    expect(num).toBeGreaterThan(parseInt("444444", 16));
  });

  it("preserves hue (still bluish after darken)", () => {
    const before = "#2D6DFF"; // cobalt
    const after = applyContrastFix(before, "darken-22");
    // Blue channel still dominates
    const r = parseInt(after.slice(1, 3), 16);
    const g = parseInt(after.slice(3, 5), 16);
    const b = parseInt(after.slice(5, 7), 16);
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });

  it("returns input unchanged for invalid hex", () => {
    expect(applyContrastFix("not-a-color", "darken-22")).toBe("not-a-color");
  });

  it("returns input unchanged for unknown hint", () => {
    expect(applyContrastFix("#888888", "rotate-hue" as never)).toBe("#888888");
  });

  it("accepts shorthand hex", () => {
    const after = applyContrastFix("#888", "darken-22");
    expect(after).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("clamps darken to 0", () => {
    const after = applyContrastFix("#000000", "darken-22");
    expect(after).toBe("#000000");
  });

  it("clamps lighten to 1", () => {
    const after = applyContrastFix("#FFFFFF", "lighten-22");
    expect(after).toBe("#FFFFFF");
  });
});
