/**
 * Color Space Conversions
 * Re-exports from split modules for backwards compatibility
 *
 * @module utils/parsers/colorConversion
 * @license BSD-3-Clause
 */

// Re-export from basic conversions (RGB, HSL, HWB, HEX)
export {
  clampColor,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToHwb,
  hwbToRgb,
} from "./colorConversionBasic";

// Re-export from LAB/LCH/OKLCH conversions
export {
  rgbToLab,
  labToRgb,
  labToLch,
  lchToLab,
  rgbToLch,
  lchToRgb,
  rgbToOklch,
  oklchToRgb,
} from "./colorConversionLab";
