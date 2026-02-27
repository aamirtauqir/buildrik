/**
 * Aquibra JSON Patch Utility
 * Efficient diff-based state management for undo/redo
 *
 * Implements a subset of RFC 6902 JSON Patch format
 * Optimized for Aquibra's ProjectData structure
 *
 * @module engine/utils/JsonPatch
 * @license BSD-3-Clause
 */

/**
 * Patch operation types
 */
export type PatchOperationType = "add" | "remove" | "replace";

/**
 * Single patch operation
 */
export interface PatchOperation {
  /** Operation type */
  op: PatchOperationType;
  /** JSON pointer path (e.g., "/pages/0/root/children/1") */
  path: string;
  /** Value for add/replace operations */
  value?: unknown;
  /** Previous value for reverse operations */
  oldValue?: unknown;
}

/**
 * A patch is an array of operations
 */
export type Patch = PatchOperation[];

/**
 * Create a patch that transforms `oldObj` into `newObj`
 * Returns an array of operations that can be applied/reversed
 */
export function createPatch(oldObj: unknown, newObj: unknown, path: string = ""): Patch {
  const patch: Patch = [];

  // Handle null/undefined
  if (oldObj === newObj) {
    return patch;
  }

  if (oldObj === null || oldObj === undefined) {
    if (newObj !== null && newObj !== undefined) {
      patch.push({ op: "add", path: path || "/", value: deepCloneValue(newObj) });
    }
    return patch;
  }

  if (newObj === null || newObj === undefined) {
    patch.push({ op: "remove", path: path || "/", oldValue: deepCloneValue(oldObj) });
    return patch;
  }

  // Different types
  if (typeof oldObj !== typeof newObj) {
    patch.push({
      op: "replace",
      path: path || "/",
      value: deepCloneValue(newObj),
      oldValue: deepCloneValue(oldObj),
    });
    return patch;
  }

  // Primitives
  if (typeof oldObj !== "object") {
    if (oldObj !== newObj) {
      patch.push({
        op: "replace",
        path: path || "/",
        value: newObj,
        oldValue: oldObj,
      });
    }
    return patch;
  }

  // Arrays
  if (Array.isArray(oldObj) && Array.isArray(newObj)) {
    return createArrayPatch(oldObj, newObj, path);
  }

  // Objects
  if (isPlainObject(oldObj) && isPlainObject(newObj)) {
    return createObjectPatch(
      oldObj as Record<string, unknown>,
      newObj as Record<string, unknown>,
      path
    );
  }

  // Fallback: replace entirely
  patch.push({
    op: "replace",
    path: path || "/",
    value: deepCloneValue(newObj),
    oldValue: deepCloneValue(oldObj),
  });

  return patch;
}

/**
 * Create patch for object differences
 */
function createObjectPatch(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  basePath: string
): Patch {
  const patch: Patch = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const escapedKey = escapeJsonPointer(key);
    const keyPath = `${basePath}/${escapedKey}`;
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    if (!(key in oldObj)) {
      // Key added
      patch.push({ op: "add", path: keyPath, value: deepCloneValue(newVal) });
    } else if (!(key in newObj)) {
      // Key removed
      patch.push({ op: "remove", path: keyPath, oldValue: deepCloneValue(oldVal) });
    } else {
      // Key exists in both, recurse
      patch.push(...createPatch(oldVal, newVal, keyPath));
    }
  }

  return patch;
}

/**
 * Create patch for array differences
 * Uses a simple approach: compare by index
 * For large arrays with insertions/deletions, this may not be optimal
 * but it's correct and works well for typical Aquibra use cases
 */
