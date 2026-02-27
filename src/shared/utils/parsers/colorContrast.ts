/**
 * Color Contrast and Accessibility
 * WCAG contrast calculations and color accessibility utilities
 *
 * @module utils/parsers/colorContrast
 * @license BSD-3-Clause
 */

import { rgbToHsl, hslToRgb } from "./colorConversion";
import { ensureRgb } from "./colorParser";
import { RGBColor } from "./colorTypes";

// =============================================================================
// COLOR ACCESSIBILITY
// =============================================================================

/**
 * Get relative luminance of a color (WCAG formula)
 */
export function getLuminance(color: RGBColor | string): number {
  const rgb = ensureRgb(color);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    v = v / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors (WCAG)
 * Returns value between 1 and 21
 */
export function getContrastRatio(color1: RGBColor | string, color2: RGBColor | string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast meets WCAG AA standard (4.5:1 for normal text)
 */
export function meetsContrastAA(
  foreground: RGBColor | string,
  background: RGBColor | string,
  largeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast meets WCAG AAA standard (7:1 for normal text)
 */
export function meetsContrastAAA(
  foreground: RGBColor | string,
  background: RGBColor | string,
  largeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Get best text color (black or white) for a background
 */
export function getContrastTextColor(background: RGBColor | string): RGBColor {
  const luminance = getLuminance(background);
  return luminance > 0.179
    ? { r: 0, g: 0, b: 0 } // Use black text
    : { r: 255, g: 255, b: 255 }; // Use white text
}

/**
 * Find a color with sufficient contrast against a background
 */
export function ensureContrast(
  color: RGBColor | string,
  background: RGBColor | string,
  minRatio: number = 4.5
): RGBColor {
  const rgb = ensureRgb(color);
  const bgRgb = ensureRgb(background);
  if (!rgb || !bgRgb) return { r: 0, g: 0, b: 0 };

  const ratio = getContrastRatio(rgb, bgRgb);
  if (ratio >= minRatio) return rgb;

  const bgLuminance = getLuminance(bgRgb);
  const hsl = rgbToHsl(rgb);

  // Try adjusting lightness
  if (bgLuminance > 0.5) {
    // Dark background - try darkening the color
    for (let l = hsl.l; l >= 0; l -= 5) {
      const adjusted = hslToRgb({ ...hsl, l });
      if (getContrastRatio(adjusted, bgRgb) >= minRatio) {
        return adjusted;
      }
    }
  } else {
    // Light background - try lightening the color
    for (let l = hsl.l; l <= 100; l += 5) {
      const adjusted = hslToRgb({ ...hsl, l });
      if (getContrastRatio(adjusted, bgRgb) >= minRatio) {
        return adjusted;
      }
    }
  }

  // Fallback to black or white
  return getContrastTextColor(bgRgb);
}

/**
 * Check if color is light (luminance > 0.5)
 */
export function isLightColor(color: RGBColor | string): boolean {
  return getLuminance(color) > 0.5;
}

/**
 * Check if color is dark (luminance <= 0.5)
 */
export function isDarkColor(color: RGBColor | string): boolean {
  return getLuminance(color) <= 0.5;
}
