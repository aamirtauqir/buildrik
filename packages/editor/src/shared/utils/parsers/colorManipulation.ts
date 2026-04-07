/**
 * Color Manipulation Utilities - Lighten, darken, mix, blend colors
 * @module utils/parsers/colorManipulation
 * @license BSD-3-Clause
 */
import { clamp } from "../helpers";
import { rgbToHsl, hslToRgb, rgbToLab, labToRgb } from "./colorConversion";
import { parseColor, clampColor } from "./colorParser";
import { RGBColor } from "./colorTypes";

/**
 * Ensure color is RGBColor
 */
function ensureRgb(color: RGBColor | string): RGBColor | null {
  return typeof color === "string" ? parseColor(color) : color;
}

// =============================================================================
// COLOR MANIPULATION
// =============================================================================

/**
 * Lighten a color by percentage
 */
export function lighten(color: RGBColor | string, amount: number): RGBColor {
  const rgb = ensureRgb(color);
  if (!rgb) return { r: 255, g: 255, b: 255 };

  const hsl = rgbToHsl(rgb);
  hsl.l = Math.min(100, hsl.l + amount);
  return hslToRgb(hsl);
}

/**
 * Darken a color by percentage
 */
export function darken(color: RGBColor | string, amount: number): RGBColor {
  const rgb = ensureRgb(color);
  if (!rgb) return { r: 0, g: 0, b: 0 };

  const hsl = rgbToHsl(rgb);
  hsl.l = Math.max(0, hsl.l - amount);
  return hslToRgb(hsl);
}

/**
 * Saturate a color by percentage
 */
export function saturate(color: RGBColor | string, amount: number): RGBColor {
  const rgb = ensureRgb(color);
  if (!rgb) return { r: 128, g: 128, b: 128 };

  const hsl = rgbToHsl(rgb);
  hsl.s = Math.min(100, hsl.s + amount);
  return hslToRgb(hsl);
}

/**
 * Desaturate a color by percentage
 */
export function desaturate(color: RGBColor | string, amount: number): RGBColor {
  const rgb = ensureRgb(color);
  if (!rgb) return { r: 128, g: 128, b: 128 };

  const hsl = rgbToHsl(rgb);
  hsl.s = Math.max(0, hsl.s - amount);
  return hslToRgb(hsl);
}

/**
 * Adjust hue by degrees
 */
export function adjustHue(color: RGBColor | string, degrees: number): RGBColor {
  const rgb = ensureRgb(color);
  if (!rgb) return { r: 128, g: 128, b: 128 };

  const hsl = rgbToHsl(rgb);
  hsl.h = (((hsl.h + degrees) % 360) + 360) % 360;
  return hslToRgb(hsl);
}

/**
 * Adjust color opacity
 */
export function setOpacity(color: RGBColor | string, alpha: number): RGBColor {
  const rgb = ensureRgb(color);
  if (!rgb) return { r: 0, g: 0, b: 0, a: alpha };

  return { ...rgb, a: clamp(alpha, 0, 1) };
}

/**
 * Mix two colors together
 */
export function mixColors(
  color1: RGBColor | string,
  color2: RGBColor | string,
  weight: number = 0.5
): RGBColor {
  const rgb1 = ensureRgb(color1);
  const rgb2 = ensureRgb(color2);

  if (!rgb1) return rgb2 || { r: 0, g: 0, b: 0 };
  if (!rgb2) return rgb1;

  const w = clamp(weight, 0, 1);
  const w2 = 1 - w;

  return {
    r: Math.round(rgb1.r * w + rgb2.r * w2),
    g: Math.round(rgb1.g * w + rgb2.g * w2),
    b: Math.round(rgb1.b * w + rgb2.b * w2),
    a:
      rgb1.a !== undefined || rgb2.a !== undefined
        ? (rgb1.a ?? 1) * w + (rgb2.a ?? 1) * w2
        : undefined,
  };
}

/**
 * Mix colors in LAB space (perceptually uniform)
 */
export function mixColorsLab(
  color1: RGBColor | string,
  color2: RGBColor | string,
  weight: number = 0.5
): RGBColor {
  const rgb1 = ensureRgb(color1);
  const rgb2 = ensureRgb(color2);

  if (!rgb1) return rgb2 || { r: 0, g: 0, b: 0 };
  if (!rgb2) return rgb1;

  const lab1 = rgbToLab(rgb1);
  const lab2 = rgbToLab(rgb2);
  const w = clamp(weight, 0, 1);
  const w2 = 1 - w;

  const mixed = labToRgb({
    l: lab1.l * w + lab2.l * w2,
    a: lab1.a * w + lab2.a * w2,
    b: lab1.b * w + lab2.b * w2,
    alpha: (lab1.alpha ?? 1) * w + (lab2.alpha ?? 1) * w2,
  });

  return mixed;
}

