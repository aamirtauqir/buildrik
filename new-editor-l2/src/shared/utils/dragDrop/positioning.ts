/**
 * Drag & Drop Positioning
 * Position calculations and index resolution
 *
 * @module utils/dragDrop/positioning
 * @license BSD-3-Clause
 */

import type { Element } from "../../../engine/elements/Element";
import type { Point, Rect } from "../../types";
import type { DropPosition } from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_EDGE_THRESHOLD = 0.25; // 25% edge zone

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Get top position from DOMRect or Rect
 */
function getRectTop(rect: DOMRect | Rect): number {
  return "top" in rect ? rect.top : rect.y;
}

/**
 * Get left position from DOMRect or Rect
 */
function getRectLeft(rect: DOMRect | Rect): number {
  return "left" in rect ? rect.left : rect.x;
}

// =============================================================================
// INDEX CALCULATION
// =============================================================================

/**
 * Calculate final index when moving element within same parent
 */
export function calculateFinalIndex(
  sourceElement: Element,
  newParent: Element,
  resolvedIndex: number | undefined
): number | undefined {
  const sourceParent = sourceElement.getParent();

  // If not moving within same parent, use resolved index as-is
  if (!sourceParent || sourceParent.getId() !== newParent.getId()) {
    return resolvedIndex;
  }

  const sourceIndex = sourceParent.getChildIndex(sourceElement);

  if (sourceIndex === -1) {
    return resolvedIndex;
  }

  // Append to end
  if (resolvedIndex === undefined) {
    return undefined;
  }

  // Same position - no move needed
  if (sourceIndex === resolvedIndex) {
    return sourceIndex;
  }

  // Moving forward - adjust index down by 1 (element will be removed first)
  if (sourceIndex < resolvedIndex) {
    return resolvedIndex - 1;
  }

  // Moving backward - no adjustment needed
  return resolvedIndex;
}

/**
 * Check if a move operation would actually change position
 */
export function wouldMoveChangePosition(
  sourceElement: Element,
  newParent: Element,
  resolvedIndex: number | undefined
): boolean {
  const sourceParent = sourceElement.getParent();

  // Different parent = definitely a change
  if (!sourceParent || sourceParent.getId() !== newParent.getId()) {
    return true;
  }

  const sourceIndex = sourceParent.getChildIndex(sourceElement);
  const finalIndex = calculateFinalIndex(sourceElement, newParent, resolvedIndex);

  // Moving to end
  if (finalIndex === undefined) {
    const childCount = newParent.getChildren?.()?.length ?? 0;
    return sourceIndex !== childCount - 1;
  }

  return sourceIndex !== finalIndex;
}

/**
 * Calculate insertion index from drop position
 */
export function calculateInsertionIndex(
  position: DropPosition,
  siblingIndex: number,
  _childCount: number
): number | undefined {
  switch (position) {
    case "before":
      return siblingIndex;
    case "after":
      return siblingIndex + 1;
    case "first":
      return 0;
    case "last":
      return undefined; // Append
    case "inside":
    default:
      return undefined; // Append
  }
}

// =============================================================================
// DROP POSITION CALCULATIONS
// =============================================================================

/**
 * Calculate drop position based on mouse coordinates relative to element
 * BUG-020 FIX: Added scrollOffset parameter to account for scrolled containers
 */
export function calculateDropPosition(
  mouseY: number,
  elementRect: DOMRect | Rect,
  allowInside: boolean = true,
  threshold: number = DEFAULT_EDGE_THRESHOLD,
  scrollOffset: number = 0
): DropPosition {
  // Adjust mouse Y for container scroll offset
  const adjustedMouseY = mouseY + scrollOffset;
  const relativeY = adjustedMouseY - getRectTop(elementRect);
  const height = elementRect.height;
  const edgeSize = height * threshold;

  if (relativeY < edgeSize) {
    return "before";
  }

  if (relativeY > height - edgeSize) {
    return "after";
  }

  return allowInside ? "inside" : "after";
}

/**
 * Calculate drop position with horizontal support (for flex/grid layouts)
 * BUG-020 FIX: Added scrollOffset parameter to account for scrolled containers
 */
export function calculateDropPosition2D(
  mouseX: number,
  mouseY: number,
  elementRect: DOMRect | Rect,
  isHorizontal: boolean = false,
  threshold: number = DEFAULT_EDGE_THRESHOLD,
  scrollOffset: { x: number; y: number } = { x: 0, y: 0 }
): DropPosition {
  if (isHorizontal) {
    const adjustedMouseX = mouseX + scrollOffset.x;
    const relativeX = adjustedMouseX - getRectLeft(elementRect);
    const width = elementRect.width;
    const edgeSize = width * threshold;

    if (relativeX < edgeSize) return "before";
    if (relativeX > width - edgeSize) return "after";
    return "inside";
  }

  return calculateDropPosition(mouseY, elementRect, true, threshold, scrollOffset.y);
}

/**
 * Calculate drop position with all 4 directions
 * BUG-020 FIX: Added scrollOffset parameter to account for scrolled containers
 */
export function calculateDropPosition4D(
  point: Point,
  elementRect: DOMRect | Rect,
  threshold: number = DEFAULT_EDGE_THRESHOLD,
  scrollOffset: { x: number; y: number } = { x: 0, y: 0 }
): { position: DropPosition; edge: "top" | "bottom" | "left" | "right" | "center" } {
  // Adjust point for container scroll offset
  const adjustedX = point.x + scrollOffset.x;
  const adjustedY = point.y + scrollOffset.y;
  const relX = adjustedX - getRectLeft(elementRect);
  const relY = adjustedY - getRectTop(elementRect);
  const { width, height } = elementRect;
  const edgeX = width * threshold;
  const edgeY = height * threshold;

  // Check edges
  if (relY < edgeY) return { position: "before", edge: "top" };
  if (relY > height - edgeY) return { position: "after", edge: "bottom" };
  if (relX < edgeX) return { position: "before", edge: "left" };
  if (relX > width - edgeX) return { position: "after", edge: "right" };

  return { position: "inside", edge: "center" };
}

/**
 * Get scroll offset from a container element
 * BUG-020 FIX: Helper to get scroll offset for position calculations
 */
export function getContainerScrollOffset(container: HTMLElement | null): { x: number; y: number } {
  if (!container) {
    return { x: 0, y: 0 };
  }
  return {
    x: container.scrollLeft,
    y: container.scrollTop,
  };
}

/**
 * Detect if parent uses horizontal layout
 */
export function isHorizontalLayout(element: HTMLElement): boolean {
  const style = getComputedStyle(element);
  const flexDirection = style.flexDirection;
  const display = style.display;

  if (display === "flex" || display === "inline-flex") {
    return flexDirection === "row" || flexDirection === "row-reverse";
  }

  if (display === "grid" || display === "inline-grid") {
    // Check if grid has more columns than rows
    const columns = style.gridTemplateColumns;
    const rows = style.gridTemplateRows;
    return columns.split(" ").length > rows.split(" ").length;
  }

  return false;
}
