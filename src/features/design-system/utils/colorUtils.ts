/**
 * Color utility functions — pure math, no side effects, no JSX
 * @license BSD-3-Clause
 */

import type { ColorHSB, WcagLevel } from "../types";

// ─── Hex parsing ─────────────────────────────────────────────────────────────

/** Expand shorthand hex (#rgb or #rgba) to 6/8 char form */
export function expandShorthand(hex: string): string {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  if (h.length === 3) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  if (h.length === 4) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  return hex.startsWith("#") ? hex : `#${hex}`;
}

/** Returns true if hex is a valid 3, 4, 6, or 8 char hex color */
export function isValidHex(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(hex);
}

/**
 * Convert hex color string to RGBA components (0–255 each, alpha 0–1).
 * Returns null if input is invalid.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number; a: number } | null {
  const full = expandShorthand(hex);
  const match = full.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})?$/);
  if (!match) return null;
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
    a: match[4] !== undefined ? parseInt(match[4], 16) / 255 : 1,
  };
}

// ─── HSB conversion ───────────────────────────────────────────────────────────

/** Convert hex to HSB (hue 0–360, saturation 0–1, brightness 0–1, alpha 0–1) */
export function hexToHsb(hex: string): ColorHSB {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 0, s: 0, b: 0, a: 1 };

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  const brightness = max;

  return { h, s, b: brightness, a: rgb.a };
}

/** Convert HSB to 6-digit hex (alpha ignored, handles separately) */
export function hsbToHex(hsb: ColorHSB): string {
  const { h, s, b: brightness, a } = hsb;

  const c = brightness * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = brightness - c;

  let r = 0,
    g = 0,
    bl = 0;
  if (h < 60) {
    r = c;
    g = x;
    bl = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    bl = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    bl = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    bl = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    bl = c;
  } else {
    r = c;
    g = 0;
    bl = x;
  }

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  const alphaHex =
    a < 1
      ? Math.round(a * 255)
          .toString(16)
          .padStart(2, "0")
      : "";
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}${alphaHex}`.toUpperCase();
}

// ─── WCAG contrast ────────────────────────────────────────────────────────────

/** Relative luminance per WCAG 2.1 spec */
export function relativeLuminance(r: number, g: number, b: number): number {
  const linearize = (v: number) => {
    const sRGB = v / 255;
    return sRGB <= 0.04045 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Contrast ratio between two hex colors (WCAG 2.1 formula).
 * Returns a value between 1 and 21.
 * Returns 1 if either color is invalid.
 */
export function calcContrastRatio(foreground: string, background: string): number {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  if (!fg || !bg) return 1;

  const l1 = relativeLuminance(fg.r, fg.g, fg.b);
  const l2 = relativeLuminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG 2.1 level for foreground/background combination.
 * - 'aaa'      — contrast ≥ 7:1  (text, all sizes)
 * - 'aa'       — contrast ≥ 4.5:1 (normal text)
 * - 'aa-large' — contrast ≥ 3:1  (large text / UI components)
 * - 'fail'     — contrast < 3:1
 * - 'na'       — background has alpha < 0.8 (can't reliably measure)
 */
export function calcWcagLevel(foreground: string, background: string): WcagLevel {
  const bg = hexToRgb(background);
  if (bg && bg.a < 0.8) return "na";

  const ratio = calcContrastRatio(foreground, background);
  if (ratio >= 7) return "aaa";
  if (ratio >= 4.5) return "aa";
  if (ratio >= 3) return "aa-large";
  return "fail";
}

/** Human-readable tooltip text for a WCAG level */
export function wcagTooltip(level: WcagLevel): string {
  switch (level) {
    case "aaa":
      return "Passes AAA — excellent contrast (≥7:1) for all text sizes";
    case "aa":
      return "Passes AA — meets minimum contrast (≥4.5:1) for normal text";
    case "aa-large":
      return "Passes AA for large text only (≥3:1). Use 18px+ or bold text";
    case "fail":
      return "Fails WCAG — contrast too low. Avoid using this color combination";
    case "na":
      return "Cannot measure — background has transparency";
  }
}
