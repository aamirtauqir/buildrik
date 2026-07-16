/**
 * colorConversionLab tests — LAB/LCH/OKLCH conversions: endpoints, hue
 * geometry, and round-trip stability.
 *
 * Note: THIS module linearizes sRGB with the 0.04045 spec threshold
 * (colorContrast uses 0.03928 — indistinguishable at 8-bit granularity).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  rgbToLab,
  labToRgb,
  labToLch,
  lchToLab,
  rgbToLch,
  lchToRgb,
  rgbToOklch,
  oklchToRgb,
} from "../colorConversionLab";
import type { RGBColor } from "../colorTypes";

const roundTripDelta = (a: RGBColor, b: RGBColor) =>
  Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));

describe("rgbToLab / labToRgb", () => {
  it("white maps to L≈100 with a/b ≈ 0", () => {
    const lab = rgbToLab({ r: 255, g: 255, b: 255 });
    expect(lab.l).toBeCloseTo(100, 0);
    expect(Math.abs(lab.a)).toBeLessThan(0.5);
    expect(Math.abs(lab.b)).toBeLessThan(0.5);
  });

  it("black maps to L≈0", () => {
    expect(rgbToLab({ r: 0, g: 0, b: 0 }).l).toBeCloseTo(0, 1);
  });

  it("round-trips representative colors within ±2 per channel", () => {
    const colors: RGBColor[] = [
      { r: 255, g: 0, b: 0 },
      { r: 45, g: 109, b: 255 },
      { r: 128, g: 128, b: 128 },
      { r: 10, g: 200, b: 90 },
    ];
    for (const c of colors) {
      expect(roundTripDelta(labToRgb(rgbToLab(c)), c)).toBeLessThanOrEqual(2);
    }
  });

  it("carries alpha through both directions", () => {
    expect(rgbToLab({ r: 10, g: 20, b: 30, a: 0.5 }).alpha).toBe(0.5);
    expect(labToRgb({ l: 50, a: 0, b: 0, alpha: 0.25 }).a).toBe(0.25);
  });
});

describe("labToLch / lchToLab", () => {
  it("computes chroma as the a/b hypotenuse and hue via atan2", () => {
    const lch = labToLch({ l: 50, a: 3, b: 4 });
    expect(lch.c).toBeCloseTo(5, 10);
    expect(lch.h).toBeCloseTo(Math.atan2(4, 3) * (180 / Math.PI), 10);
  });

  it("wraps negative hue angles into [0, 360)", () => {
    const lch = labToLch({ l: 50, a: 0, b: -5 });
    expect(lch.h).toBeCloseTo(270, 10);
  });

  it("achromatic lab has zero chroma", () => {
    expect(labToLch({ l: 50, a: 0, b: 0 }).c).toBe(0);
  });

  it("round-trips lch → lab → lch", () => {
    const lab = lchToLab({ l: 60, c: 40, h: 120 });
    const back = labToLch(lab);
    expect(back.l).toBeCloseTo(60, 10);
    expect(back.c).toBeCloseTo(40, 10);
    expect(back.h).toBeCloseTo(120, 10);
  });
});

describe("rgbToLch / lchToRgb", () => {
  it("round-trips within ±2 per channel", () => {
    const c: RGBColor = { r: 45, g: 109, b: 255 };
    expect(roundTripDelta(lchToRgb(rgbToLch(c)), c)).toBeLessThanOrEqual(2);
  });

  it("achromatic lch produces gray", () => {
    const gray = lchToRgb({ l: 50, c: 0, h: 0 });
    expect(gray.r).toBe(gray.g);
    expect(gray.g).toBe(gray.b);
  });
});

describe("rgbToOklch / oklchToRgb", () => {
  it("white maps to L≈1 with near-zero chroma", () => {
    const ok = rgbToOklch({ r: 255, g: 255, b: 255 });
    expect(ok.l).toBeCloseTo(1, 3);
    expect(ok.c).toBeLessThan(0.001);
  });

  it("black maps to L≈0", () => {
    expect(rgbToOklch({ r: 0, g: 0, b: 0 }).l).toBeCloseTo(0, 5);
  });

  it("round-trips representative colors within ±2 per channel", () => {
    const colors: RGBColor[] = [
      { r: 255, g: 0, b: 0 },
      { r: 45, g: 109, b: 255 },
      { r: 200, g: 200, b: 10 },
    ];
    for (const c of colors) {
      expect(roundTripDelta(oklchToRgb(rgbToOklch(c)), c)).toBeLessThanOrEqual(2);
    }
  });

  it("carries alpha through both directions", () => {
    expect(rgbToOklch({ r: 1, g: 2, b: 3, a: 0.7 }).alpha).toBe(0.7);
    expect(oklchToRgb({ l: 0.5, c: 0, h: 0, alpha: 0.7 }).a).toBe(0.7);
  });
});
