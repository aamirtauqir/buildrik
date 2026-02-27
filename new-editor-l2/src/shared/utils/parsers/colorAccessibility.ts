/**
 * Color Accessibility Utilities
 * Re-exports from split modules for backwards compatibility
 *
 * @module utils/parsers/colorAccessibility
 * @license BSD-3-Clause
 */

// Re-export everything from split modules
export { simulateColorBlindness, type ColorBlindnessType } from "./colorBlindness";
export {
  getLuminance,
  getContrastRatio,
  meetsContrastAA,
  meetsContrastAAA,
  getContrastTextColor,
  ensureContrast,
  isLightColor,
  isDarkColor,
} from "./colorContrast";
export { deltaE, deltaE2000, findClosestNamedColor, colorsEqual } from "./colorDelta";
