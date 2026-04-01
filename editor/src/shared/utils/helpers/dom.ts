/**
 * Aquibra Helpers - DOM Utilities
 * DOM manipulation and class name utilities
 *
 * @module utils/helpers/dom
 * @license BSD-3-Clause
 */

// =============================================================================
// CLASS NAMES
// =============================================================================

/**
 * Combine class names (like clsx/classnames)
 */
export function classNames(
  ...args: (string | Record<string, boolean> | undefined | null | false)[]
): string {
  const classes: string[] = [];

  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === "string") {
      classes.push(arg);
    } else if (typeof arg === "object") {
      for (const key in arg) {
        if (arg[key]) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(" ");
}

// =============================================================================
// DATASET
// =============================================================================

/**
 * Parse dataset values
 */
export function parseDataset<T extends Record<string, unknown>>(dataset: DOMStringMap): T {
  const result: Record<string, unknown> = {};

  for (const key in dataset) {
    const value = dataset[key];
    if (value === undefined) continue;

    // Try to parse as JSON
    try {
      result[key] = JSON.parse(value);
    } catch {
      result[key] = value;
    }
  }

  return result as T;
}
