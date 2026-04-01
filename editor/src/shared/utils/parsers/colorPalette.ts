/**
 * Color Palette Generation
 * Generate color palettes based on color theory
 *
 * @module utils/parsers/colorPalette
 * @license BSD-3-Clause
 */

import { rgbToHsl, hslToRgb } from "./colorConversion";
import { mixColorsLab, mixColors } from "./colorManipulation";
import { parseColor } from "./colorParser";
import { RGBColor, HSLColor } from "./colorTypes";

/**
 * Ensure color is RGBColor
 */
function ensureRgb(color: RGBColor | string): RGBColor | null {
  return typeof color === "string" ? parseColor(color) : color;
}

// =============================================================================
// COLOR PALETTE GENERATION
// =============================================================================

export type ColorScheme =
  | "complementary"
  | "analogous"
  | "triadic"
  | "tetradic"
  | "split-complementary"
  | "double-complementary"
  | "monochromatic";

/**
 * Generate a color palette based on color theory
 */
export function generatePalette(
  baseColor: RGBColor | string,
  scheme: ColorScheme,
  count?: number
): RGBColor[] {
  const rgb = ensureRgb(baseColor);
  if (!rgb) return [];

  const hsl = rgbToHsl(rgb);
  const palette: HSLColor[] = [hsl];

  switch (scheme) {
    case "complementary":
      palette.push({ ...hsl, h: (hsl.h + 180) % 360 });
      break;

    case "analogous":
      palette.push({ ...hsl, h: (hsl.h + 30) % 360 });
      palette.push({ ...hsl, h: (hsl.h - 30 + 360) % 360 });
      break;

    case "triadic":
      palette.push({ ...hsl, h: (hsl.h + 120) % 360 });
      palette.push({ ...hsl, h: (hsl.h + 240) % 360 });
      break;

    case "tetradic":
      palette.push({ ...hsl, h: (hsl.h + 90) % 360 });
      palette.push({ ...hsl, h: (hsl.h + 180) % 360 });
      palette.push({ ...hsl, h: (hsl.h + 270) % 360 });
      break;

    case "split-complementary":
      palette.push({ ...hsl, h: (hsl.h + 150) % 360 });
      palette.push({ ...hsl, h: (hsl.h + 210) % 360 });
      break;

    case "double-complementary":
      palette.push({ ...hsl, h: (hsl.h + 30) % 360 });
      palette.push({ ...hsl, h: (hsl.h + 180) % 360 });
      palette.push({ ...hsl, h: (hsl.h + 210) % 360 });
      break;

    case "monochromatic": {
      const steps = count || 5;
      palette.length = 0; // Clear initial
      for (let i = 0; i < steps; i++) {
        const lightness = Math.max(10, Math.min(90, 10 + (80 / (steps - 1)) * i));
        palette.push({ ...hsl, l: lightness });
      }
      break;
    }
  }

  return palette.map(hslToRgb);
}

/**
 * Generate a gradient of colors between two colors
 */
export function generateGradientColors(
  start: RGBColor | string,
  end: RGBColor | string,
  steps: number,
  perceptual: boolean = true
): RGBColor[] {
  const colors: RGBColor[] = [];

  for (let i = 0; i < steps; i++) {
    const weight = i / (steps - 1);
    colors.push(perceptual ? mixColorsLab(end, start, weight) : mixColors(end, start, weight));
  }

  return colors;
}

/**
 * Generate shades of a color (light to dark)
 */
export function generateShades(color: RGBColor | string, count: number = 9): RGBColor[] {
  const rgb = ensureRgb(color);
  if (!rgb) return [];

  const shades: RGBColor[] = [];
  for (let i = 0; i < count; i++) {
    const lightness = 95 - (90 / (count - 1)) * i; // 95% to 5%
    const hsl = rgbToHsl(rgb);
    hsl.l = lightness;
    shades.push(hslToRgb(hsl));
  }

  return shades;
}
