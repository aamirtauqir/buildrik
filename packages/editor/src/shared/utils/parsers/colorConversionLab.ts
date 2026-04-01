/**
 * LAB/LCH/OKLCH Color Space Conversions
 * Advanced perceptual color space conversions
 *
 * @module utils/parsers/colorConversionLab
 * @license BSD-3-Clause
 */

import { clamp } from "../helpers";
import { RGBColor, LABColor, LCHColor, OKLCHColor } from "./colorTypes";

/**
 * Clamp and round color component
 */
function clampColor(value: number, max: number = 255): number {
  return Math.round(clamp(value, 0, max));
}

// D65 reference white
const D65 = { x: 0.95047, y: 1.0, z: 1.08883 };

// =============================================================================
// RGB <-> XYZ (Intermediate for LAB)
// =============================================================================

/**
 * Convert RGB to XYZ (intermediate for LAB)
 */
function rgbToXyz(rgb: RGBColor): { x: number; y: number; z: number } {
  // sRGB to linear RGB
  const toLinear = (c: number) => {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  // Linear RGB to XYZ (sRGB D65)
  return {
    x: r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    y: r * 0.2126729 + g * 0.7151522 + b * 0.072175,
    z: r * 0.0193339 + g * 0.119192 + b * 0.9503041,
  };
}

/**
 * Convert XYZ to RGB
 */
function xyzToRgb(xyz: { x: number; y: number; z: number }): RGBColor {
  // XYZ to linear RGB
  const r = xyz.x * 3.2404542 + xyz.y * -1.5371385 + xyz.z * -0.4985314;
  const g = xyz.x * -0.969266 + xyz.y * 1.8760108 + xyz.z * 0.041556;
  const b = xyz.x * 0.0556434 + xyz.y * -0.2040259 + xyz.z * 1.0572252;

  // Linear RGB to sRGB
  const toSrgb = (c: number) => {
    c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return clampColor(c * 255);
  };

  return { r: toSrgb(r), g: toSrgb(g), b: toSrgb(b) };
}

// =============================================================================
// RGB <-> LAB
// =============================================================================

/**
 * Convert RGB to LAB
 */
export function rgbToLab(rgb: RGBColor): LABColor {
  const xyz = rgbToXyz(rgb);

  const f = (t: number) => (t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116);

  const x = f(xyz.x / D65.x);
  const y = f(xyz.y / D65.y);
  const z = f(xyz.z / D65.z);

  return {
    l: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
    alpha: rgb.a,
  };
}

/**
 * Convert LAB to RGB
 */
export function labToRgb(lab: LABColor): RGBColor {
  const y = (lab.l + 16) / 116;
  const x = lab.a / 500 + y;
  const z = y - lab.b / 200;

  const f = (t: number) => {
    const t3 = t * t * t;
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
  };

  const xyz = {
    x: D65.x * f(x),
    y: D65.y * f(y),
    z: D65.z * f(z),
  };

  const rgb = xyzToRgb(xyz);
  return { ...rgb, a: lab.alpha };
}

// =============================================================================
// LAB <-> LCH
// =============================================================================

/**
 * Convert LAB to LCH
 */
export function labToLch(lab: LABColor): LCHColor {
  const c = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let h = Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  if (h < 0) h += 360;

  return { l: lab.l, c, h, alpha: lab.alpha };
}

/**
 * Convert LCH to LAB
 */
export function lchToLab(lch: LCHColor): LABColor {
  const hRad = lch.h * (Math.PI / 180);
  return {
    l: lch.l,
    a: lch.c * Math.cos(hRad),
    b: lch.c * Math.sin(hRad),
    alpha: lch.alpha,
  };
}

// =============================================================================
// RGB <-> LCH
// =============================================================================

/**
 * Convert RGB to LCH
 */
export function rgbToLch(rgb: RGBColor): LCHColor {
  return labToLch(rgbToLab(rgb));
}

/**
 * Convert LCH to RGB
 */
export function lchToRgb(lch: LCHColor): RGBColor {
  return labToRgb(lchToLab(lch));
}

// =============================================================================
// RGB <-> OKLCH
// =============================================================================

/**
 * Convert RGB to OKLCH (perceptually uniform)
 */
export function rgbToOklch(rgb: RGBColor): OKLCHColor {
  // RGB to linear sRGB
  const toLinear = (c: number) => {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  // Linear sRGB to OKLab
  const l_ = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m_ = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s_ = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l = Math.cbrt(l_);
  const m = Math.cbrt(m_);
  const s = Math.cbrt(s_);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bOk = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  // OKLab to OKLCH
  const C = Math.sqrt(a * a + bOk * bOk);
  let h = Math.atan2(bOk, a) * (180 / Math.PI);
  if (h < 0) h += 360;

  return { l: L, c: C, h, alpha: rgb.a };
}

/**
 * Convert OKLCH to RGB
 */
export function oklchToRgb(oklch: OKLCHColor): RGBColor {
  // OKLCH to OKLab
  const hRad = oklch.h * (Math.PI / 180);
  const a = oklch.c * Math.cos(hRad);
  const b = oklch.c * Math.sin(hRad);

  // OKLab to linear sRGB
  const l_ = oklch.l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = oklch.l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = oklch.l - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bRgb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  // Linear sRGB to sRGB
  const toSrgb = (c: number) => {
    c = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return clampColor(c * 255);
  };

  return { r: toSrgb(r), g: toSrgb(g), b: toSrgb(bRgb), a: oklch.alpha };
}
