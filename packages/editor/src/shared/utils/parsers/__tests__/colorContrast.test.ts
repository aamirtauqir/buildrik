/**
 * colorContrast tests — pins THIS module's WCAG luminance/contrast behavior.
 *
 * Audit note: this module linearizes sRGB with the 0.03928 threshold (the
 * original WCAG 2.x published constant); a drifted copy in
 * ai/AccessibilityChecker uses the same 0.03928, while colorConversionLab
 * uses 0.04045 (the sRGB spec value). For 8-bit channels the two thresholds
 * are indistinguishable (10/255 ≈ 0.0392 sits below both, 11/255 ≈ 0.0431
 * above both) — these tests pin the piecewise behavior by formula so any
 * change to EITHER branch fails loudly.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  getLuminance,
  getContrastRatio,
  meetsContrastAA,
  meetsContrastAAA,
  getContrastTextColor,
  ensureContrast,
  isLightColor,
  isDarkColor,
} from "../colorContrast";

describe("getLuminance", () => {
  it("pins the endpoints: black = 0, white = 1", () => {
    expect(getLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(getLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 10);
  });

  it("pins the WCAG coefficients via pure channels", () => {
    expect(getLuminance({ r: 255, g: 0, b: 0 })).toBeCloseTo(0.2126, 10);
    expect(getLuminance({ r: 0, g: 255, b: 0 })).toBeCloseTo(0.7152, 10);
    expect(getLuminance({ r: 0, g: 0, b: 255 })).toBeCloseTo(0.0722, 10);
  });

  it("uses the LINEAR branch for channel 10 (v <= threshold)", () => {
    expect(getLuminance({ r: 10, g: 10, b: 10 })).toBeCloseTo((10 / 255) / 12.92, 12);
  });

  it("uses the POWER branch for channel 11 (v > threshold)", () => {
    expect(getLuminance({ r: 11, g: 11, b: 11 })).toBeCloseTo(
      Math.pow((11 / 255 + 0.055) / 1.055, 2.4),
      12
    );
  });

  it("accepts color strings and returns 0 for unparseable input", () => {
    expect(getLuminance("#ffffff")).toBeCloseTo(1, 10);
    expect(getLuminance("junk")).toBe(0);
  });
});

describe("getContrastRatio", () => {
  it("black on white is exactly 21:1; same color is 1:1", () => {
    expect(getContrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 10);
    expect(getContrastRatio("#2D6DFF", "#2D6DFF")).toBeCloseTo(1, 10);
  });

  it("is symmetric in its arguments", () => {
    expect(getContrastRatio("#2D6DFF", "#ffffff")).toBeCloseTo(
      getContrastRatio("#ffffff", "#2D6DFF"),
      10
    );
  });

  it("pins the classic #767676-on-white ratio (~4.54:1)", () => {
    expect(getContrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });
});

describe("meetsContrastAA / meetsContrastAAA", () => {
  it("AA normal text needs 4.5:1 — #767676 passes, #777777 fails on white", () => {
    expect(meetsContrastAA("#767676", "#ffffff")).toBe(true);
    expect(meetsContrastAA("#777777", "#ffffff")).toBe(false);
  });

  it("AA large text relaxes to 3:1", () => {
    expect(meetsContrastAA("#777777", "#ffffff", true)).toBe(true);
  });

  it("AAA normal text needs 7:1", () => {
    expect(meetsContrastAAA("#000000", "#ffffff")).toBe(true);
    expect(meetsContrastAAA("#767676", "#ffffff")).toBe(false);
  });

  it("AAA large text relaxes to 4.5:1", () => {
    expect(meetsContrastAAA("#767676", "#ffffff", true)).toBe(true);
  });
});

describe("getContrastTextColor", () => {
  it("returns black text on light backgrounds, white on dark", () => {
    expect(getContrastTextColor("#ffffff")).toEqual({ r: 0, g: 0, b: 0 });
    expect(getContrastTextColor("#000000")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("pins the 0.179 luminance threshold around mid-grays", () => {
    // #767676 → L ≈ 0.181 (> 0.179) → black text
    expect(getContrastTextColor("#767676")).toEqual({ r: 0, g: 0, b: 0 });
    // #6e6e6e → L ≈ 0.156 (< 0.179) → white text
    expect(getContrastTextColor("#6e6e6e")).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe("ensureContrast", () => {
  it("returns the color unchanged when contrast already suffices", () => {
    expect(ensureContrast("#000000", "#ffffff")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("adjusts a low-contrast color until it meets the minimum ratio", () => {
    const adjusted = ensureContrast("#dddddd", "#ffffff", 4.5);
    expect(getContrastRatio(adjusted, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("falls back to black for unparseable input", () => {
    expect(ensureContrast("junk", "#ffffff")).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe("isLightColor / isDarkColor", () => {
  it("splits at luminance 0.5 and the two are complements", () => {
    expect(isLightColor("#ffffff")).toBe(true);
    expect(isLightColor("#777777")).toBe(false); // L ≈ 0.185
    expect(isDarkColor("#000000")).toBe(true);
    expect(isDarkColor("#ffffff")).toBe(false);
  });
});
