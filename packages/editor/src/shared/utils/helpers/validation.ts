/**
 * Aquibra Helpers - Validation Utilities
 * Input validation and format checking
 *
 * @module utils/helpers/validation
 * @license BSD-3-Clause
 */

// =============================================================================
// FORMAT VALIDATION
// =============================================================================

/**
 * Validate email format
 */
export function isEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Validate URL format
 */
export function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate JSON string
 */
export function isJSON(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse JSON safely
 */
export function parseJSON<T>(value: string, fallback?: T): T | undefined {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/**
 * Validate hex color
 */
export function isHexColor(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value);
}

/**
 * Validate phone number (basic)
 */
export function isPhoneNumber(value: string): boolean {
  return /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(value);
}
