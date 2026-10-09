/**
 * The lint Auto-fix resolves through the ONE contrast algorithm (DQ-010).
 *
 * The old hints shifted HSL lightness by ±22% and never checked the result:
 * #EEEEEE on white became #B6B6B6, still ~2:1, and Fix › called it fixed.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { applyContrastFix, contrastHint, setHint } from "../contrastFix";
import { calcContrastRatio } from "../colorMath";

describe("applyContrastFix", () => {
  it("a contrast hint reaches WCAG AA against its surface", () => {
    const after = applyContrastFix("#EEEEEE", contrastHint("#FFFFFF"));
    expect(calcContrastRatio(after, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });

  it("a contrast hint lightens on a dark surface", () => {
    const after = applyContrastFix("#444444", contrastHint("#111111"));
    expect(calcContrastRatio(after, "#111111")).toBeGreaterThanOrEqual(4.5);
    expect(parseInt(after.slice(1, 7), 16)).toBeGreaterThan(parseInt("444444", 16));
  });

  it("preserves hue (still bluish after the fix)", () => {
    const after = applyContrastFix("#93B4FF", contrastHint("#FFFFFF"));
    const r = parseInt(after.slice(1, 3), 16);
    const g = parseInt(after.slice(3, 5), 16);
    const b = parseInt(after.slice(5, 7), 16);
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });

  it("leaves a value that already passes alone", () => {
    expect(applyContrastFix("#111827", contrastHint("#FFFFFF"))).toBe("#111827");
  });

  it("a set hint replaces the value", () => {
    expect(applyContrastFix("#000000", setHint("#111827"))).toBe("#111827");
  });

  it("returns the input for an invalid colour, an invalid surface or an unknown hint", () => {
    expect(applyContrastFix("not-a-color", contrastHint("#FFFFFF"))).toBe("not-a-color");
    expect(applyContrastFix("#888888", contrastHint("nope"))).toBe("#888888");
    expect(applyContrastFix("#888888", "darken-22")).toBe("#888888");
  });
});
