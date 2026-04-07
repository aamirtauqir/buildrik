/**
 * HTML Tag Sets
 * Re-exports all tag categorization sets
 *
 * @module utils/html/tagSets
 * @license BSD-3-Clause
 */

// Re-export basic tag sets
export {
  SELF_CLOSING_TAGS,
  BLOCK_TAGS,
  INLINE_TAGS,
  FORM_TAGS,
  MEDIA_TAGS,
  SEMANTIC_TAGS,
  TABLE_TAGS,
  LIST_TAGS,
} from "./tagSetsBasic";

// Re-export extended tag sets
export {
  TEXT_FORMATTING_TAGS,
  TEXT_ONLY_TAGS,
  INTERACTIVE_TAGS,
  METADATA_TAGS,
  DEPRECATED_TAGS,
} from "./tagSetsExtended";
