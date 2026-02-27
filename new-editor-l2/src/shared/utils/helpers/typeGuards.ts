/**
 * Aquibra Helpers - Type Guards
 * Runtime type checking utilities
 *
 * @module utils/helpers/typeGuards
 * @license BSD-3-Clause
 */

import type { AnyFunction, Primitive, PromiseLikeShape } from "./types";

// =============================================================================
// OBJECT TYPE GUARDS
// =============================================================================

/**
 * Check if value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Check if value is an object (not null)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// =============================================================================
// PRIMITIVE TYPE GUARDS
// =============================================================================

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Check if value is a number (and not NaN)
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Check if value is a function
 */
export function isFunction(value: unknown): value is AnyFunction {
  return typeof value === "function";
}

/**
 * Check if value is undefined
 */
export function isUndefined(value: unknown): value is undefined {
  return typeof value === "undefined";
}

/**
 * Check if value is null
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Check if value is null or undefined
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if value is a Symbol
 */
export function isSymbol(value: unknown): value is symbol {
  return typeof value === "symbol";
}

/**
 * Check if value is a primitive
 */
export function isPrimitive(value: unknown): value is Primitive {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "symbol" ||
    typeof value === "bigint"
  );
}

// =============================================================================
// SPECIAL TYPE GUARDS
// =============================================================================

/**
 * Check if value is a Date
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Check if value is a RegExp
 */
export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp;
}

/**
 * Check if value is a Promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  if (value instanceof Promise) return true;
  if (!isObject(value)) return false;
  const maybePromise = value as unknown as PromiseLikeShape;
  return isFunction(maybePromise.then) && isFunction(maybePromise.catch);
}

// =============================================================================
// EMPTY CHECKS
// =============================================================================

/**
 * Check if value is empty (null, undefined, empty string/array/object)
 */
export function isEmpty(value: unknown): boolean {
  if (isNil(value)) return true;
  if (isString(value) || isArray(value)) return value.length === 0;
  if (value instanceof Map || value instanceof Set) return value.size === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
}
