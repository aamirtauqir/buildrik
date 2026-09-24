/**
 * Core Nesting Validation Functions
 * Nesting checks and tree validation
 *
 * @module utils/nesting/validator
 * @license BSD-3-Clause
 */

import type { ElementType } from "../../types";
import {
  ELEMENT_TYPES,
  ELEMENT_CATEGORIES,
  CAN_HAVE_CHILDREN_SET,
  FORBIDDEN_NESTING_SET,
  ALLOWED_CHILDREN_SET,
  ALLOWED_CATEGORIES_BY_PARENT,
} from "./derived";
import { STRICT_HTML5_RULES } from "./rules";
import { canHaveChildren } from "./typeChecks";

// =============================================================================
// CACHES
// =============================================================================

const VALID_DROP_TARGETS_CACHE = new Map<ElementType, ElementType[]>();
const VALID_CHILDREN_CACHE = new Map<ElementType, ElementType[]>();
const NESTING_MATRIX_CACHE = new Map<string, boolean>();

// =============================================================================
// CORE NESTING FUNCTIONS
// =============================================================================

/**
 * Check if a child element can be nested inside a parent element
 * O(1) lookup using pre-computed Sets
 */
export function canNestElement(childType: ElementType, parentType: ElementType): boolean {
  const cacheKey = `${childType}:${parentType}`;
  const cached = NESTING_MATRIX_CACHE.get(cacheKey);
  if (cached !== undefined) return cached;

  const result = checkNesting(childType, parentType);
  NESTING_MATRIX_CACHE.set(cacheKey, result);
  return result;
}

/**
 * Internal nesting check (without caching)
 */
function checkNesting(childType: ElementType, parentType: ElementType): boolean {
  if (!CAN_HAVE_CHILDREN_SET.has(parentType)) {
    return false;
  }

  const allowedSet = ALLOWED_CHILDREN_SET[parentType];
  if (allowedSet && !allowedSet.has(childType)) {
    return false;
  }

  const forbidden = FORBIDDEN_NESTING_SET[parentType];
  if (forbidden?.has(childType)) {
    return false;
  }

  const childCategories = ELEMENT_CATEGORIES[childType];
  if (!childCategories) return false;

  const allowedChildCategories = ALLOWED_CATEGORIES_BY_PARENT[parentType];
  if (!allowedChildCategories) return false;

  return childCategories.some((childCat) => allowedChildCategories.has(childCat));
}

/**
 * Get valid drop targets for an element type (cached)
 */
export function getValidDropTargets(elementType: ElementType): ElementType[] {
  const cached = VALID_DROP_TARGETS_CACHE.get(elementType);
  if (cached) return cached;

  const validTargets = ELEMENT_TYPES.filter((parentType) =>
    canNestElement(elementType, parentType)
  );
  VALID_DROP_TARGETS_CACHE.set(elementType, validTargets);
  return validTargets;
}

/**
 * Get valid children for an element type (cached)
 */
export function getValidChildren(parentType: ElementType): ElementType[] {
  const cached = VALID_CHILDREN_CACHE.get(parentType);
  if (cached) return cached;

  const validChildren = ELEMENT_TYPES.filter((childType) => canNestElement(childType, parentType));
  VALID_CHILDREN_CACHE.set(parentType, validChildren);
  return validChildren;
}

/**
 * Clear all caches (useful after dynamic rule changes)
 */
export function clearNestingCaches(): void {
  VALID_DROP_TARGETS_CACHE.clear();
  VALID_CHILDREN_CACHE.clear();
  NESTING_MATRIX_CACHE.clear();
}

/**
 * Check nesting with strict HTML5 compliance
 */
export function canNestElementStrict(childType: ElementType, parentType: ElementType): boolean {
  if (!canNestElement(childType, parentType)) {
    return false;
  }

  const strictRules = STRICT_HTML5_RULES[parentType];
  if (strictRules) {
    if (strictRules.forbidden.includes(childType)) {
      return false;
    }
    if (strictRules.allowed && !strictRules.allowed.includes(childType)) {
      return false;
    }
  }

  return true;
}

/**
 * Quick validation - just checks if nesting is valid (no error messages)
 */
export function isValidNesting(
  element: { type: ElementType; children?: { type: ElementType; children?: unknown[] }[] },
  parentType?: ElementType
): boolean {
  if (parentType && !canNestElement(element.type, parentType)) {
    return false;
  }

  if (element.children && element.children.length > 0) {
    if (!canHaveChildren(element.type)) {
      return false;
    }
    return element.children.every((child) =>
      isValidNesting(
        child as { type: ElementType; children?: { type: ElementType; children?: unknown[] }[] },
        element.type
      )
    );
  }

  return true;
}
