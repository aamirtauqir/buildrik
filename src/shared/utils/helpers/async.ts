/**
 * Aquibra Helpers - Async Utilities
 * Asynchronous operation helpers
 *
 * @module utils/helpers/async
 * @license BSD-3-Clause
 */

import type { AnyFunction } from "./types";

// =============================================================================
// TIMING
// =============================================================================

/**
 * Wait for specified milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// RETRY
// =============================================================================

/**
 * Retry async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    attempts?: number;
    delay?: number;
    factor?: number;
    maxDelay?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { attempts = 3, delay = 1000, factor = 2, maxDelay = 30000, onRetry } = options;

  let lastError: Error;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === attempts) {
        throw lastError;
      }

      onRetry?.(lastError, attempt);
      await wait(currentDelay);
      currentDelay = Math.min(currentDelay * factor, maxDelay);
    }
  }

  throw lastError!;
}

// =============================================================================
// TIMEOUT
// =============================================================================

/**
 * Timeout wrapper for promises
 */
export function timeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string = "Operation timed out"
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

// =============================================================================
// PARALLEL & SERIES
// =============================================================================

/**
 * Run promises in parallel with concurrency limit
 */
export async function parallel<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number = Infinity
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const [index, task] of tasks.entries()) {
    const promise = Promise.resolve()
      .then(() => task())
      .then((result) => {
        results[index] = result;
      });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Run promises in series
 */
export async function series<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];
  for (const task of tasks) {
    results.push(await task());
  }
  return results;
}

// =============================================================================
// DEBOUNCE ASYNC
// =============================================================================

/**
 * Debounce async function
 */
export function debounceAsync<T extends AnyFunction>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingResolve: ((value: Awaited<ReturnType<T>>) => void) | null = null;
  let pendingReject: ((error: Error) => void) | null = null;

  return (...args: Parameters<T>) => {
    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        pendingReject?.(new Error("Debounced"));
      }

      pendingResolve = resolve;
      pendingReject = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          pendingResolve?.(result);
        } catch (error) {
          pendingReject?.(error instanceof Error ? error : new Error(String(error)));
        }
      }, delay);
    });
  };
}
