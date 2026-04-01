/**
 * Nesting Utility Functions
 * Re-exports from modular files
 *
 * @module utils/nesting/utils
 * @license BSD-3-Clause
 */

// Re-export all type checking functions
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

// Re-export all tree operations
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
