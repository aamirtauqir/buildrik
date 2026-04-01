/**
 * Aquibra Helpers - Function Utilities
 * Function composition and transformation
 *
 * @module utils/helpers/function
 * @license BSD-3-Clause
 */

import type { AnyFunction, DebouncedFunction, ThrottledFunction } from "./types";

// =============================================================================
// DEBOUNCE
// =============================================================================

/**
 * Debounce function with cancel and flush
 */
export function debounce<T extends AnyFunction>(
  fn: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): DebouncedFunction<T> {
  const { leading = false, trailing = true } = options;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: ThisParameterType<T> | null = null;
  let lastCallTime: number | null = null;
  let result: ReturnType<T>;

  function invokeFunc() {
    if (lastArgs) {
      result = fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
    return result;
  }

  const debounced = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === null && leading) {
        return invokeFunc();
      }
    }

    if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        if (trailing && lastArgs) {
          invokeFunc();
        }
      }, delay);
    }
  } as DebouncedFunction<T>;

  function shouldInvoke(time: number): boolean {
    return lastCallTime === null || time - lastCallTime >= delay;
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
    lastCallTime = null;
  };

  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      if (lastArgs) {
        invokeFunc();
      }
    }
  };

  debounced.pending = () => timeoutId !== null;

  return debounced;
}

// =============================================================================
// THROTTLE
// =============================================================================

/**
 * Throttle function
 */
export function throttle<T extends AnyFunction>(
  fn: T,
  limit: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): ThrottledFunction<T> {
  const { leading = true, trailing = true } = options;
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: ThisParameterType<T> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttled = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (!inThrottle) {
      if (leading) {
        fn.apply(this, args);
      } else {
        lastArgs = args;
        lastThis = this;
      }
      inThrottle = true;

      timeoutId = setTimeout(() => {
        inThrottle = false;
        if (trailing && lastArgs) {
          fn.apply(lastThis, lastArgs);
          lastArgs = null;
          lastThis = null;
        }
      }, limit);
    } else if (trailing) {
      lastArgs = args;
      lastThis = this;
    }
  } as ThrottledFunction<T>;

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    inThrottle = false;
    lastArgs = null;
    lastThis = null;
  };

  return throttled;
}

// =============================================================================
// MEMOIZE
// =============================================================================

/**
 * Memoize function results
 */
export function memoize<T extends AnyFunction>(
  fn: T,
  options: {
    resolver?: (...args: Parameters<T>) => string;
    maxSize?: number;
  } = {}
): T & { cache: Map<string, ReturnType<T>>; clear: () => void } {
  const { resolver = (...args) => JSON.stringify(args), maxSize = 100 } = options;
  const cache = new Map<string, ReturnType<T>>();

  const memoized = function (...args: Parameters<T>): ReturnType<T> {
    const key = resolver(...args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);

    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    cache.set(key, result);
    return result;
  } as T & { cache: Map<string, ReturnType<T>>; clear: () => void };

  memoized.cache = cache;
  memoized.clear = () => cache.clear();

  return memoized;
}

// =============================================================================
// ONCE
// =============================================================================

/**
 * Function that runs only once
 */
export function once<T extends AnyFunction>(fn: T): T {
  let called = false;
  let result: ReturnType<T>;

  return function (...args: Parameters<T>): ReturnType<T> {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  } as T;
}

// =============================================================================
// COMPOSITION
// =============================================================================

/**
 * Pipe functions left to right
 */
export function pipe<T>(...fns: ((arg: T) => T)[]): (arg: T) => T {
  return (arg: T) => fns.reduce((result, fn) => fn(result), arg);
}

/**
 * Compose functions right to left
 */
export function compose<T>(...fns: ((arg: T) => T)[]): (arg: T) => T {
  return (arg: T) => fns.reduceRight((result, fn) => fn(result), arg);
}

/**
 * Curry a function
 * Returns a curried version that can accept arguments incrementally
 * Note: Full type-safe curry requires complex recursive types; this provides basic typing
 */
export function curry<T extends AnyFunction>(fn: T): (...args: Parameters<T>) => ReturnType<T> {
  const arity = fn.length;

  function curried(...args: unknown[]): unknown {
    if (args.length >= arity) {
      return fn(...(args as Parameters<T>));
    }
    return (...moreArgs: unknown[]) => curried(...args, ...moreArgs);
  }
  return curried as (...args: Parameters<T>) => ReturnType<T>;
}

/**
 * Partial application
 * Partially applies arguments to a function
 */
export function partial<T extends AnyFunction, PArgs extends Partial<Parameters<T>>>(
  fn: T,
  ...partialArgs: PArgs
): (...args: unknown[]) => ReturnType<T> {
  return (...args: unknown[]) => fn(...partialArgs, ...args);
}

/**
 * Negate a predicate function
 */
export function negate<T extends AnyFunction>(fn: T): (...args: Parameters<T>) => boolean {
  return (...args) => !fn(...args);
}
