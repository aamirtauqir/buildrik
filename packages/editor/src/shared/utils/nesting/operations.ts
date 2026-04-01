/**
 * Tree Operations and Restructuring
 * Move, paste, wrap, and unwrap operations
 *
 * @module utils/nesting/operations
 * @license BSD-3-Clause
 */

import type { ElementType } from "../../types";
import { FORBIDDEN_NESTING, ALLOWED_CHILDREN } from "./derived";
import { findElementById, getParentElement, cloneTree } from "./treeOps";
import { canHaveChildren, isInteractiveType } from "./typeChecks";
import type { MoveValidationResult, ValidationOptions, AutoFixSuggestion } from "./types";
import { canNestElement, canNestElementStrict, getValidDropTargets } from "./validator";

// =============================================================================
// MOVE VALIDATION
// =============================================================================

/**
 * Check if element can be moved to a new parent
 */
export function canMoveElement(
  elementType: ElementType,
  newParentType: ElementType,
  elementChildren?: { type: ElementType }[],
  options: { strictMode?: boolean } = {}
): MoveValidationResult {
  const { strictMode = false } = options;

  const nestingCheck = strictMode
    ? canNestElementStrict(elementType, newParentType)
    : canNestElement(elementType, newParentType);

  if (!nestingCheck) {
    return {
      allowed: false,
      reason: getNestingErrorMessage(elementType, newParentType),
      suggestions: getSuggestedParents(elementType, 5),
    };
  }

  const wouldCauseIssues: string[] = [];
  if (elementChildren && elementChildren.length > 0) {
    for (const child of elementChildren) {
      if (!canNestElement(child.type, elementType)) {
        wouldCauseIssues.push(`Child ${child.type} would become invalid after move`);
      }
    }
  }

  if (wouldCauseIssues.length > 0) {
    return {
      allowed: false,
      reason: wouldCauseIssues[0],
      wouldCauseIssues,
    };
  }

  return { allowed: true };
}

/**
 * Validate bulk move operation
 */
export function validateBulkMove(
  elements: { type: ElementType; children?: { type: ElementType }[] }[],
  targetParentType: ElementType,
  options: { strictMode?: boolean } = {}
): { valid: boolean; invalidElements: { element: ElementType; reason: string }[] } {
  const invalidElements: { element: ElementType; reason: string }[] = [];

  for (const element of elements) {
    const result = canMoveElement(element.type, targetParentType, element.children, options);
    if (!result.allowed) {
      invalidElements.push({
        element: element.type,
        reason: result.reason || "Unknown error",
      });
    }
  }

  return {
    valid: invalidElements.length === 0,
    invalidElements,
  };
}

/**
 * Validate copy/paste operation
 */
