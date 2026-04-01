/**
 * Aquibra Helpers - Object Utilities
 * Object manipulation and transformation functions
 *
 * @module utils/helpers/object
 * @license BSD-3-Clause
 */

import { deepClone } from "./objectDeep";
import { isPlainObject } from "./typeGuards";
import type { Path } from "./types";

// Re-export deep operations for backwards compatibility
export { deepClone, deepMerge, deepEqual, shallowEqual } from "./objectDeep";

// =============================================================================
// OBJECT MANIPULATION
// =============================================================================

/**
 * Pick specific keys from object
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specific keys from object
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

/**
 * Get nested value by path
 */
export function get<T = unknown>(obj: unknown, path: Path, defaultValue?: T): T {
  const keys =
    typeof path === "string"
      ? path
          .replace(/\[(\d+)\]/g, ".$1")
          .split(".")
          .filter(Boolean)
      : path;

  let result: unknown = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue as T;
    }
    result = (result as Record<string | number, unknown>)[key];
  }

  return (result === undefined ? defaultValue : result) as T;
}

/**
 * Set nested value by path (immutable)
 */
export function set<T extends object>(obj: T, path: Path, value: unknown): T {
  const keys =
    typeof path === "string"
      ? path
          .replace(/\[(\d+)\]/g, ".$1")
          .split(".")
          .filter(Boolean)
      : path;

  if (keys.length === 0) return obj;

  const result = deepClone(obj);
  let current: Record<string | number, unknown> = result as Record<string | number, unknown>;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const nextKey = keys[i + 1];
    const isNextArray = typeof nextKey === "number" || /^\d+$/.test(String(nextKey));

    if (current[key] === undefined || current[key] === null) {
      current[key] = isNextArray ? [] : {};
    } else {
      current[key] = deepClone(current[key]);
    }
    current = current[key] as Record<string | number, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return result;
}

/**
 * Check if path exists in object
 */
export function has(obj: unknown, path: Path): boolean {
  const keys =
    typeof path === "string"
      ? path
          .replace(/\[(\d+)\]/g, ".$1")
          .split(".")
          .filter(Boolean)
      : path;

  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return false;
    }
    if (!(key in (current as object))) {
      return false;
    }
    current = (current as Record<string | number, unknown>)[key];
  }

  return true;
}

/**
 * Flatten nested object
 */
export function flatten(
  obj: Record<string, unknown>,
  prefix: string = "",
  separator: string = "."
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}${separator}${key}` : key;
      const value = obj[key];

      if (isPlainObject(value)) {
        Object.assign(result, flatten(value as Record<string, unknown>, newKey, separator));
      } else {
        result[newKey] = value;
      }
    }
  }

  return result;
}

/**
 * Unflatten flattened object
 */
export function unflatten(
  obj: Record<string, unknown>,
  separator: string = "."
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const keys = key.split(separator);
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = obj[key];
    }
  }

  return result;
}

/**
 * Map object values
 */
export function mapValues<T, U>(
  obj: Record<string, T>,
  fn: (value: T, key: string) => U
): Record<string, U> {
  const result: Record<string, U> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = fn(obj[key], key);
    }
  }
  return result;
}

/**
 * Map object keys
 */
export function mapKeys<T>(
  obj: Record<string, T>,
  fn: (key: string, value: T) => string
): Record<string, T> {
  const result: Record<string, T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[fn(key, obj[key])] = obj[key];
    }
  }
  return result;
}

/**
 * Filter object entries
 */
export function filterObject<T>(
  obj: Record<string, T>,
  predicate: (value: T, key: string) => boolean
): Record<string, T> {
  const result: Record<string, T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && predicate(obj[key], key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Invert object keys and values
 */
export function invert<T extends string | number>(obj: Record<string, T>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[String(obj[key])] = key;
    }
  }
  return result;
}
