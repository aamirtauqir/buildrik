/**
 * colorConversionBasic tests — RGB<->HEX, RGB<->HSL, RGB<->HWB round trips
 * and normalization edge cases.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { clampColor, rgbToHex, rgbToHsl, hslToRgb, rgbToHwb, hwbToRgb } from "../colorConversionBasic";
import type { RGBColor } from "../colorTypes";

describe("clampColor", () => {
  it("rounds and clamps into [0, max]", () => {
    expect(clampColor(-1)).toBe(0);
    expect(clampColor(255.4)).toBe(255);
    expect(clampColor(300)).toBe(255);
    expect(clampColor(0.6, 1)).toBe(1);
  });
});

describe("rgbToHex", () => {
  it("serializes 6-digit hex without alpha", () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe("#ff0000");
    expect(rgbToHex({ r: 45, g: 109, b: 255 })).toBe("#2d6dff");
  });

  it("appends alpha only when a < 1", () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0, a: 1 })).toBe("#ff0000");
    expect(rgbToHex({ r: 255, g: 0, b: 0, a: 0.5 })).toBe("#ff000080");
    expect(rgbToHex({ r: 0, g: 0, b: 0, a: 0 })).toBe("#00000000");
  });

  it("clamps out-of-range channels", () => {
    expect(rgbToHex({ r: 300, g: -5, b: 0 })).toBe("#ff0000");
  });
});

describe("rgbToHsl", () => {
  it("converts primaries to their canonical hues", () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50, a: undefined });
    expect(rgbToHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50, a: undefined });
    expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50, a: undefined });
  });

  it("treats achromatic colors as h=0 s=0", () => {
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toMatchObject({ h: 0, s: 0, l: 100 });
    expect(rgbToHsl({ r: 0, g: 0, b: 0 })).toMatchObject({ h: 0, s: 0, l: 0 });
    expect(rgbToHsl({ r: 128, g: 128, b: 128 })).toMatchObject({ h: 0, s: 0, l: 50 });
  });

  it("passes alpha through", () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0, a: 0.5 }).a).toBe(0.5);
  });
});

describe("hslToRgb", () => {
  it("converts canonical hues back to primaries", () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toMatchObject({ r: 255, g: 0, b: 0 });
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toMatchObject({ r: 0, g: 255, b: 0 });
    expect(hslToRgb({ h: 240, s: 100, l: 50 })).toMatchObject({ r: 0, g: 0, b: 255 });
  });

  it("returns gray for s=0 regardless of hue", () => {
    expect(hslToRgb({ h: 200, s: 0, l: 50 })).toMatchObject({ r: 128, g: 128, b: 128 });
  });

  it("round-trips rgbToHsl within rounding error", () => {
    const colors: RGBColor[] = [
      { r: 45, g: 109, b: 255 },
      { r: 12, g: 200, b: 99 },
      { r: 240, g: 240, b: 5 },
    ];
    for (const c of colors) {
      const back = hslToRgb(rgbToHsl(c));
      expect(Math.abs(back.r - c.r)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.g - c.g)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.b - c.b)).toBeLessThanOrEqual(2);
    }
  });
});

describe("rgbToHwb", () => {
  it("computes whiteness from min channel and blackness from max", () => {
    expect(rgbToHwb({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, w: 0, b: 0, a: undefined });
    expect(rgbToHwb({ r: 255, g: 255, b: 255 })).toMatchObject({ w: 100, b: 0 });
    expect(rgbToHwb({ r: 0, g: 0, b: 0 })).toMatchObject({ w: 0, b: 100 });
  });
});

describe("hwbToRgb", () => {
  it("zero whiteness/blackness returns the pure hue", () => {
    expect(hwbToRgb({ h: 0, w: 0, b: 0 })).toMatchObject({ r: 255, g: 0, b: 0 });
  });

  it("normalizes w + b >= 100% to a proportional gray", () => {
    const gray = hwbToRgb({ h: 120, w: 100, b: 100 }); // 0.5 / 0.5 after normalize
    expect(gray.r).toBe(gray.g);
    expect(gray.g).toBe(gray.b);
    expect(gray.r).toBe(128);
  });

  it("round-trips rgbToHwb within rounding error", () => {
    const c: RGBColor = { r: 45, g: 109, b: 255 };
    const back = hwbToRgb(rgbToHwb(c));
    expect(Math.abs(back.r - c.r)).toBeLessThanOrEqual(3);
    expect(Math.abs(back.g - c.g)).toBeLessThanOrEqual(3);
    expect(Math.abs(back.b - c.b)).toBeLessThanOrEqual(3);
  });
});
