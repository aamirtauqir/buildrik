/**
 * Aquibra Helpers - Performance Utilities
 * Performance measurement and optimization helpers
 *
 * @module utils/helpers/performance
 * @license BSD-3-Clause
 */

// =============================================================================
// TIMING
// =============================================================================

/**
 * Measure execution time
 */
export async function measureTime<T>(
  fn: () => T | Promise<T>,
  _label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  return { result, duration };
}

// =============================================================================
// ANIMATION FRAME
// =============================================================================

/**
 * Request animation frame with promise
 */
export function raf(): Promise<number> {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

/**
 * Request idle callback with promise
 */
export function idle(timeout?: number): Promise<IdleDeadline> {
  if (typeof requestIdleCallback === "undefined") {
    return new Promise((resolve) =>
      setTimeout(() => resolve({ didTimeout: false, timeRemaining: () => 50 }), 0)
    );
  }
  return new Promise((resolve) => requestIdleCallback(resolve, timeout ? { timeout } : undefined));
}

// =============================================================================
// BATCHING
// =============================================================================

/**
 * Batch updates using microtask
 */
export function batchUpdate(fn: () => void): void {
  queueMicrotask(fn);
}

/**
 * Run in next tick
 */
export function nextTick(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}