export function validatePaste(
  clipboardElements: { type: ElementType; children?: unknown[] }[],
  targetParentType: ElementType,
  _options: ValidationOptions = {}
): { valid: boolean; errors: string[]; validElements: number } {
  const errors: string[] = [];
  let validElements = 0;

  for (const element of clipboardElements) {
    const canPaste = canNestElement(element.type, targetParentType);
    if (canPaste) {
      validElements++;
    } else {
      errors.push(`Cannot paste ${element.type} into ${targetParentType}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validElements,
  };
}

// =============================================================================
// ERROR MESSAGES & SUGGESTIONS
// =============================================================================

/**
 * Get a human-readable error message for invalid nesting
 */
export function getNestingErrorMessage(childType: ElementType, parentType: ElementType): string {
  if (!canHaveChildren(parentType)) {
    return `${parentType} elements cannot contain child elements (void element)`;
  }

  const forbidden = FORBIDDEN_NESTING[parentType] || [];
  if (forbidden.includes(childType)) {
    return `${childType} cannot be placed inside ${parentType} (HTML restriction)`;
  }

  const allowed = ALLOWED_CHILDREN[parentType];
  if (allowed && !allowed.includes(childType)) {
    return `${parentType} only allows specific children: ${allowed.join(", ")}`;
  }

  if (isInteractiveType(childType) && isInteractiveType(parentType)) {
    return `Interactive elements (${childType}) cannot be nested inside other interactive elements (${parentType})`;
  }

  return `${childType} cannot be nested inside ${parentType}`;
}

/**
 * Get suggestion for valid parents when nesting fails
 */
export function getSuggestedParents(childType: ElementType, limit: number = 5): ElementType[] {
  const validTargets = getValidDropTargets(childType);

  const priority: ElementType[] = [
    "container",
    "section",
    "flex",
    "grid",
    "card",
    "columns",
    "form",
  ];

  const sorted = [
    ...priority.filter((t) => validTargets.includes(t)),
    ...validTargets.filter((t) => !priority.includes(t)),
  ];

  return sorted.slice(0, limit);
}

/**
 * Get suggested fix for invalid nesting
 */
export function getSuggestedFix(childType: ElementType, parentType: ElementType): string {
  const suggestions = getSuggestedParents(childType, 3);

  if (suggestions.length > 0) {
    return `Try placing ${childType} inside: ${suggestions.join(", ")}`;
  }

  if (isInteractiveType(childType) && isInteractiveType(parentType)) {
    return `Move ${childType} outside of ${parentType}`;
  }

  if (!canHaveChildren(parentType)) {
    return `${parentType} cannot have children. Try using a container instead.`;
  }

  return `Consider restructuring the layout`;
}

/**
 * Get auto-fix suggestions for a tree
 */
interface TreeElement {
  type: ElementType;
  children?: TreeElement[];
  id?: string;
}

export function getAutoFixSuggestions(
  element: TreeElement,
  parentType?: ElementType
): AutoFixSuggestion[] {
  const suggestions: AutoFixSuggestion[] = [];

  if (parentType && !canNestElement(element.type, parentType)) {
    if (canNestElement("container", parentType) && canNestElement(element.type, "container")) {
      suggestions.push({
        type: "wrap",
        elementId: element.id,
        wrapperType: "container",
        description: `Wrap ${element.type} in a container`,
      });
    }

    const validParents = getSuggestedParents(element.type, 3);
    if (validParents.length > 0) {
      suggestions.push({
        type: "move",
        elementId: element.id,
        targetParentType: validParents[0],
        description: `Move ${element.type} to ${validParents[0]}`,
      });
    }
  }

  if (element.children) {
    for (const child of element.children) {
      suggestions.push(...getAutoFixSuggestions(child, element.type));
    }
  }

  return suggestions;
}

// =============================================================================
// TREE RESTRUCTURING
// =============================================================================

/**
 * Safely reparent an element
 */
export function reparentElement<T extends { type: ElementType; id?: string; children?: T[] }>(
  tree: T,
  elementId: string,
  newParentId: string,
  index?: number
): { success: boolean; tree: T; error?: string } {
  const element = findElementById(tree, elementId);
  if (!element) {
    return { success: false, tree, error: "Element not found" };
  }

  const newParent = findElementById(tree, newParentId);
  if (!newParent) {
    return { success: false, tree, error: "New parent not found" };
  }

  const validation = canMoveElement(element.type, newParent.type, element.children);
  if (!validation.allowed) {
    return { success: false, tree, error: validation.reason };
  }

  const newTree = cloneTree(tree);
  const currentParent = getParentElement(newTree, elementId);

  if (currentParent?.children) {
    const elementIndex = currentParent.children.findIndex((c) => c.id === elementId);
    if (elementIndex !== -1) {
      currentParent.children.splice(elementIndex, 1);
    }
  }

  const newParentInTree = findElementById(newTree, newParentId);
  if (newParentInTree) {
    if (!newParentInTree.children) {
      newParentInTree.children = [];
    }
    const elementClone = findElementById(cloneTree(tree), elementId)!;
    if (index !== undefined && index >= 0 && index <= newParentInTree.children.length) {
      newParentInTree.children.splice(index, 0, elementClone);
    } else {
      newParentInTree.children.push(elementClone);
    }
  }

  return { success: true, tree: newTree };
}

/**
 * Wrap element in a container
 */
export function wrapElement<T extends { type: ElementType; id?: string; children?: T[] }>(
  tree: T,
  elementId: string,
  wrapperType: ElementType,
  wrapperId?: string
): { success: boolean; tree: T; wrapperId?: string; error?: string } {
  const element = findElementById(tree, elementId);
  if (!element) {
    return { success: false, tree, error: "Element not found" };
  }

  const parent = getParentElement(tree, elementId);
  if (!parent) {
    return { success: false, tree, error: "Cannot wrap root element" };
  }

  if (!canNestElement(wrapperType, parent.type)) {
    return { success: false, tree, error: `Cannot place ${wrapperType} in ${parent.type}` };
  }

  if (!canNestElement(element.type, wrapperType)) {
    return { success: false, tree, error: `Cannot place ${element.type} in ${wrapperType}` };
  }

  const newTree = cloneTree(tree);
  const parentInTree = getParentElement(newTree, elementId);

  if (parentInTree?.children) {
    const index = parentInTree.children.findIndex((c) => c.id === elementId);
    if (index !== -1) {
      const elementToWrap = parentInTree.children[index];
      const newWrapperId = wrapperId || `wrapper-${Date.now()}`;

      const wrapper = {
        type: wrapperType,
        id: newWrapperId,
        children: [elementToWrap],
      } as T;

      parentInTree.children.splice(index, 1, wrapper);
      return { success: true, tree: newTree, wrapperId: newWrapperId };
    }
  }

  return { success: false, tree, error: "Failed to wrap element" };
}

/**
 * Unwrap element (move children to parent, remove wrapper)
 */
export function unwrapElement<T extends { type: ElementType; id?: string; children?: T[] }>(
  tree: T,
  wrapperId: string
): { success: boolean; tree: T; error?: string } {
  const wrapper = findElementById(tree, wrapperId);
  if (!wrapper) {
    return { success: false, tree, error: "Wrapper not found" };
  }

  if (!wrapper.children || wrapper.children.length === 0) {
    return { success: false, tree, error: "Wrapper has no children" };
  }

  const parent = getParentElement(tree, wrapperId);
  if (!parent) {
    return { success: false, tree, error: "Cannot unwrap root element" };
  }

  for (const child of wrapper.children) {
    if (!canNestElement(child.type, parent.type)) {
      return {
        success: false,
        tree,
        error: `Cannot move ${child.type} to ${parent.type}`,
      };
    }
  }

  const newTree = cloneTree(tree);
  const parentInTree = getParentElement(newTree, wrapperId);

  if (parentInTree?.children) {
    const index = parentInTree.children.findIndex((c) => c.id === wrapperId);
    if (index !== -1) {
      const wrapperInTree = parentInTree.children[index];
      const childrenToMove = wrapperInTree.children || [];
      parentInTree.children.splice(index, 1, ...childrenToMove);
      return { success: true, tree: newTree };
    }
  }

  return { success: false, tree, error: "Failed to unwrap element" };
}
