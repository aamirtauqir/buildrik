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
import { ELEMENT_RULES, STRICT_HTML5_RULES } from "./rules";
import {
  isInteractiveType,
  isLandmarkType,
  isHeadingType,
  isContainerType,
  canHaveChildren,
  getHeadingLevel,
} from "./typeChecks";
import {
  MAX_NESTING_DEPTH,
  RECOMMENDED_MAX_DEPTH,
  MAX_CHILDREN_COUNT,
  type ValidationOptions,
  type ValidationIssue,
  type TreeStatistics,
  type TreeValidationResult,
} from "./types";

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

// =============================================================================
// TREE VALIDATION
// =============================================================================

/**
 * Comprehensive tree validation with detailed error reporting
 */
export function validateElementTree(
  element: {
    type: ElementType;
    children?: { type: ElementType; children?: unknown[]; id?: string }[];
    id?: string;
  },
  parentType?: ElementType,
  currentDepth: number = 0,
  ancestry: ElementType[] = [],
  path: string[] = [],
  options: ValidationOptions = {}
): TreeValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const info: ValidationIssue[] = [];
  const currentPath = [...path, element.id || element.type];

  const {
    strictMode = false,
    checkAccessibility = true,
    checkPerformance = true,
    maxDepth = MAX_NESTING_DEPTH,
  } = options;

  const statistics: TreeStatistics = {
    totalElements: 1,
    maxDepth: currentDepth,
    averageDepth: currentDepth,
    elementTypeCounts: { [element.type]: 1 },
    landmarkCount: isLandmarkType(element.type) ? 1 : 0,
    interactiveCount: isInteractiveType(element.type) ? 1 : 0,
    headingLevels: isHeadingType(element.type) ? [getHeadingLevel(element)] : [],
    emptyContainers: 0,
  };

  if (currentDepth > maxDepth) {
    errors.push({
      type: "error",
      code: "MAX_DEPTH_EXCEEDED",
      message: `Maximum nesting depth (${maxDepth}) exceeded`,
      path: currentPath,
      elementType: element.type,
      suggestion: "Simplify the structure by reducing nesting levels",
    });
    return {
      valid: false,
      errors,
      warnings,
      info,
      depth: currentDepth,
      elementCount: 1,
      statistics,
    };
  }

  if (parentType) {
    const nestingCheck = strictMode
      ? canNestElementStrict(element.type, parentType)
      : canNestElement(element.type, parentType);

    if (!nestingCheck) {
      errors.push({
        type: "error",
        code: "INVALID_NESTING",
        message: `${element.type} cannot be nested inside ${parentType}`,
        path: currentPath,
        elementType: element.type,
        parentType,
        suggestion: `Try placing ${element.type} in a container element`,
      });
    }
  }

  if (isInteractiveType(element.type)) {
    const interactiveAncestor = ancestry.find(isInteractiveType);
    if (interactiveAncestor) {
      errors.push({
        type: "error",
        code: "NESTED_INTERACTIVE",
        message: `Interactive element ${element.type} cannot be nested inside ${interactiveAncestor}`,
        path: currentPath,
        elementType: element.type,
        parentType: interactiveAncestor,
        suggestion: "Move the interactive element outside its parent",
      });
    }
  }

  if (checkAccessibility) {
    const a11yIssues = validateAccessibility(element, ancestry, currentPath);
    warnings.push(...a11yIssues.filter((i) => i.type === "warning"));
    info.push(...a11yIssues.filter((i) => i.type === "info"));
  }

  if (checkPerformance && currentDepth > RECOMMENDED_MAX_DEPTH) {
    warnings.push({
      type: "warning",
      code: "DEEP_NESTING",
      message: `Deep nesting detected (${currentDepth} levels)`,
      path: currentPath,
      elementType: element.type,
      suggestion: "Consider simplifying the structure for better performance",
    });
  }

  let maxChildDepth = currentDepth;
  let totalChildDepths = 0;
  let childCount = 0;

  if (element.children && element.children.length > 0) {
    if (!canHaveChildren(element.type)) {
      errors.push({
        type: "error",
        code: "VOID_WITH_CHILDREN",
        message: `Void element ${element.type} cannot have children`,
        path: currentPath,
        elementType: element.type,
        suggestion: "Remove children from this element",
      });
    } else {
      if (element.children.length > MAX_CHILDREN_COUNT) {
        warnings.push({
          type: "warning",
          code: "TOO_MANY_CHILDREN",
          message: `Element has ${element.children.length} children (max recommended: ${MAX_CHILDREN_COUNT})`,
          path: currentPath,
          elementType: element.type,
          suggestion: "Consider breaking into smaller components",
        });
      }

      const newAncestry = [...ancestry, element.type];

      for (let i = 0; i < element.children.length; i++) {
        const child = element.children[i];
        const childPath = [...currentPath, `[${i}]`];

        const childValidation = validateElementTree(
          child as {
            type: ElementType;
            children?: { type: ElementType; children?: unknown[]; id?: string }[];
            id?: string;
          },
          element.type,
          currentDepth + 1,
          newAncestry,
          childPath,
          options
        );

        errors.push(...childValidation.errors);
        warnings.push(...childValidation.warnings);
        info.push(...childValidation.info);

        maxChildDepth = Math.max(maxChildDepth, childValidation.depth);
        totalChildDepths += childValidation.statistics.averageDepth;
        childCount++;

        statistics.totalElements += childValidation.statistics.totalElements;
        statistics.landmarkCount += childValidation.statistics.landmarkCount;
        statistics.interactiveCount += childValidation.statistics.interactiveCount;
        statistics.headingLevels.push(...childValidation.statistics.headingLevels);
        statistics.emptyContainers += childValidation.statistics.emptyContainers;

        for (const [type, count] of Object.entries(childValidation.statistics.elementTypeCounts)) {
          statistics.elementTypeCounts[type] = (statistics.elementTypeCounts[type] || 0) + count;
        }
      }
    }
  } else if (canHaveChildren(element.type) && isContainerType(element.type)) {
    statistics.emptyContainers++;
  }

  statistics.maxDepth = maxChildDepth;
  statistics.averageDepth =
    childCount > 0 ? (currentDepth + totalChildDepths) / (childCount + 1) : currentDepth;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
    depth: maxChildDepth,
    elementCount: statistics.totalElements,
    statistics,
  };
}

/**
 * Validate accessibility concerns
 */
function validateAccessibility(
  element: { type: ElementType; id?: string },
  ancestry: ElementType[],
  path: string[]
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const rule = ELEMENT_RULES[element.type];

  if (rule.isLandmark && rule.landmarkRole) {
    const ancestorLandmark = ancestry.find((t) => ELEMENT_RULES[t]?.isLandmark);
    if (ancestorLandmark && ancestorLandmark !== "section") {
      issues.push({
        type: "warning",
        code: "NESTED_LANDMARK",
        message: `Landmark ${element.type} is nested inside another landmark ${ancestorLandmark}`,
        path,
        elementType: element.type,
        suggestion: "Landmarks should generally not be nested",
      });
    }
  }

  if (rule.shouldBeUnique) {
    issues.push({
      type: "info",
      code: "UNIQUE_LANDMARK",
      message: `${element.type} should typically appear only once per page`,
      path,
      elementType: element.type,
    });
  }

  return issues;
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
