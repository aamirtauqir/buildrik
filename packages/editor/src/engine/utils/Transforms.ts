/**
 * Unified Transform Functions
 * Centralized transform functions for data binding operations
 *
 * @module engine/utils/Transforms
 * @license BSD-3-Clause
 */

/**
 * Transform function type
 */
export type TransformFunction = (value: unknown) => unknown;

/**
 * Built-in string transforms
 */
export const stringTransforms: Record<string, TransformFunction> = {
  uppercase: (v) => String(v).toUpperCase(),
  lowercase: (v) => String(v).toLowerCase(),
  capitalize: (v) => {
    const str = String(v);
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },
  trim: (v) => String(v).trim(),
  slug: (v) =>
    String(v)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, ""),
};

/**
 * Built-in number transforms
 */
export const numberTransforms: Record<string, TransformFunction> = {
  number: (v) => Number(v).toLocaleString(),
  round: (v) => Math.round(Number(v)),
  floor: (v) => Math.floor(Number(v)),
  ceil: (v) => Math.ceil(Number(v)),
  abs: (v) => Math.abs(Number(v)),
  currency: (v) => `$${Number(v).toFixed(2)}`,
};

/**
 * Built-in date transforms
 */
export const dateTransforms: Record<string, TransformFunction> = {
  date: (v) => new Date(v as string | number | Date).toLocaleDateString(),
  datetime: (v) => new Date(v as string | number | Date).toLocaleString(),
  time: (v) => new Date(v as string | number | Date).toLocaleTimeString(),
  iso: (v) => new Date(v as string | number | Date).toISOString(),
};

/**
 * Built-in attribute transforms (for trait bindings)
 */
export const attributeTransforms: Record<string, TransformFunction> = {
  boolean: (value) => (value ? "true" : "false"),
  url: (value) => {
    const str = String(value);
    if (!str.startsWith("http://") && !str.startsWith("https://")) {
      return "https://" + str;
    }
    return str;
  },
  email: (value) => "mailto:" + String(value),
  tel: (value) => "tel:" + String(value).replace(/\s/g, ""),
  alt: (value) => String(value).replace(/[<>]/g, ""),
  className: (value) => String(value).toLowerCase().replace(/\s+/g, "-"),
};

/**
 * Other utility transforms
 */
export const utilityTransforms: Record<string, TransformFunction> = {
  length: (v) => (Array.isArray(v) ? v.length : String(v).length),
  json: (v) => JSON.stringify(v),
  keys: (v) => (typeof v === "object" && v !== null ? Object.keys(v) : []),
  values: (v) => (typeof v === "object" && v !== null ? Object.values(v) : []),
};

/**
 * All built-in transforms combined
 */
export const builtInTransforms: Record<string, TransformFunction> = {
  ...stringTransforms,
  ...numberTransforms,
  ...dateTransforms,
  ...attributeTransforms,
  ...utilityTransforms,
};

/**
 * Get a transform function by name or return the custom function
 * @param transform - Transform name or custom function
 * @returns The transform function or undefined if not found
 */
export function getTransformFunction(
  transform?: string | TransformFunction
): TransformFunction | undefined {
  if (typeof transform === "function") {
    return transform;
  }

  if (typeof transform === "string") {
    return builtInTransforms[transform];
  }

  return undefined;
}

/**
 * Apply a transform to a value
 * @param value - The value to transform
 * @param transform - Transform name or function
 * @param fallback - Fallback value if transform fails
 * @returns The transformed value
 */
export function applyTransform(
  value: unknown,
  transform?: string | TransformFunction,
  fallback?: unknown
): unknown {
  if (!transform) {
    return value;
  }

  const transformFn = getTransformFunction(transform);
  if (!transformFn) {
    return value;
  }

  try {
    return transformFn(value);
  } catch {
    return fallback !== undefined ? fallback : value;
  }
}

/**
 * Register a custom transform function
 * @param name - Transform name
 * @param fn - Transform function
 */
export function registerTransform(name: string, fn: TransformFunction): void {
  builtInTransforms[name] = fn;
}

/**
 * Check if a transform exists
 * @param name - Transform name
 * @returns true if the transform exists
 */
export function hasTransform(name: string): boolean {
  return name in builtInTransforms;
}
