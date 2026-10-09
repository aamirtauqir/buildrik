/**
 * colorMath — hex parsing, HSB conversion, WCAG contrast and the ONE
 * contrast fix (DQ-010).
 *
 * There were two "fix this colour's contrast" algorithms: the engine's lint
 * Auto-fix shifted HSL lightness by a fixed ±22% and never checked the result
 * (measured live: #EEEEEE → #B6B6B6, still ~2:1), and the Brand "Fix all"
 * binary-searched to WCAG AA. The search lives here, in the engine, so the
 * lint path (engine) and the Brand UI (editor) both import it — editor may
 * import engine, the reverse is banned, which is why the copy existed.
 *
 * Pure math, no side effects.
 *
 * @module engine/designSystem/colorMath
 * @license BSD-3-Clause
 */

import type { ColorHSB } from "./types";

// ─── Hex parsing ─────────────────────────────────────────────────────────────

/** Expand shorthand hex (#rgb or #rgba) to 6/8 char form */
export function expandShorthand(hex: string): string {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  if (h.length === 3) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  if (h.length === 4) return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  return hex.startsWith("#") ? hex : `#${hex}`;
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

// ─── Contrast fix ─────────────────────────────────────────────────────────────

/** Target contrast ratio for WCAG AA normal text */
const AA_TARGET = 4.5;

/**
 * Suggest a foreground color adjusted to meet a target contrast ratio against the given background.
 * Lightens or darkens the foreground while preserving hue and saturation.
 * Returns null if already meeting the target.
 */
export function suggestContrastFix(
  foreground: string,
  background: string,
  targetRatio: number = AA_TARGET
): string | null {
  const current = calcContrastRatio(foreground, background);
  if (current >= targetRatio) return null;

  const hsb = hexToHsb(foreground);
  const bgHsb = hexToHsb(background);
  const bgIsDark = bgHsb.b < 0.5;

  // Binary search for the minimum brightness adjustment that meets the target
  let lo = bgIsDark ? hsb.b : 0;
  let hi = bgIsDark ? 1 : hsb.b;

  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const candidate = hsbToHex({ ...hsb, b: mid });
    const ratio = calcContrastRatio(candidate, background);
    if (ratio >= targetRatio) {
      if (bgIsDark) hi = mid;
      else lo = mid;
    } else {
      if (bgIsDark) lo = mid;
      else hi = mid;
    }
  }

  const result = hsbToHex({ ...hsb, b: bgIsDark ? hi : lo });
  // Verify fix actually works
  if (calcContrastRatio(result, background) < targetRatio) return null;
  return result;
}
