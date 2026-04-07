/**
 * Color Formatting Utilities
 * Format colors to CSS strings
 *
 * @module utils/parsers/colorFormat
 * @license BSD-3-Clause
 */

import { RGBColor, HSLColor, HWBColor, LABColor, LCHColor, OKLCHColor } from "./colorTypes";

// =============================================================================
// COLOR FORMATTING
// =============================================================================

/**
 * Format RGB as CSS string
 */
export function rgbToString(rgb: RGBColor, modern: boolean = false): string {
  if (modern) {
    if (rgb.a !== undefined && rgb.a < 1) {
      return `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${rgb.a})`;
    }
    return `rgb(${rgb.r} ${rgb.g} ${rgb.b})`;
  }
  if (rgb.a !== undefined && rgb.a < 1) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`;
  }
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * Format HSL as CSS string
 */
export function hslToString(hsl: HSLColor, modern: boolean = false): string {
  if (modern) {
    if (hsl.a !== undefined && hsl.a < 1) {
      return `hsl(${hsl.h} ${hsl.s}% ${hsl.l}% / ${hsl.a})`;
    }
    return `hsl(${hsl.h} ${hsl.s}% ${hsl.l}%)`;
  }
  if (hsl.a !== undefined && hsl.a < 1) {
    return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a})`;
  }
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * Format HWB as CSS string
 */
export function hwbToString(hwb: HWBColor): string {
  if (hwb.a !== undefined && hwb.a < 1) {
    return `hwb(${hwb.h} ${hwb.w}% ${hwb.b}% / ${hwb.a})`;
  }
  return `hwb(${hwb.h} ${hwb.w}% ${hwb.b}%)`;
}

/**
 * Format LAB as CSS string
 */
export function labToString(lab: LABColor): string {
  if (lab.alpha !== undefined && lab.alpha < 1) {
    return `lab(${lab.l}% ${lab.a} ${lab.b} / ${lab.alpha})`;
  }
  return `lab(${lab.l}% ${lab.a} ${lab.b})`;
}

/**
 * Format LCH as CSS string
 */
export function lchToString(lch: LCHColor): string {
  if (lch.alpha !== undefined && lch.alpha < 1) {
    return `lch(${lch.l}% ${lch.c} ${lch.h} / ${lch.alpha})`;
  }
  return `lch(${lch.l}% ${lch.c} ${lch.h})`;
}

/**
 * Format OKLCH as CSS string
 */
export function oklchToString(oklch: OKLCHColor): string {
  const l = Math.round(oklch.l * 100) / 100;
  const c = Math.round(oklch.c * 1000) / 1000;
  if (oklch.alpha !== undefined && oklch.alpha < 1) {
    return `oklch(${l} ${c} ${oklch.h} / ${oklch.alpha})`;
  }
  return `oklch(${l} ${c} ${oklch.h})`;
}
