/**
 * Aquibra Helpers - Array Utilities
 * Comprehensive array manipulation functions
 *
 * @module utils/helpers/array
 * @license BSD-3-Clause
 */

// =============================================================================
// ARRAY TRIMMING
// =============================================================================

/**
 * Trim array to max length (keeps newest entries from end)
 * Used by: canvasDebug for log trimming
 */
export function trimArray<T>(arr: T[], maxLength: number): T[] {
  return arr.length > maxLength ? arr.slice(-maxLength) : arr;
}

/**
 * Trim array from start (keeps oldest entries)
 */
export function trimArrayStart<T>(arr: T[], maxLength: number): T[] {
  return arr.length > maxLength ? arr.slice(0, maxLength) : arr;
}

// =============================================================================
// UNIQUE & GROUPING
// =============================================================================

/**
 * Get unique values from array
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Get unique values by key
 */
export function uniqueBy<T>(arr: T[], key: keyof T | ((item: T) => unknown)): T[] {
  const seen = new Set();
  return arr.filter((item) => {
    const k = typeof key === "function" ? key(item) : item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Group array by key
 */
export function groupBy<T>(
  arr: T[],
  key: keyof T | ((item: T) => string | number)
): Record<string, T[]> {
  return arr.reduce(
    (groups, item) => {
      const k = String(typeof key === "function" ? key(item) : item[key]);
      (groups[k] = groups[k] || []).push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

// =============================================================================
// SORTING
// =============================================================================

/**
 * Sort by key(s)
 */
export function sortBy<T>(arr: T[], ...keys: (keyof T | ((item: T) => unknown))[]): T[] {
  return [...arr].sort((a, b) => {
    for (const key of keys) {
      const aVal = typeof key === "function" ? key(a) : a[key];
      const bVal = typeof key === "function" ? key(b) : b[key];

      if (aVal === bVal) continue;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
}

// =============================================================================
// TRANSFORMATION
// =============================================================================

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Create range of numbers
 */
export function range(start: number, end?: number, step: number = 1): number[] {
  if (end === undefined) {
    end = start;
    start = 0;
  }

  const result: number[] = [];
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
  } else if (step < 0) {
    for (let i = start; i > end; i += step) {
      result.push(i);
    }
  }
  return result;
}

/**
 * Zip multiple arrays
 */
export function zip<T>(...arrays: T[][]): T[][] {
  const maxLength = Math.max(...arrays.map((arr) => arr.length));
  const result: T[][] = [];

  for (let i = 0; i < maxLength; i++) {
    result.push(arrays.map((arr) => arr[i]));
  }

  return result;
}

/**
 * Unzip array of tuples
 */
export function unzip<T>(arr: T[][]): T[][] {
  if (arr.length === 0) return [];
  const maxLength = Math.max(...arr.map((sub) => sub.length));
  const result: T[][] = Array.from({ length: maxLength }, () => []);

  for (const tuple of arr) {
    for (let i = 0; i < maxLength; i++) {
      result[i].push(tuple[i]);
    }
  }

  return result;
}

// =============================================================================
// SET OPERATIONS
// =============================================================================

/**
 * Get difference between arrays
 */
export function difference<T>(arr1: T[], arr2: T[]): T[] {
  const set = new Set(arr2);
  return arr1.filter((item) => !set.has(item));
}

/**
 * Get intersection of arrays
 */
export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  const set = new Set(arr2);
  return arr1.filter((item) => set.has(item));
}

/**
 * Get union of arrays
 */
export function union<T>(...arrays: T[][]): T[] {
  return unique(arrays.flat());
}

// =============================================================================
// FINDING & FILTERING
// =============================================================================

/**
 * Find first element matching predicate
 */
export function first<T>(arr: T[], predicate?: (item: T) => boolean): T | undefined {
  if (!predicate) return arr[0];
  return arr.find(predicate);
}

/**
 * Find last element matching predicate
 */
export function last<T>(arr: T[], predicate?: (item: T) => boolean): T | undefined {
  if (!predicate) return arr[arr.length - 1];
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return arr[i];
  }
  return undefined;
}

/**
 * Partition array by predicate
 */
export function partition<T>(arr: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];

  for (const item of arr) {
    if (predicate(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  }

  return [pass, fail];
}

/**
 * Compact array (remove falsy values)
 */
export function compact<T>(arr: (T | null | undefined | false | 0 | "")[]): T[] {
  return arr.filter(Boolean) as T[];
}

/**
 * Flatten nested arrays
 */
export function flattenArray<T>(arr: unknown[], depth: number = Infinity): T[] {
  return arr.flat(depth) as T[];
}

// =============================================================================
// SAMPLING & MOVING
// =============================================================================

/**
 * Sample random element(s) from array
 */
export function sample<T>(arr: T[], count: number = 1): T[] {
  const shuffled = shuffle(arr);
  return shuffled.slice(0, Math.min(count, arr.length));
}

/**
 * Move element in array
 */
export function move<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const item = result.splice(from, 1)[0];
  result.splice(to, 0, item);
  return result;
}
