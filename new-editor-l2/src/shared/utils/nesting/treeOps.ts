/**
 * Tree Operations
 * Functions for traversing and manipulating element trees
 *
 * @module utils/nesting/treeOps
 * @license BSD-3-Clause
 */

import type { ElementType } from "../../types";
import { ELEMENT_CATEGORIES } from "./derived";
import { isLandmarkType, isHeadingType, isContainerType, canHaveChildren } from "./typeChecks";
import { RECOMMENDED_MAX_DEPTH, type TreeAnalysis } from "./types";

// =============================================================================
// TREE OPERATIONS
// =============================================================================

/**
 * Find element by ID in tree
 */
export function findElementById<T extends { id?: string; children?: T[] }>(
  root: T,
  id: string
): T | null {
  if (root.id === id) return root;

  if (root.children) {
    for (const child of root.children) {
      const found = findElementById(child, id);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Find element by predicate
 */
export function findElement<T extends { children?: T[] }>(
  root: T,
  predicate: (el: T) => boolean
): T | null {
  if (predicate(root)) return root;

  if (root.children) {
    for (const child of root.children) {
      const found = findElement(child, predicate);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Find all elements matching predicate
 */
export function findAllElements<T extends { children?: T[] }>(
  root: T,
  predicate: (el: T) => boolean
): T[] {
  const results: T[] = [];

  if (predicate(root)) {
    results.push(root);
  }

  if (root.children) {
    for (const child of root.children) {
      results.push(...findAllElements(child, predicate));
    }
  }

  return results;
}

/**
 * Get ancestry path to element
 */
export function getAncestryPath<T extends { id?: string; children?: T[] }>(
  root: T,
  targetId: string
): T[] | null {
  if (root.id === targetId) return [root];

  if (root.children) {
    for (const child of root.children) {
      const path = getAncestryPath(child, targetId);
      if (path) return [root, ...path];
    }
  }

  return null;
}

/**
 * Get parent element
 */
export function getParentElement<T extends { id?: string; children?: T[] }>(
  root: T,
  targetId: string
): T | null {
  const path = getAncestryPath(root, targetId);
  if (path && path.length >= 2) {
    return path[path.length - 2];
  }
  return null;
}

/**
 * Get sibling elements
 */
export function getSiblings<T extends { id?: string; children?: T[] }>(
  root: T,
  targetId: string
): T[] {
  const parent = getParentElement(root, targetId);
  if (parent?.children) {
    return parent.children.filter((c) => c.id !== targetId);
  }
  return [];
}

/**
 * Get element depth in tree
 */
export function getElementDepth<T extends { id?: string; children?: T[] }>(
  root: T,
  targetId: string
): number {
  const path = getAncestryPath(root, targetId);
  return path ? path.length - 1 : -1;
}

/**
 * Find common ancestor of two elements
 */
export function findCommonAncestor<T extends { id?: string; children?: T[] }>(
  root: T,
  id1: string,
  id2: string
): T | null {
  const path1 = getAncestryPath(root, id1);
  const path2 = getAncestryPath(root, id2);

  if (!path1 || !path2) return null;

  let commonAncestor: T | null = null;
  for (let i = 0; i < Math.min(path1.length, path2.length); i++) {
    if (path1[i].id === path2[i].id) {
      commonAncestor = path1[i];
    } else {
      break;
    }
  }

  return commonAncestor;
}

/**
 * Clone element tree (deep)
 */
export function cloneTree<T extends { children?: T[] }>(element: T, idGenerator?: () => string): T {
  const clone = { ...element } as T;

  if (idGenerator && "id" in clone) {
    (clone as T & { id: string }).id = idGenerator();
  }

  if (element.children) {
    clone.children = element.children.map((child) => cloneTree(child, idGenerator));
  }

  return clone;
}

/**
 * Map over tree (transform each element)
 */
export function mapTree<T extends { children?: T[] }, U extends { children?: U[] }>(
  element: T,
  mapper: (el: T, depth: number) => Omit<U, "children">,
  depth: number = 0
): U {
  const mapped = mapper(element, depth) as U;

  if (element.children) {
    mapped.children = element.children.map((child) => mapTree(child, mapper, depth + 1));
  }

  return mapped;
}

/**
 * Filter tree (remove elements that don't match)
 */
export function filterTree<T extends { children?: T[] }>(
  element: T,
  predicate: (el: T) => boolean
): T | null {
  if (!predicate(element)) {
    return null;
  }

  const result = { ...element };

  if (element.children) {
    result.children = element.children
      .map((child) => filterTree(child, predicate))
      .filter((child): child is T => child !== null);
  }

  return result;
}

/**
 * Flatten tree to array
 */
export function flattenTree<T extends { children?: T[] }>(
  element: T,
  depth: number = 0
): { element: T; depth: number }[] {
  const results: { element: T; depth: number }[] = [{ element, depth }];

  if (element.children) {
    for (const child of element.children) {
      results.push(...flattenTree(child, depth + 1));
    }
  }

  return results;
}

/**
 * Count elements in tree
 */
export function countElements<T extends { children?: T[] }>(
  element: T,
  predicate?: (el: T) => boolean
): number {
  let count = predicate ? (predicate(element) ? 1 : 0) : 1;

  if (element.children) {
    for (const child of element.children) {
      count += countElements(child, predicate);
    }
  }

  return count;
}

// =============================================================================
// STATISTICS & ANALYSIS
// =============================================================================

/**
 * Analyze tree structure and return detailed statistics
 */
export function analyzeTree<T extends { type: ElementType; children?: T[] }>(
  root: T
): TreeAnalysis {
  const flattened = flattenTree(root);
  const depths = flattened.map((f) => f.depth);
  const types = flattened.map((f) => f.element.type);

  const typeCounts: Record<string, number> = {};
  for (const type of types) {
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  const categoryCounts: Record<string, number> = {};
  for (const type of types) {
    const categories = ELEMENT_CATEGORIES[type] || [];
    for (const cat of categories) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }

  const landmarks = flattened
    .filter((f) => isLandmarkType(f.element.type))
    .map((f) => f.element.type);

  const headings = flattened.filter((f) => isHeadingType(f.element.type)).map((f) => f.element);

  const emptyContainers = flattened.filter(
    (f) =>
      isContainerType(f.element.type) &&
      canHaveChildren(f.element.type) &&
      (!f.element.children || f.element.children.length === 0)
  ).length;

  const deeplyNested = flattened.filter((f) => f.depth > RECOMMENDED_MAX_DEPTH);

  return {
    totalElements: flattened.length,
    maxDepth: Math.max(...depths),
    averageDepth: depths.reduce((a, b) => a + b, 0) / depths.length,
    elementTypeCounts: typeCounts,
    categoryCounts,
    landmarkElements: landmarks,
    headingElements: headings,
    emptyContainers,
    deeplyNestedCount: deeplyNested.length,
    recommendations: generateRecommendations(flattened, landmarks, emptyContainers),
  };
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  flattened: { element: { type: ElementType }; depth: number }[],
  landmarks: ElementType[],
  emptyContainers: number
): string[] {
  const recommendations: string[] = [];

  if (!landmarks.includes("nav") && !landmarks.includes("navbar")) {
    recommendations.push("Consider adding a navigation landmark (nav) for accessibility");
  }

  if (landmarks.filter((l) => l === "header").length > 1) {
    recommendations.push(
      "Multiple header landmarks detected - consider using only one main header"
    );
  }

  if (emptyContainers > 0) {
    recommendations.push(
      `${emptyContainers} empty container(s) detected - consider removing or populating them`
    );
  }

  const maxDepth = Math.max(...flattened.map((f) => f.depth));
  if (maxDepth > RECOMMENDED_MAX_DEPTH) {
    recommendations.push(
      `Deep nesting detected (${maxDepth} levels) - consider simplifying the structure`
    );
  }

  return recommendations;
}
