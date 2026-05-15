/**
 * contrastFix — pure HSL darken/lighten helper for the lint Auto-fix path.
 *
 * The editor already ships `editor/design-system/utils/contrastFix.ts` which
 * does a full WCAG-AA binary search against a known background. That helper
 * still owns the "Fix all" affordance inside `ColorTokenList`.
 *
 * This engine-side helper is intentionally simpler: given a hint string
 * (`"darken-22"` / `"lighten-22"`) encoded into the LintIssue's
 * `autoFixHint`, produce a deterministic next hex by adjusting the L (HSL
 * lightness) channel by ±22%. Pure math, no dependency on the React-side
 * token registry or palette context, so it lives in `engine/` cleanly.
 *
 * @module engine/designSystem/contrastFix
 * @license BSD-3-Clause
 */

export type AutoFixHint = "darken-22" | "lighten-22";

const HEX_RE = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }

function hexToRgb(hex: string): RGB | null {
  const match = hex.match(HEX_RE);
  if (!match) return null;
  let h = match[1];
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h, s, l };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hueToRgb = (t: number): number => {
    let tn = t;
    if (tn < 0) tn += 1;
    if (tn > 1) tn -= 1;
    if (tn < 1 / 6) return p + (q - p) * 6 * tn;
    if (tn < 1 / 2) return q;
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
    return p;
  };
  const hn = h / 360;
  return {
    r: Math.round(hueToRgb(hn + 1 / 3) * 255),
    g: Math.round(hueToRgb(hn) * 255),
    b: Math.round(hueToRgb(hn - 1 / 3) * 255),
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Apply an auto-fix hint to a hex color. Adjusts HSL lightness by ±22%
 * (clamped to [0, 1]). Hue and saturation are preserved.
 *
 * Returns the input unchanged if:
 *   - hex is invalid
 *   - hint is not recognised
 */
export function applyContrastFix(hex: string, hint: AutoFixHint | string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  if (hint !== "darken-22" && hint !== "lighten-22") return hex;
  const hsl = rgbToHsl(rgb);
  const delta = 0.22;
  const nextL = hint === "darken-22"
    ? Math.max(0, hsl.l - delta)
    : Math.min(1, hsl.l + delta);
  return rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l: nextL })).toUpperCase();
}
