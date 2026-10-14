/**
 * Color utility functions — pure math, no side effects, no JSX
 * @license BSD-3-Clause
 */

import { palette } from "@/themes/tokens.generated";
import type { WcagLevel } from "../types";
import { calcContrastRatio, expandShorthand, hexToHsb, hexToRgb, hsbToHex, relativeLuminance } from "@/engine/designSystem/colorMath";

// ─── Hex parsing ─────────────────────────────────────────────────────────────

/** Returns true if hex is a valid 3, 4, 6, or 8 char hex color */
export function isValidHex(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(hex);
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

// ─── Dark-mode shade suggestions (G3-146, board 7318:80995) ──────────────────

export interface DarkShadeSuggestion {
  hex: string;
  label: string;
  /** Contrast against the surface the shade will sit on in dark mode. */
  contrast: number;
}

const DARK_SURFACE = "#111827";

/* Board 7318:80995 names its options as palette steps ("#76A9FA · Blue
   400"). When the light colour IS a palette step, the options are steps of
   its own family: an ink/accent lifts ~300 lighter (then 400, then 200 —
   Blue 700 → 400, 300, 500); a light surface drops to the family's darkest
   (900, 800, 700). Off-palette colours keep the computed shades below. */
const PALETTE_STEPS = Object.entries(palette).map(([key, hex]) => {
  const [family, step] = key.split("-");
  return { family, step: Number(step), hex: hex.toUpperCase() };
});

function paletteSteps(lightHex: string, isSurface: boolean): Array<{ hex: string; label: string }> | null {
  const hex = expandShorthand(lightHex).toUpperCase();
  const own = PALETTE_STEPS.find((p) => p.hex === hex);
  if (!own) return null;
  const target = isSurface ? 900 : own.step - 300;
  const picks = PALETTE_STEPS.filter((p) => p.family === own.family && (isSurface ? p.step > own.step : p.step < own.step))
    .sort((a, b) => Math.abs(a.step - target) - Math.abs(b.step - target) || a.step - b.step)
    .slice(0, 3);
  if (picks.length < 3) return null;
  const family = own.family.charAt(0).toUpperCase() + own.family.slice(1);
  return picks.map((p) => ({ hex: p.hex, label: `${family} ${p.step}` }));
}
const LIGHT_INK = "#F9FAFB";

/**
 * Three dark-mode values for a light-mode colour — named palette steps when
 * the colour is a palette step (see paletteSteps). An ink or accent colour
 * lifts (brighter, softer) so it reads on a dark surface; a light surface
 * colour inverts to a dark one. Contrast is measured where the shade will
 * be used: a lifted colour against the dark surface, an inverted surface
 * against light ink.
 */
export function darkShadeSuggestions(lightHex: string): DarkShadeSuggestion[] {
  const base = hexToHsb(expandShorthand(lightHex));
  const rgb = hexToRgb(expandShorthand(lightHex));
  const isSurface = rgb ? relativeLuminance(rgb.r, rgb.g, rgb.b) > 0.6 : false;
  const named = paletteSteps(lightHex, isSurface);
  if (named) {
    return named.map(({ hex, label }) => ({
      hex,
      label,
      contrast: calcContrastRatio(isSurface ? LIGHT_INK : hex, isSurface ? hex : DARK_SURFACE),
    }));
  }
  const steps: Array<[string, number, number]> = isSurface
    ? [["Recommended", 0.6, 0.16], ["Deeper", 0.5, 0.1], ["Softer", 0.7, 0.24]]
    : [["Recommended", 0.7, 0.97], ["Softer", 0.5, 0.98], ["Stronger", 0.85, 0.94]];
  return steps.map(([label, sat, bright]) => {
    const hex = hsbToHex({ h: base.h, s: base.s * sat, b: isSurface ? bright : Math.max(base.b, bright), a: 1 }).slice(0, 7).toUpperCase();
    return { hex, label, contrast: calcContrastRatio(isSurface ? LIGHT_INK : hex, isSurface ? hex : DARK_SURFACE) };
  });
}
