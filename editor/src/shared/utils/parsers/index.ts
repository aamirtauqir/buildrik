/**
 * Aquibra Pro Parsers
 * Professional-grade HTML/CSS/Color parsing and manipulation
 *
 * Features:
 * - HTML parsing with XSS sanitization
 * - CSS parsing with variable resolution
 * - Multi-color space support (RGB, HSL, HWB, LAB, LCH, OKLCH)
 * - Color palette generation (complementary, analogous, triadic, etc.)
 * - Color blindness simulation
 * - CSS gradient parsing
 * - CSS unit conversion
 * - Box shadow parsing
 * - Blend modes
 * - WCAG accessibility compliance
 * - Delta E perceptual color difference
 *
 * @module utils/parsers
 * @license BSD-3-Clause
 */

// =============================================================================
// HTML PARSING
// =============================================================================

export {
  parseHTML,
  parseHTMLToFragment,
  serializeHTML,
  sanitizeHTML,
  type SanitizeOptions,
} from "./htmlParser";

// =============================================================================
// CSS PARSING
// =============================================================================

export {
  parseCSS,
  resolveCSSVariables,
  extractCSSVariables,
  splitCSSProperties,
  serializeCSS,
  parseInlineStyles,
  serializeInlineStyles,
  type CSSRule,
  type CSSParseOptions,
} from "./cssParser";

// =============================================================================
// COLOR TYPES
// =============================================================================

export {
  NAMED_COLORS,
  getNamedColors,
  type RGBColor,
  type HSLColor,
  type HWBColor,
  type LABColor,
  type LCHColor,
  type OKLCHColor,
  type AnyColor,
} from "./colorTypes";

// =============================================================================
// COLOR PARSING
// =============================================================================

export {
  parseColor,
  parseHexColor,
  parseColorValue,
  clampColor,
  ensureRgb,
  isValidColor,
} from "./colorParser";

// =============================================================================
// COLOR CONVERSION
// =============================================================================

export {
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToHwb,
  hwbToRgb,
  rgbToLab,
  labToRgb,
  labToLch,
  lchToLab,
  rgbToLch,
  lchToRgb,
  rgbToOklch,
  oklchToRgb,
} from "./colorConversion";

// =============================================================================
// COLOR FORMATTING
// =============================================================================

export {
  rgbToString,
  hslToString,
  hwbToString,
  labToString,
  lchToString,
  oklchToString,
} from "./colorFormat";

// =============================================================================
// COLOR MANIPULATION
// =============================================================================

export {
  lighten,
  darken,
  saturate,
  desaturate,
  adjustHue,
  setOpacity,
  mixColors,
  mixColorsLab,
  invertColor,
  toGrayscale,
  adjustTemperature,
  tint,
  shade,
  tone,
  blendColors,
  type BlendMode,
} from "./colorManipulation";

// =============================================================================
// COLOR PALETTE
// =============================================================================

export {
  generatePalette,
  generateGradientColors,
  generateShades,
  type ColorScheme,
} from "./colorPalette";

// =============================================================================
// COLOR ACCESSIBILITY
// =============================================================================

export {
  simulateColorBlindness,
  getLuminance,
  getContrastRatio,
  meetsContrastAA,
  meetsContrastAAA,
  getContrastTextColor,
  ensureContrast,
  deltaE,
  deltaE2000,
  findClosestNamedColor,
  colorsEqual,
  isLightColor,
  isDarkColor,
  type ColorBlindnessType,
} from "./colorAccessibility";

// =============================================================================
// GRADIENT PARSING
// =============================================================================

export {
  parseGradient,
  serializeGradient,
  type GradientStop,
  type LinearGradient,
  type RadialGradient,
  type ConicGradient,
  type CSSGradient,
} from "./gradientParser";

// =============================================================================
// UNIT PARSING
// =============================================================================

export {
  parseCSSValue,
  convertToPixels,
  convertFromPixels,
  formatCSSValue,
  type CSSUnit,
  type CSSValue,
} from "./unitParser";

// =============================================================================
// SHADOW PARSING
// =============================================================================

export { parseBoxShadow, serializeBoxShadow, type BoxShadow } from "./shadowParser";

// =============================================================================
// TRANSFORM PARSING
// =============================================================================

export { parseTransform, serializeTransform, type TransformFunction } from "./transformParser";
