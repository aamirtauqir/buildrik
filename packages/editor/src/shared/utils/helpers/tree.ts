/**
 * Aquibra Helpers - Tree Utilities
 * Tree traversal and manipulation
 *
 * @module utils/helpers/tree
 * @license BSD-3-Clause
 */

import type { TreeNode } from "./types";

// =============================================================================
// TREE TRAVERSAL
// =============================================================================

/**
 * Safely get children from an element-like object
 * Handles cases where getChildren may not exist
 */
export function getChildren<T extends TreeNode<T>>(element: T): T[] {
  return element.getChildren?.() || [];
}

/**
 * Recursively iterate through all descendants of an element
 * Calls callback for each descendant (depth-first)
 */
export function forEachDescendant<T extends TreeNode<T>>(
  element: T,
  callback: (child: T, depth: number) => void,
  depth: number = 0
): void {
  const children = getChildren(element);
  for (const child of children) {
    callback(child, depth);
    forEachDescendant(child, callback, depth + 1);
  }
}

/**
 * Collect all descendants of an element into a flat array
 */
export function getAllDescendants<T extends TreeNode<T>>(element: T): T[] {
  const descendants: T[] = [];
  forEachDescendant(element, (child) => descendants.push(child));
  return descendants;
}