function createArrayPatch(oldArr: unknown[], newArr: unknown[], basePath: string): Patch {
  const patch: Patch = [];
  const maxLen = Math.max(oldArr.length, newArr.length);

  for (let i = 0; i < maxLen; i++) {
    const indexPath = `${basePath}/${i}`;

    if (i >= oldArr.length) {
      // New element added
      patch.push({ op: "add", path: indexPath, value: deepCloneValue(newArr[i]) });
    } else if (i >= newArr.length) {
      // Element removed (process removals in reverse order later)
      patch.push({ op: "remove", path: indexPath, oldValue: deepCloneValue(oldArr[i]) });
    } else {
      // Element at same index, check for differences
      patch.push(...createPatch(oldArr[i], newArr[i], indexPath));
    }
  }

  return patch;
}

/**
 * Apply a patch to an object, returning a new object
 * Does not mutate the original
 */
export function applyPatch<T>(obj: T, patch: Patch): T {
  if (patch.length === 0) {
    return obj;
  }

  // Deep clone to avoid mutation
  let result = deepCloneValue(obj) as T;

  for (const op of patch) {
    result = applySingleOperation(result, op) as T;
  }

  return result;
}

/**
 * Apply a single patch operation
 */
function applySingleOperation(obj: unknown, op: PatchOperation): unknown {
  const { path, value } = op;

  // Handle root path
  if (path === "/" || path === "") {
    if (op.op === "add" || op.op === "replace") {
      return deepCloneValue(value);
    }
    if (op.op === "remove") {
      return undefined;
    }
  }

  const segments = parseJsonPointer(path);
  const lastSegment = segments.pop()!;

  // Navigate to parent
  let current: unknown = obj;
  for (const segment of segments) {
    if (current === null || current === undefined) {
      throw new Error(`Cannot navigate path: ${path}`);
    }
    if (Array.isArray(current)) {
      const index = parseInt(segment, 10);
      current = current[index];
    } else if (typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    }
  }

  // Apply operation
  if (Array.isArray(current)) {
    const index = parseInt(lastSegment, 10);
    switch (op.op) {
      case "add":
        current.splice(index, 0, deepCloneValue(value));
        break;
      case "remove":
        current.splice(index, 1);
        break;
      case "replace":
        current[index] = deepCloneValue(value);
        break;
    }
  } else if (typeof current === "object" && current !== null) {
    const record = current as Record<string, unknown>;
    switch (op.op) {
      case "add":
      case "replace":
        record[lastSegment] = deepCloneValue(value);
        break;
      case "remove":
        delete record[lastSegment];
        break;
    }
  }

  return obj;
}

/**
 * Reverse a patch - creates a patch that undoes the original
 */
export function reversePatch(patch: Patch): Patch {
  const reversed: Patch = [];

  // Process in reverse order
  for (let i = patch.length - 1; i >= 0; i--) {
    const op = patch[i];

    switch (op.op) {
      case "add":
        // Reverse of add is remove
        reversed.push({
          op: "remove",
          path: op.path,
          oldValue: op.value,
        });
        break;
      case "remove":
        // Reverse of remove is add
        reversed.push({
          op: "add",
          path: op.path,
          value: op.oldValue,
        });
        break;
      case "replace":
        // Reverse of replace is replace with old value
        reversed.push({
          op: "replace",
          path: op.path,
          value: op.oldValue,
          oldValue: op.value,
        });
        break;
    }
  }

  return reversed;
}

/**
 * Calculate approximate memory size of a patch
 */
export function getPatchSize(patch: Patch): number {
  return JSON.stringify(patch).length;
}

/**
 * Check if a patch is empty (no changes)
 */
export function isPatchEmpty(patch: Patch): boolean {
  return patch.length === 0;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Escape special characters in JSON pointer segment
 */
function escapeJsonPointer(segment: string): string {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}

/**
 * Parse JSON pointer path into segments
 */
function parseJsonPointer(path: string): string[] {
  if (path === "" || path === "/") {
    return [];
  }

  return path
    .split("/")
    .slice(1) // Remove leading empty string from split
    .map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"));
}

/**
 * Check if value is a plain object
 */
function isPlainObject(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Deep clone a value
 */
function deepCloneValue<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(deepCloneValue) as T;
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    result[key] = deepCloneValue((value as Record<string, unknown>)[key]);
  }
  return result as T;
}
