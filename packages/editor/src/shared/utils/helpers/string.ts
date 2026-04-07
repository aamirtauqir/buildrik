/**
 * Aquibra Helpers - String Utilities
 * String manipulation and formatting functions
 *
 * @module utils/helpers/string
 * @license BSD-3-Clause
 */

import { get } from "./object";

// =============================================================================
// CASE CONVERSION
// =============================================================================

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Convert to camelCase
 */
export function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^./, (c) => c.toLowerCase());
}

/**
 * Convert to snake_case
 */
export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
}

/**
 * Convert to kebab-case
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

/**
 * Convert camelCase to kebab-case
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

// =============================================================================
// URL & SLUG
// =============================================================================

/**
 * Convert to URL-friendly slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// =============================================================================
// TRUNCATION
// =============================================================================

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number, suffix: string = "..."): string {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Truncate in middle
 */
export function truncateMiddle(str: string, length: number, separator: string = "..."): string {
  if (str.length <= length) return str;
  const charsToShow = length - separator.length;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return str.slice(0, frontChars) + separator + str.slice(-backChars);
}

// =============================================================================
// PADDING
// =============================================================================

/**
 * Pad string
 */
export function pad(
  str: string,
  length: number,
  char: string = " ",
  position: "start" | "end" | "both" = "end"
): string {
  if (str.length >= length) return str;
  const padLength = length - str.length;

  switch (position) {
    case "start":
      return char.repeat(padLength) + str;
    case "end":
      return str + char.repeat(padLength);
    case "both": {
      const leftPad = Math.floor(padLength / 2);
      const rightPad = padLength - leftPad;
      return char.repeat(leftPad) + str + char.repeat(rightPad);
    }
  }
}

// =============================================================================
// HTML & CONTENT
// =============================================================================

/**
 * Strip HTML tags
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Word count
 */
export function wordCount(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

// =============================================================================
// TEMPLATE & REGEX
// =============================================================================

/**
 * Simple template literals
 */
export function template(
  str: string,
  data: Record<string, unknown>,
  options: { prefix?: string; suffix?: string } = {}
): string {
  const { prefix = "{{", suffix = "}}" } = options;
  const pattern = new RegExp(
    `${escapeRegExp(prefix)}\\s*([\\w.]+)\\s*${escapeRegExp(suffix)}`,
    "g"
  );

  return str.replace(pattern, (_, key) => {
    const value = get(data, key);
    return value !== undefined ? String(value) : "";
  });
}

/**
 * Escape regex special characters
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// =============================================================================
// RANDOM
// =============================================================================

/**
 * Generate random string
 */
export function randomString(
  length: number,
  chars: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
