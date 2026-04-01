/**
 * Drag & Drop Target Resolution
 * Finding valid drop targets in element tree
 *
 * @module utils/dragDrop/dropTarget
 * @license BSD-3-Clause
 */

import type { Element } from "../../../engine/elements/Element";
import { THRESHOLDS } from "../../constants";
import type { ElementType, Point } from "../../types";
import { canHaveChildren, canNestElement } from "../nesting";
import { getElementId } from "./domHelpers";
import { distance, getRectCenter, domRectToRect } from "./geometry";
import type { FindDropTargetOptions, DropTargetResult, DropTargetSearchResult } from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_TREE_DEPTH = THRESHOLDS.MAX_NESTING_DEPTH;

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Check if an element should be skipped during drop target search
 */
function shouldSkipElement(elementId: string, options: FindDropTargetOptions): boolean {
  const { skipElementId, skipDescendantIds, skipCurrentParent, currentParentId } = options;

  if (skipElementId && elementId === skipElementId) return true;
  if (skipDescendantIds?.has(elementId)) return true;
  if (skipCurrentParent && currentParentId && elementId === currentParentId) return true;

  return false;
}

// =============================================================================
// DROP TARGET RESOLUTION
// =============================================================================

/**
 * Find a valid drop target starting from a candidate element
 * Returns detailed result with failure reason
 */
export function findValidDropTarget(
  targetElement: Element,
  childType: ElementType,
  options: FindDropTargetOptions = {}
): DropTargetSearchResult {
  const { preferredPosition = "inside" } = options;
  const candidates: DropTargetResult[] = [];
  let cursor: Element | null = targetElement;
  let depth = 0;
  let elementsChecked = 0;

  while (cursor && depth < MAX_TREE_DEPTH) {
    elementsChecked++;
    const cursorId = cursor.getId();

    // Skip if cursor should be excluded
    if (shouldSkipElement(cursorId, options)) {
      cursor = cursor.getParent();
      depth++;
      continue;
    }

    const cursorType = cursor.getType() as ElementType;

    // Check if cursor can accept the child directly
    if (canHaveChildren(cursorType) && canNestElement(childType, cursorType)) {
      const position =
        preferredPosition === "before" || preferredPosition === "after"
          ? preferredPosition
          : "inside";

      const result: DropTargetResult = {
        parent: cursor,
        index: undefined,
        position,
      };
      candidates.push(result);

      // Return first valid target
      return {
        success: true,
        result,
        elementsChecked,
        candidates,
      };
    }

    // Try as sibling of cursor in its parent
    const parent = cursor.getParent();
    if (parent && !shouldSkipElement(parent.getId(), options)) {
      const parentType = parent.getType() as ElementType;

      if (canNestElement(childType, parentType)) {
        const siblingIndex = parent.getChildIndex(cursor);

        if (siblingIndex !== -1) {
          // Calculate index based on preferred position
          const index = preferredPosition === "before" ? siblingIndex : siblingIndex + 1;
          const position = preferredPosition === "before" ? "before" : "after";

          const result: DropTargetResult = {
            parent,
            index,
            position,
          };
          candidates.push(result);

          return {
            success: true,
            result,
            elementsChecked,
            candidates,
          };
        }
      }
    }

    cursor = parent;
    depth++;
  }

  // Determine failure reason
  let failureReason = "No valid drop target found";
  if (depth >= MAX_TREE_DEPTH) {
    failureReason = "Maximum tree depth reached";
  } else if (elementsChecked === 0) {
    failureReason = "No elements to check";
  }

  return {
    success: false,
    failureReason,
    elementsChecked,
    candidates,
  };
}

/**
 * Find drop target with root element as fallback
 */
export function findValidDropTargetWithFallback(
  targetElement: Element | null,
  rootElement: Element | null,
  childType: ElementType,
  options: FindDropTargetOptions = {}
): DropTargetSearchResult {
  // Try to find valid parent from target
  if (targetElement) {
    const result = findValidDropTarget(targetElement, childType, options);
    if (result.success) return result;
  }

  // Fallback to root element
  if (rootElement) {
    const rootType = rootElement.getType() as ElementType;
    if (canHaveChildren(rootType) && canNestElement(childType, rootType)) {
      return {
        success: true,
        result: { parent: rootElement, index: undefined, position: "last" },
        elementsChecked: 1,
      };
    }
  }

  return {
    success: false,
    failureReason: "No valid drop target found (including root)",
    elementsChecked: targetElement ? 1 : 0,
  };
}

/**
 * Find best drop target from multiple candidates
 */
export function findBestDropTarget(
  point: Point,
  candidates: HTMLElement[],
  childType: ElementType,
  getElement: (id: string) => Element | null,
  options: FindDropTargetOptions = {}
): DropTargetSearchResult {
  const results: Array<DropTargetResult & { distance: number }> = [];

  for (const candidateEl of candidates) {
    const id = getElementId(candidateEl);
    if (!id) continue;

    const element = getElement(id);
    if (!element) continue;

    const rect = candidateEl.getBoundingClientRect();
    const center = getRectCenter(domRectToRect(rect));
    const dist = distance(point, center);

    const searchResult = findValidDropTarget(element, childType, options);
    if (searchResult.success && searchResult.result) {
      results.push({
        ...searchResult.result,
        distance: dist,
      });
    }
  }

  if (results.length === 0) {
    return {
      success: false,
      failureReason: "No valid candidates found",
      elementsChecked: candidates.length,
    };
  }

  // Sort by distance, return closest
  results.sort((a, b) => a.distance - b.distance);

  return {
    success: true,
    result: results[0],
    elementsChecked: candidates.length,
    candidates: results,
  };
}
