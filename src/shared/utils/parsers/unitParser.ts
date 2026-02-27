/**
 * CSS Unit Parsing and Conversion
 * Parse and convert between CSS units
 *
 * @module utils/parsers/unitParser
 * @license BSD-3-Clause
 */

// =============================================================================
// CSS UNIT PARSING & CONVERSION
// =============================================================================

export type CSSUnit =
  | "px"
  | "rem"
  | "em"
  | "%"
  | "vh"
  | "vw"
  | "vmin"
  | "vmax"
  | "pt"
  | "cm"
  | "mm"
  | "in";

export interface CSSValue {
  value: number;
  unit: CSSUnit;
}

/**
 * Parse CSS value with unit
 */
export function parseCSSValue(value: string): CSSValue | null {
  const match = value.trim().match(/^([-\d.]+)(px|rem|em|%|vh|vw|vmin|vmax|pt|cm|mm|in)?$/i);
  if (!match) return null;

  return {
    value: parseFloat(match[1]),
    unit: (match[2]?.toLowerCase() || "px") as CSSUnit,
  };
}

/**
 * Convert CSS value to pixels
 * @param value - CSS value object or string
 * @param context - Context for relative units
 */
export function convertToPixels(
  value: CSSValue | string,
  context: {
    rootFontSize?: number; // For rem (default: 16)
    parentFontSize?: number; // For em (default: 16)
    parentSize?: number; // For % (default: 0)
    viewportWidth?: number; // For vw, vmin, vmax
    viewportHeight?: number; // For vh, vmin, vmax
  } = {}
): number {
  const parsed = typeof value === "string" ? parseCSSValue(value) : value;
  if (!parsed) return 0;

  const {
    rootFontSize = 16,
    parentFontSize = 16,
    parentSize = 0,
    viewportWidth = 1920,
    viewportHeight = 1080,
  } = context;

  switch (parsed.unit) {
    case "px":
      return parsed.value;
    case "rem":
      return parsed.value * rootFontSize;
    case "em":
      return parsed.value * parentFontSize;
    case "%":
      return (parsed.value / 100) * parentSize;
    case "vh":
      return (parsed.value / 100) * viewportHeight;
    case "vw":
      return (parsed.value / 100) * viewportWidth;
    case "vmin":
      return (parsed.value / 100) * Math.min(viewportWidth, viewportHeight);
    case "vmax":
      return (parsed.value / 100) * Math.max(viewportWidth, viewportHeight);
    case "pt":
      return parsed.value * (96 / 72); // 72pt = 1in, 1in = 96px
    case "cm":
      return parsed.value * (96 / 2.54);
    case "mm":
      return parsed.value * (96 / 25.4);
    case "in":
      return parsed.value * 96;
    default:
      return parsed.value;
  }
}

/**
 * Convert pixels to another unit
 */
export function convertFromPixels(
  pixels: number,
  targetUnit: CSSUnit,
  context: {
    rootFontSize?: number;
    parentFontSize?: number;
    parentSize?: number;
    viewportWidth?: number;
    viewportHeight?: number;
  } = {}
): CSSValue {
  const {
    rootFontSize = 16,
    parentFontSize = 16,
    parentSize = 100,
    viewportWidth = 1920,
    viewportHeight = 1080,
  } = context;

  let value: number;

  switch (targetUnit) {
    case "px":
      value = pixels;
      break;
    case "rem":
      value = pixels / rootFontSize;
      break;
    case "em":
      value = pixels / parentFontSize;
      break;
    case "%":
      value = (pixels / parentSize) * 100;
      break;
    case "vh":
      value = (pixels / viewportHeight) * 100;
      break;
    case "vw":
      value = (pixels / viewportWidth) * 100;
      break;
    case "vmin":
      value = (pixels / Math.min(viewportWidth, viewportHeight)) * 100;
      break;
    case "vmax":
      value = (pixels / Math.max(viewportWidth, viewportHeight)) * 100;
      break;
    case "pt":
      value = pixels * (72 / 96);
      break;
    case "cm":
      value = pixels * (2.54 / 96);
      break;
    case "mm":
      value = pixels * (25.4 / 96);
      break;
    case "in":
      value = pixels / 96;
      break;
    default:
      value = pixels;
  }

  return { value, unit: targetUnit };
}

/**
 * Format CSS value as string
 */
export function formatCSSValue(value: CSSValue, precision: number = 2): string {
  const rounded = Math.round(value.value * Math.pow(10, precision)) / Math.pow(10, precision);
  return `${rounded}${value.unit}`;
}
