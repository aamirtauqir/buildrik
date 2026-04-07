/**
 * Aquibra Utilities
 * Centralized utility exports
 *
 * @module utils
 * @license BSD-3-Clause
 */

// =============================================================================
// CORE HELPERS
// =============================================================================

export {
  // Types
  type AnyFunction,
  type Primitive,
  type DeepPartial,
  type Path,
  type Result,
  // ID Generation
  generateId,
  uuid,
  nanoId,
  // Object utilities
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
  // Array utilities
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
  // String utilities
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
  // Number utilities
  clamp,
  lerp,
  mapRange,
  // Function utilities
  debounce,
  throttle,
  memoize,
  once,
  // Async utilities
  retry,
  // Type guards
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isFunction,
  isNull,
  isUndefined,
  // Transaction helper
  runTransaction,
} from "./helpers";

// =============================================================================
// HTML HELPERS
// =============================================================================

export {
  // Tag utilities
  isSelfClosing,
  isBlockTag,
  isInlineTag,
  isFormTag,
  isMediaTag,
  isSemanticTag,
  isTableTag,
  isListTag,
  isTextOnlyTag,
  isInteractiveTag,
  isDeprecatedTag,
  getTagCategory,
  getDefaultTagName,
  getElementTypeFromTag,
  isContainerType,
  // Escape utilities
  escapeAttr,
  escapeHTML,
  unescapeHTML,
  encodeHTML,
  decodeHTML,
  // Sanitization
  sanitizeHTML,
  stripAllTags,
  removeTags,
  isSafeUrl,
  isSafeAttrValue,
  // HTML generation
  buildAttributeString,
  elementDataToHTML,
  createElement,
  wrapInTag,
  createComment,
  // Parsing
  parseHTML as parseHTMLToNodes,
  parseHTMLToElementData,
  parseStyleString,
  // DOM utilities
  $,
  $$,
  byId,
  byClass,
  byTag,
  createDOMElement,
  removeElement,
  replaceElement,
  insertBefore,
  insertAfter,
  appendChildren,
  clearChildren,
  cloneElement,
  matches,
  closest,
  parent,
  parents,
  siblings,
  prevSibling,
  nextSibling,
  children,
  firstChild,
  lastChild,
  getIndex,
  isInViewport,
  getRect,
  getStyle,
  setStyles,
  toggleClass,
  addClass,
  removeClass,
  hasClass,
  // Accessibility
  setAriaAttr,
  getAriaAttr,
  removeAriaAttr,
  setRole,
  getRole,
  isFocusable,
  getFocusableElements,
  trapFocus,
  announce,
  getAccessibleName,
  // SEO
  generateMetaTags,
  generateJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  // Minification
  minifyHTML,
  beautifyHTML,
  // Diff
  diffHTML,
  // Template
  template,
  compileTemplate,
  // Tag sets
  SELF_CLOSING_TAGS,
  BLOCK_TAGS,
  INLINE_TAGS,
  FORM_TAGS,
  MEDIA_TAGS,
  SEMANTIC_TAGS,
  TABLE_TAGS,
  LIST_TAGS,
  TEXT_FORMATTING_TAGS,
  TEXT_ONLY_TAGS,
  INTERACTIVE_TAGS,
  METADATA_TAGS,
  DEPRECATED_TAGS,
  VALID_ELEMENT_TYPES,
  TAG_TO_TYPE_MAP,
  TYPE_TO_TAG_MAP,
  CONTAINER_TYPES,
  DEFAULT_ALLOWED_TAGS,
  DEFAULT_ALLOWED_ATTRS,
  ALLOWED_URL_SCHEMES,
  ARIA_ROLES,
  ARIA_ATTRS,
} from "./html";

// =============================================================================
// PARSERS (CSS, Color, HTML)
// =============================================================================

export {
  // HTML parsing
  parseHTML,
  parseHTMLToFragment,
  serializeHTML,
  // CSS parsing
  parseCSS,
  parseInlineStyles,
  serializeInlineStyles,
  // Color parsing & manipulation
  parseColor,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToHwb,
  hwbToRgb,
  lighten,
  darken,
  saturate,
  desaturate,
  // Accessibility
  getLuminance,
  getContrastRatio,
  // Color blindness simulation
  simulateColorBlindness,
  // Gradient parsing
  parseGradient,
  serializeGradient,
} from "./parsers";

// =============================================================================
// DRAG & DROP
// =============================================================================

export {
  // Core functions
  findDropTargetElement,
  getElementId,
  findValidDOMTarget,
  calculateFinalIndex,
  findValidDropTargetWithFallback,
  // Drag session
  generateDragSessionId,
  // Geometry helpers
  domRectToRect,
  clampToRect,
  pointInRect,
  rectsOverlap,
  // Types
  type Point,
  type Rect,
  type ElementRect,
  type DropPosition,
  type DragState,
  type DragSourceType,
  type DragData,
  type DragDataElement,
  type DragDataBlock,
  type DragDataMulti,
  type DragDataExternal,
} from "./dragDrop";

// =============================================================================
// NESTING RULES
// =============================================================================

export {
  canNestElement,
  canHaveChildren,
  getValidChildren,
  getNestingErrorMessage,
  getSuggestedParents,
  isInteractiveType,
  isVoidType,
  isBlockType,
  isInlineType,
  isLandmarkType,
  isHeadingType,
  isSectionType,
  isFormType,
  isMediaType,
} from "./nesting";

// =============================================================================
// AI SERVICE (formerly "openai" — calls server /api/ai/*, not OpenAI directly)
// =============================================================================

export {
  getCacheStats,
  clearCache,
  getRateLimitStatus,
  getQueueLength,
  clearQueue,
  isAIError,
  getErrorMessage,
  CONTENT_TYPES,
  TONES,
  PROMPT_TEMPLATES,
  type AIRequestOptions,
  type ContentRequest,
  type LayoutRequest,
  type ImageRequest,
  type CodeRequest,
  type AIError,
  type AIResponse,
  type StreamCallbacks,
  type ContentType,
  type ToneType,
  type LayoutStyle,
  type ImageSize,
  type ImageStyle,
  type ProgrammingLanguage,
  type CodeStyle,
} from "./openai";
