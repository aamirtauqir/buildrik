/**
 * HTML Tag Categories
 * Tag classification functions
 *
 * @module utils/html/tagCategories
 * @license BSD-3-Clause
 */

// Re-export tag sets for convenience
export {
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
} from "./tagSets";

import {
  SELF_CLOSING_TAGS,
  BLOCK_TAGS,
  INLINE_TAGS,
  FORM_TAGS,
  MEDIA_TAGS,
  SEMANTIC_TAGS,
  TABLE_TAGS,
  LIST_TAGS,
  TEXT_ONLY_TAGS,
  INTERACTIVE_TAGS,
  METADATA_TAGS,
  DEPRECATED_TAGS,
} from "./tagSets";

// =============================================================================
// TAG CLASSIFICATION FUNCTIONS
// =============================================================================

/**
 * Check if a tag is self-closing
 */
export function isSelfClosing(tag: string): boolean {
  return SELF_CLOSING_TAGS.has(tag.toLowerCase());
}

/**
 * Check if a tag is a block element
 */
export function isBlockTag(tag: string): boolean {
  return BLOCK_TAGS.has(tag.toLowerCase());
}

/**
 * Check if a tag is an inline element
 */
export function isInlineTag(tag: string): boolean {
  return INLINE_TAGS.has(tag.toLowerCase());
}

/**
 * Check if a tag is a form element
 */
export function isFormTag(tag: string): boolean {
  return FORM_TAGS.has(tag.toLowerCase());
}

/**
 * Check if a tag is a media element
 */
export function isMediaTag(tag: string): boolean {
  return MEDIA_TAGS.has(tag.toLowerCase());
}

/**
 * Check if a tag is a semantic element
 */
export function isSemanticTag(tag: string): boolean {
  return SEMANTIC_TAGS.has(tag.toLowerCase());
}

/**
 * Check if a tag is a table element
 */
export function isTableTag(tag: string): boolean {
  return TABLE_TAGS.has(tag.toLowerCase());
}

/**
 * Check if a tag is a list element
 */
export function isListTag(tag: string): boolean {
  return LIST_TAGS.has(tag.toLowerCase());
}

/**
 * Check if a tag can only contain text
 */
export function isTextOnlyTag(tag: string): boolean {
  return TEXT_ONLY_TAGS.has(tag.toLowerCase());
}

/**
 * Check if a tag is interactive
 */
export function isInteractiveTag(tag: string): boolean {
  return INTERACTIVE_TAGS.has(tag.toLowerCase());
}

/**
 * Check if a tag is deprecated
 */
export function isDeprecatedTag(tag: string): boolean {
  return DEPRECATED_TAGS.has(tag.toLowerCase());
}

/**
 * Check if a tag is a metadata element
 */
export function isMetadataTag(tag: string): boolean {
  return METADATA_TAGS.has(tag.toLowerCase());
}

/**
 * Get tag category
 */
export type TagCategory =
  | "block"
  | "inline"
  | "form"
  | "media"
  | "semantic"
  | "table"
  | "list"
  | "metadata"
  | "deprecated"
  | "unknown";

export function getTagCategory(tag: string): TagCategory {
  const t = tag.toLowerCase();
  if (isDeprecatedTag(t)) return "deprecated";
  if (isMetadataTag(t)) return "metadata";
  if (isTableTag(t)) return "table";
  if (isListTag(t)) return "list";
  if (isFormTag(t)) return "form";
  if (isMediaTag(t)) return "media";
  if (isSemanticTag(t)) return "semantic";
  if (isBlockTag(t)) return "block";
  if (isInlineTag(t)) return "inline";
  return "unknown";
}
