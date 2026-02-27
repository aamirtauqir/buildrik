/**
 * Basic Color Space Conversions
 * Convert between RGB, HSL, HWB, and HEX
 *
 * @module utils/parsers/colorConversionBasic
 * @license BSD-3-Clause
 */

import { clamp } from "../helpers";
import { RGBColor, HSLColor, HWBColor } from "./colorTypes";

/**
 * Clamp and round color component
 */
export function clampColor(value: number, max: number = 255): number {
  return Math.round(clamp(value, 0, max));
}

// =============================================================================
// RGB <-> HEX
// =============================================================================

/**
 * Convert RGB to hex string
 */
export function rgbToHex(rgb: RGBColor): string {
  const toHex = (n: number) => clampColor(n).toString(16).padStart(2, "0");
  const hex = `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  if (rgb.a !== undefined && rgb.a < 1) {
    return hex + toHex(Math.round(rgb.a * 255));
  }
  return hex;
}

// =============================================================================
// RGB <-> HSL
// =============================================================================

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGBColor): HSLColor {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a: rgb.a,
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSLColor): RGBColor {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: hsl.a,
  };
}

// =============================================================================
// RGB <-> HWB
// =============================================================================

/**
 * Convert RGB to HWB
 */
export function rgbToHwb(rgb: RGBColor): HWBColor {
  const hsl = rgbToHsl(rgb);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  return {
    h: hsl.h,
    w: Math.round(Math.min(r, g, b) * 100),
    b: Math.round((1 - Math.max(r, g, b)) * 100),
    a: rgb.a,
  };
}

/**
 * Convert HWB to RGB
 */
export function hwbToRgb(hwb: HWBColor): RGBColor {
  let w = hwb.w / 100;
  let b = hwb.b / 100;

  // Normalize if w + b > 1
  if (w + b >= 1) {
    const total = w + b;
    w = w / total;
    b = b / total;
  }

  // Convert via HSL with saturation and lightness derived from whiteness/blackness
  const hsl: HSLColor = {
    h: hwb.h,
    s: 100,
    l: 50,
  };

  const rgb = hslToRgb(hsl);
  const factor = 1 - w - b;

  return {
    r: Math.round(rgb.r * factor + w * 255),
    g: Math.round(rgb.g * factor + w * 255),
    b: Math.round(rgb.b * factor + w * 255),
    a: hwb.a,
  };
}
