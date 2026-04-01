/**
 * Aquibra Helpers - Number Utilities
 * Mathematical and numeric manipulation functions
 *
 * @module utils/helpers/number
 * @license BSD-3-Clause
 */

// =============================================================================
// CLAMPING & RANGE
// =============================================================================

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Parse a string value to a number, returning 0 if invalid
 * Useful for parsing CSS values like "10px" to get the numeric part
 */
export function parseNumericValue(value: string): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Check if number is between bounds
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// =============================================================================
// INTERPOLATION
// =============================================================================

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Inverse lerp (get t from value)
 */
export function inverseLerp(start: number, end: number, value: number): number {
  return (value - start) / (end - start);
}

/**
 * Map value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

// =============================================================================
// ROUNDING
// =============================================================================

/**
 * Round to decimal places
 */
export function round(value: number, decimals: number = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// =============================================================================
// RANDOM
// =============================================================================

/**
 * Random number between min and max
 */
export function random(min: number = 0, max: number = 1): number {
  return Math.random() * (max - min) + min;
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// =============================================================================
// PERCENTAGE & FORMATTING
// =============================================================================

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
  return total === 0 ? 0 : (value / total) * 100;
}

/**
 * Format number with locale
 */
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i];
}

/**
 * Parse formatted number
 */
export function parseNumber(str: string): number {
  return parseFloat(str.replace(/[^\d.-]/g, ""));
}

// =============================================================================
// AGGREGATION
// =============================================================================

/**
 * Sum array of numbers
 */
export function sum(arr: number[]): number {
  return arr.reduce((acc, val) => acc + val, 0);
}

/**
 * Average of array
 */
export function average(arr: number[]): number {
  return arr.length === 0 ? 0 : sum(arr) / arr.length;
}

/**
 * Min value in array
 */
export function min(arr: number[]): number {
  return Math.min(...arr);
}

/**
 * Max value in array
 */
export function max(arr: number[]): number {
  return Math.max(...arr);
}
