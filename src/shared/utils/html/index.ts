/**
 * HTML Utilities Index
 * Re-exports all HTML utility functions and types
 *
 * @module utils/html
 * @license BSD-3-Clause
 */

// =============================================================================
// TAG CATEGORIES
// =============================================================================

export {
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
  // Classification functions
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
  isMetadataTag,
  getTagCategory,
  // Types
  type TagCategory,
} from "./tagCategories";

// =============================================================================
// TYPE MAPPING
// =============================================================================

export {
  VALID_ELEMENT_TYPES,
  TAG_TO_TYPE_MAP,
  TYPE_TO_TAG_MAP,
  CONTAINER_TYPES,
  getDefaultTagName,
  getElementTypeFromTag,
  isContainerType,
} from "./typeMapping";

// =============================================================================
// ENCODING
// =============================================================================

export { escapeAttr, escapeHTML, unescapeHTML, encodeHTML, decodeHTML } from "./encoding";

// =============================================================================
// SANITIZATION
// =============================================================================

export {
  DEFAULT_ALLOWED_TAGS,
  DEFAULT_ALLOWED_ATTRS,
  ALLOWED_URL_SCHEMES,
  sanitizeHTML,
  stripAllTags,
  removeTags,
  isSafeUrl,
  isSafeAttrValue,
  type SanitizeOptions,
} from "./sanitization";

// =============================================================================
// GENERATION
// =============================================================================

export {
  buildAttributeString,
  elementDataToHTML,
  createElement,
  wrapInTag,
  createComment,
  type HTMLGenerationOptions,
} from "./generation";

// =============================================================================
// PARSING
// =============================================================================

export { parseHTML, parseHTMLToElementData, parseStyleString, type ParsedNode } from "./parsing";

// =============================================================================
// DOM UTILITIES
// =============================================================================

export {
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
} from "./dom";

// =============================================================================
// ACCESSIBILITY
// =============================================================================

export {
  ARIA_ROLES,
  ARIA_ATTRS,
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
} from "./accessibility";

// =============================================================================
// SEO
// =============================================================================

export {
  generateMetaTags,
  generateJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  type MetaTagConfig,
  type StructuredDataType,
} from "./seo";

// =============================================================================
// FORMATTING
// =============================================================================

export { minifyHTML, beautifyHTML, type MinifyOptions } from "./formatting";

// =============================================================================
// DIFFING
// =============================================================================

export { diffHTML, type DiffType, type HTMLDiff } from "./diffing";

// =============================================================================
// TEMPLATE
// =============================================================================

export { template, compileTemplate, type TemplateOptions } from "./template";
