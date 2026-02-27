/**
 * HTML Nesting Validation Rules - Pro Level
 * Comprehensive nesting validation based on HTML5 specification
 * Includes content models, accessibility rules, and tree operations
 *
 * @module utils/nesting
 * @license BSD-3-Clause
 */

// =============================================================================
// TYPES EXPORTS
// =============================================================================

export {
  MAX_NESTING_DEPTH,
  RECOMMENDED_MAX_DEPTH,
  MAX_CHILDREN_COUNT,
  ElementCategory,
  LandmarkRole,
  type HeadingLevel,
  type ElementRule,
  type ValidationIssue,
  type TreeStatistics,
  type TreeValidationResult,
  type ValidationOptions,
  type MoveValidationResult,
  type AutoFixSuggestion,
  type TreeAnalysis,
} from "./types";

// =============================================================================
// RULES EXPORTS
// =============================================================================

export { ELEMENT_RULES, STRICT_HTML5_RULES } from "./rules";

// =============================================================================
// DERIVED EXPORTS
// =============================================================================

export {
  ELEMENT_TYPES,
  ELEMENT_CATEGORIES,
  CAN_HAVE_CHILDREN_SET,
  CAN_HAVE_CHILDREN,
  FORBIDDEN_NESTING,
  ALLOWED_CHILDREN,
  NESTING_RULES,
  FORBIDDEN_NESTING_SET,
  ALLOWED_CHILDREN_SET,
  ALLOWED_CATEGORIES_BY_PARENT,
  LANDMARK_ELEMENTS,
  INTERACTIVE_ELEMENTS,
} from "./derived";

// =============================================================================
// CONFIG RE-EXPORTS (for backwards compatibility)
// =============================================================================

export * from "./config";

// =============================================================================
// TYPE CHECKS EXPORTS
// =============================================================================

export {
  isInteractiveType,
  isVoidType,
  isContainerType,
  isBlockType,
  isInlineType,
  isLandmarkType,
  isHeadingType,
  isSectionType,
  isFormType,
  isMediaType,
  getPrimaryCategory,
  getElementsByCategory,
  getImplicitRole,
  getLandmarkRole,
  getHeadingLevel,
  canHaveChildren,
} from "./typeChecks";

// =============================================================================
// TREE OPS EXPORTS
// =============================================================================

export {
  findElementById,
  findElement,
  findAllElements,
  getAncestryPath,
  getParentElement,
  getSiblings,
  getElementDepth,
  findCommonAncestor,
  cloneTree,
  mapTree,
  filterTree,
  flattenTree,
  countElements,
  analyzeTree,
} from "./treeOps";

// =============================================================================
// UTILS RE-EXPORTS (for backwards compatibility)
// =============================================================================

export * from "./utils";

// =============================================================================
// VALIDATOR EXPORTS
// =============================================================================

export {
  canNestElement,
  canNestElementStrict,
  getValidDropTargets,
  getValidChildren,
  clearNestingCaches,
  validateElementTree,
  isValidNesting,
} from "./validator";

// =============================================================================
// OPERATIONS EXPORTS
// =============================================================================

export {
  canMoveElement,
  validateBulkMove,
  validatePaste,
  getNestingErrorMessage,
  getSuggestedParents,
  getSuggestedFix,
  getAutoFixSuggestions,
  reparentElement,
  wrapElement,
  unwrapElement,
} from "./operations";

// =============================================================================
// COMBINED NAMESPACE EXPORT
// =============================================================================

import {
  canMoveElement,
  validateBulkMove,
  validatePaste,
  getNestingErrorMessage,
  getSuggestedParents,
  getSuggestedFix,
  getAutoFixSuggestions,
  reparentElement,
  wrapElement,
  unwrapElement,
} from "./operations";
import {
  findElementById,
  findElement,
  findAllElements,
  getAncestryPath,
  getParentElement,
  getSiblings,
  getElementDepth,
  findCommonAncestor,
  cloneTree,
  mapTree,
  filterTree,
  flattenTree,
  countElements,
  analyzeTree,
} from "./treeOps";
import {
  canHaveChildren,
  isInteractiveType,
  isVoidType,
  isContainerType,
  isBlockType,
  isInlineType,
  isLandmarkType,
  isHeadingType,
  isSectionType,
  isFormType,
  isMediaType,
  getPrimaryCategory,
  getElementsByCategory,
  getImplicitRole,
  getLandmarkRole,
  getHeadingLevel,
} from "./typeChecks";
import {
  canNestElement,
  canNestElementStrict,
  getValidDropTargets,
  getValidChildren,
  clearNestingCaches,
  validateElementTree,
  isValidNesting,
} from "./validator";

/**
 * Combined nestingRules namespace for backwards compatibility
 */
export const nestingRules = {
  canNestElement,
  canNestElementStrict,
  canHaveChildren,
  getValidDropTargets,
  getValidChildren,
  clearNestingCaches,
  validateElementTree,
  isValidNesting,
  canMoveElement,
  validateBulkMove,
  validatePaste,
  getNestingErrorMessage,
  getSuggestedParents,
  getSuggestedFix,
  getAutoFixSuggestions,
  findElementById,
  findElement,
  findAllElements,
  getAncestryPath,
  getParentElement,
  getSiblings,
  getElementDepth,
  findCommonAncestor,
  cloneTree,
  mapTree,
  filterTree,
  flattenTree,
  countElements,
  reparentElement,
  wrapElement,
  unwrapElement,
  isInteractiveType,
  isVoidType,
  isContainerType,
  isBlockType,
  isInlineType,
  isLandmarkType,
  isHeadingType,
  isSectionType,
  isFormType,
  isMediaType,
  getPrimaryCategory,
  getElementsByCategory,
  getImplicitRole,
  getLandmarkRole,
  getHeadingLevel,
  analyzeTree,
};

export default nestingRules;
