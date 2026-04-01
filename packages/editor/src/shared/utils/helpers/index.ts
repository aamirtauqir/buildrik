/**
 * Aquibra Helpers - Central Export
 * Re-exports all helper utilities from organized modules
 *
 * @module utils/helpers
 * @license BSD-3-Clause
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  AnyFunction,
  StrictFunction,
  Primitive,
  DeepPartial,
  Path,
  Result,
  EventHandler,
  EventEmitter,
  TreeNode,
  DebouncedFunction,
  ThrottledFunction,
  PromiseLikeShape,
} from "./types";

// =============================================================================
// ID GENERATION
// =============================================================================

export { generateId, uuid, nanoId, createSequentialId, hashString } from "./id";

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

export {
  trimArray,
  trimArrayStart,
  unique,
  uniqueBy,
  groupBy,
  sortBy,
  chunk,
  shuffle,
  range,
  zip,
  unzip,
  difference,
  intersection,
  union,
  first,
  last,
  partition,
  compact,
  flattenArray,
  sample,
  move,
} from "./array";

// =============================================================================
// OBJECT UTILITIES
// =============================================================================

export {
  deepClone,
  deepMerge,
  deepEqual,
  shallowEqual,
  pick,
  omit,
  get,
  set,
  has,
  flatten,
  unflatten,
  mapValues,
  mapKeys,
  filterObject,
  invert,
} from "./object";

// =============================================================================
// STRING UTILITIES
// =============================================================================

export {
  capitalize,
  titleCase,
  camelCase,
  snakeCase,
  kebabCase,
  camelToKebab,
  kebabToCamel,
  slugify,
  truncate,
  truncateMiddle,
  pad,
  stripHtml,
  wordCount,
  template,
  escapeRegExp,
  randomString,
} from "./string";

// =============================================================================
// NUMBER UTILITIES
// =============================================================================

export {
  clamp,
  parseNumericValue,
  inRange,
  lerp,
  inverseLerp,
  mapRange,
  round,
  random,
  randomInt,
  percentage,
  formatNumber,
  formatBytes,
  parseNumber,
  sum,
  average,
  min,
  max,
} from "./number";

// =============================================================================
// TYPE GUARDS
// =============================================================================

export {
  isPlainObject,
  isObject,
  isArray,
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isUndefined,
  isNull,
  isNil,
  isSymbol,
  isPrimitive,
  isDate,
  isRegExp,
  isPromise,
  isEmpty,
} from "./typeGuards";

// =============================================================================
// VALIDATION
// =============================================================================

export { isEmail, isUrl, isJSON, parseJSON, isHexColor, isPhoneNumber } from "./validation";

// =============================================================================
// ASYNC UTILITIES
// =============================================================================

export { wait, retry, timeout, parallel, series, debounceAsync } from "./async";

// =============================================================================
// FUNCTION UTILITIES
// =============================================================================

export {
  debounce,
  throttle,
  memoize,
  once,
  pipe,
  compose,
  curry,
  partial,
  negate,
} from "./function";

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

export { measureTime, raf, idle, batchUpdate, nextTick } from "./performance";

// =============================================================================
// EVENT EMITTER
// =============================================================================

export { createEventEmitter } from "./events";

// =============================================================================
// RESULT TYPE (ERROR HANDLING)
// =============================================================================

export { ok, err, tryCatch, tryCatchAsync, unwrap, unwrapOr } from "./result";

// =============================================================================
// TREE UTILITIES
// =============================================================================

export { getChildren, forEachDescendant, getAllDescendants } from "./tree";

// =============================================================================
// DOM UTILITIES
// =============================================================================

export { classNames, parseDataset } from "./dom";

// =============================================================================
// STORAGE UTILITIES
// =============================================================================

export { storage } from "./storage";

// =============================================================================
// TRANSACTION HELPER
// =============================================================================

export { runTransaction } from "./transaction";