/**
 * Invert a color
 */
export function invertColor(color: RGBColor | string): RGBColor {
  const rgb = ensureRgb(color);
  if (!rgb) return { r: 255, g: 255, b: 255 };

  return {
    r: 255 - rgb.r,
    g: 255 - rgb.g,
    b: 255 - rgb.b,
    a: rgb.a,
  };
}

/**
 * Get grayscale version of color
 */
export function toGrayscale(color: RGBColor | string): RGBColor {
  const rgb = ensureRgb(color);
  if (!rgb) return { r: 128, g: 128, b: 128 };

  // Use luminance formula (perceptually accurate)
  const gray = Math.round(rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114);
  return { r: gray, g: gray, b: gray, a: rgb.a };
}

/**
 * Adjust color temperature (warm/cool)
 * Positive values = warmer, negative = cooler
 */
export function adjustTemperature(color: RGBColor | string, amount: number): RGBColor {
  const rgb = ensureRgb(color);
  if (!rgb) return { r: 128, g: 128, b: 128 };

  // Warm = increase red/yellow, decrease blue
  // Cool = increase blue, decrease red/yellow
  const factor = amount / 100;

  return {
    r: clampColor(rgb.r + factor * 30),
    g: clampColor(rgb.g + factor * 10),
    b: clampColor(rgb.b - factor * 30),
    a: rgb.a,
  };
}

/**
 * Tint a color (mix with white)
 */
export function tint(color: RGBColor | string, amount: number): RGBColor {
  return mixColors({ r: 255, g: 255, b: 255 }, color, amount / 100);
}

/**
 * Shade a color (mix with black)
 */
export function shade(color: RGBColor | string, amount: number): RGBColor {
  return mixColors({ r: 0, g: 0, b: 0 }, color, amount / 100);
}

/**
 * Tone a color (mix with gray)
 */
export function tone(color: RGBColor | string, amount: number): RGBColor {
  return mixColors({ r: 128, g: 128, b: 128 }, color, amount / 100);
}

// =============================================================================
// BLEND MODES
// =============================================================================

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion";

/**
 * Blend two colors using a blend mode
 */
export function blendColors(
  base: RGBColor | string,
  blend: RGBColor | string,
  mode: BlendMode = "normal",
  opacity: number = 1
): RGBColor {
  const baseRgb = ensureRgb(base);
  const blendRgb = ensureRgb(blend);

  if (!baseRgb) return blendRgb || { r: 0, g: 0, b: 0 };
  if (!blendRgb) return baseRgb;

  const blendChannel = (b: number, l: number): number => {
    const bn = b / 255;
    const ln = l / 255;

    let result: number;

    switch (mode) {
      case "multiply":
        result = bn * ln;
        break;
      case "screen":
        result = 1 - (1 - bn) * (1 - ln);
        break;
      case "overlay":
        result = bn < 0.5 ? 2 * bn * ln : 1 - 2 * (1 - bn) * (1 - ln);
        break;
      case "darken":
        result = Math.min(bn, ln);
        break;
      case "lighten":
        result = Math.max(bn, ln);
        break;
      case "color-dodge":
        result = bn === 1 ? 1 : Math.min(1, ln / (1 - bn));
        break;
      case "color-burn":
        result = bn === 0 ? 0 : Math.max(0, 1 - (1 - ln) / bn);
        break;
      case "hard-light":
        result = ln < 0.5 ? 2 * bn * ln : 1 - 2 * (1 - bn) * (1 - ln);
        break;
      case "soft-light":
        result =
          ln < 0.5
            ? bn - (1 - 2 * ln) * bn * (1 - bn)
            : bn +
              (2 * ln - 1) * ((bn < 0.25 ? ((16 * bn - 12) * bn + 4) * bn : Math.sqrt(bn)) - bn);
        break;
      case "difference":
        result = Math.abs(bn - ln);
        break;
      case "exclusion":
        result = bn + ln - 2 * bn * ln;
        break;
      default:
        result = ln;
    }

    // Apply opacity
    result = bn * (1 - opacity) + result * opacity;

    return clampColor(result * 255);
  };

  return {
    r: blendChannel(blendRgb.r, baseRgb.r),
    g: blendChannel(blendRgb.g, baseRgb.g),
    b: blendChannel(blendRgb.b, baseRgb.b),
    a: baseRgb.a,
  };
}
