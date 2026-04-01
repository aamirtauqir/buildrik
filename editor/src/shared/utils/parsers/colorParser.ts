/**
 * Color Parsing Utilities
 * Parse colors from various CSS formats
 *
 * @module utils/parsers/colorParser
 * @license BSD-3-Clause
 */

import { clamp } from "../helpers";
import { hslToRgb, hwbToRgb, labToRgb, lchToRgb, oklchToRgb } from "./colorConversion";
import { RGBColor, NAMED_COLORS } from "./colorTypes";

// =============================================================================
// COLOR PARSING
// =============================================================================

/**
 * Parse color string to RGB object
 * Supports: hex, rgb, rgba, hsl, hsla, hwb, lab, lch, oklch, named colors
 */
export function parseColor(color: string): RGBColor | null {
  if (!color) return null;

  const trimmed = color.trim().toLowerCase();

  // Named colors
  if (NAMED_COLORS[trimmed]) {
    if (trimmed === "currentcolor") return null;
    return parseColor(NAMED_COLORS[trimmed]);
  }

  // Hex color (#rgb, #rgba, #rrggbb, #rrggbbaa)
  const hexMatch = trimmed.match(/^#([0-9a-f]{3,8})$/i);
  if (hexMatch) {
    return parseHexColor(hexMatch[1]);
  }

  // Modern RGB: rgb(255 0 0) or rgb(255 0 0 / 50%) or rgb(100% 0% 0%)
  const modernRgbMatch = trimmed.match(
    /rgba?\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)(?:\s*\/\s*([\d.]+%?))?\s*\)/
  );
  if (modernRgbMatch) {
    return {
      r: parseColorValue(modernRgbMatch[1], 255),
      g: parseColorValue(modernRgbMatch[2], 255),
      b: parseColorValue(modernRgbMatch[3], 255),
      a: modernRgbMatch[4] ? parseColorValue(modernRgbMatch[4], 1) : undefined,
    };
  }

  // Legacy RGB: rgb(255, 0, 0) or rgba(255, 0, 0, 0.5)
  const legacyRgbMatch = trimmed.match(
    /rgba?\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)(?:\s*,\s*([\d.]+%?))?\s*\)/
  );
  if (legacyRgbMatch) {
    return {
      r: parseColorValue(legacyRgbMatch[1], 255),
      g: parseColorValue(legacyRgbMatch[2], 255),
      b: parseColorValue(legacyRgbMatch[3], 255),
      a: legacyRgbMatch[4] ? parseColorValue(legacyRgbMatch[4], 1) : undefined,
    };
  }

  // Modern HSL: hsl(120 100% 50%) or hsl(120 100% 50% / 50%)
  const modernHslMatch = trimmed.match(
    /hsla?\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%(?:\s*\/\s*([\d.]+%?))?\s*\)/
  );
  if (modernHslMatch) {
    return hslToRgb({
      h: parseFloat(modernHslMatch[1]),
      s: parseFloat(modernHslMatch[2]),
      l: parseFloat(modernHslMatch[3]),
      a: modernHslMatch[4] ? parseColorValue(modernHslMatch[4], 1) : undefined,
    });
  }

  // Legacy HSL: hsl(120, 100%, 50%) or hsla(120, 100%, 50%, 0.5)
  const legacyHslMatch = trimmed.match(
    /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+%?))?\s*\)/
  );
  if (legacyHslMatch) {
    return hslToRgb({
      h: parseFloat(legacyHslMatch[1]),
      s: parseFloat(legacyHslMatch[2]),
      l: parseFloat(legacyHslMatch[3]),
      a: legacyHslMatch[4] ? parseColorValue(legacyHslMatch[4], 1) : undefined,
    });
  }

  // HWB: hwb(120 10% 20%) or hwb(120 10% 20% / 50%)
  const hwbMatch = trimmed.match(
    /hwb\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%(?:\s*\/\s*([\d.]+%?))?\s*\)/
  );
  if (hwbMatch) {
    return hwbToRgb({
      h: parseFloat(hwbMatch[1]),
      w: parseFloat(hwbMatch[2]),
      b: parseFloat(hwbMatch[3]),
      a: hwbMatch[4] ? parseColorValue(hwbMatch[4], 1) : undefined,
    });
  }

  // LAB: lab(50% 40 59.5) or lab(50% 40 59.5 / 50%)
  const labMatch = trimmed.match(
    /lab\(\s*([\d.]+)%?\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/
  );
  if (labMatch) {
    return labToRgb({
      l: parseFloat(labMatch[1]),
      a: parseFloat(labMatch[2]),
      b: parseFloat(labMatch[3]),
      alpha: labMatch[4] ? parseColorValue(labMatch[4], 1) : undefined,
    });
  }

  // LCH: lch(50% 30 120) or lch(50% 30 120 / 50%)
  const lchMatch = trimmed.match(
    /lch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/
  );
  if (lchMatch) {
    return lchToRgb({
      l: parseFloat(lchMatch[1]),
      c: parseFloat(lchMatch[2]),
      h: parseFloat(lchMatch[3]),
      alpha: lchMatch[4] ? parseColorValue(lchMatch[4], 1) : undefined,
    });
  }

  // OKLCH: oklch(0.7 0.15 180) or oklch(70% 0.15 180 / 50%)
  const oklchMatch = trimmed.match(
    /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/
  );
  if (oklchMatch) {
    let l = parseFloat(oklchMatch[1]);
    if (oklchMatch[1].endsWith("%") || l > 1) l = l / 100;
    return oklchToRgb({
      l,
      c: parseFloat(oklchMatch[2]),
      h: parseFloat(oklchMatch[3]),
      alpha: oklchMatch[4] ? parseColorValue(oklchMatch[4], 1) : undefined,
    });
  }

  return null;
}

/**
 * Parse hex color string
 */
export function parseHexColor(hex: string): RGBColor | null {
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }
  if (hex.length === 4) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
      a: parseInt(hex[3] + hex[3], 16) / 255,
    };
  }
  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  if (hex.length === 8) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: parseInt(hex.slice(6, 8), 16) / 255,
    };
  }
  return null;
}

/**
 * Parse color value (handles percentages)
 * Uses centralized clamp from helpers.ts
 */
export function parseColorValue(value: string, max: number): number {
  if (value.endsWith("%")) {
    return clamp((parseFloat(value) / 100) * max, 0, max);
  }
  return clamp(parseFloat(value), 0, max);
}

/**
 * Clamp and round color component
 * Uses centralized clamp from helpers.ts
 */
export function clampColor(value: number, max: number = 255): number {
  return Math.round(clamp(value, 0, max));
}

/**
 * Ensure color is RGBColor
 */
export function ensureRgb(color: RGBColor | string): RGBColor | null {
  return typeof color === "string" ? parseColor(color) : color;
}

/**
 * Check if color string is valid
 */
export function isValidColor(color: string): boolean {
  return parseColor(color) !== null;
}
