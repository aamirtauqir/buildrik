/**
 * Aquibra Helpers - Result Type
 * Functional error handling utilities
 *
 * @module utils/helpers/result
 * @license BSD-3-Clause
 */

import type { Result } from "./types";

// =============================================================================
// RESULT CONSTRUCTORS
// =============================================================================

/**
 * Create success result
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Create error result
 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// =============================================================================
// TRY-CATCH WRAPPERS
// =============================================================================

/**
 * Wrap function in try-catch returning Result
 */
export function tryCatch<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error as E);
  }
}

/**
 * Wrap async function in try-catch returning Result
 */
export async function tryCatchAsync<T, E = Error>(fn: () => Promise<T>): Promise<Result<T, E>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(error as E);
  }
}

// =============================================================================
// UNWRAPPERS
// =============================================================================

/**
 * Unwrap Result or throw
 */
export function unwrap<T>(result: Result<T, Error>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

/**
 * Unwrap Result or return default
 */
export function unwrapOr<T>(result: Result<T, unknown>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}
