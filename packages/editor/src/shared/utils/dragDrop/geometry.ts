/**
 * Drag & Drop Geometry Utilities
 * Point/rect calculations and coordinate helpers
 *
 * @module utils/dragDrop/geometry
 * @license BSD-3-Clause
 */

import type { Point, Rect, AxisConstraint } from "./types";

// =============================================================================
// DISTANCE CALCULATIONS
// =============================================================================

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate Manhattan distance (faster for comparisons)
 */
export function manhattanDistance(p1: Point, p2: Point): number {
  return Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
}

// =============================================================================
// POINT/RECT OPERATIONS
// =============================================================================

/**
 * Check if point is inside rect
 */
export function pointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Get center point of rect
 */
export function getRectCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * Clamp point to bounds
 */
export function clampToRect(point: Point, bounds: Rect): Point {
  return {
    x: Math.max(bounds.x, Math.min(point.x, bounds.x + bounds.width)),
    y: Math.max(bounds.y, Math.min(point.y, bounds.y + bounds.height)),
  };
}

/**
 * Snap point to grid
 */
export function snapToGrid(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

/**
 * Apply axis constraint to delta
 */
export function applyAxisConstraint(delta: Point, axis: AxisConstraint): Point {
  switch (axis) {
    case "x":
      return { x: delta.x, y: 0 };
    case "y":
      return { x: 0, y: delta.y };
    default:
      return delta;
  }
}

/**
 * Convert DOMRect to Rect
 */
export function domRectToRect(domRect: DOMRect): Rect {
  return {
    x: domRect.left,
    y: domRect.top,
    width: domRect.width,
    height: domRect.height,
  };
}

// =============================================================================
// EVENT POSITION HELPERS
// =============================================================================

/**
 * Get mouse position from event
 */
export function getEventPosition(event: MouseEvent | TouchEvent | Touch): Point {
  if ("touches" in event) {
    const touch = event.touches[0] || event.changedTouches[0];
    return { x: touch.clientX, y: touch.clientY };
  }
  if ("clientX" in event) {
    return { x: event.clientX, y: event.clientY };
  }
  return { x: 0, y: 0 };
}

/**
 * Get page-relative position
 */
export function getPagePosition(event: MouseEvent | TouchEvent | Touch): Point {
  if ("touches" in event) {
    const touch = event.touches[0] || event.changedTouches[0];
    return { x: touch.pageX, y: touch.pageY };
  }
  if ("pageX" in event) {
    return { x: event.pageX, y: event.pageY };
  }
  return { x: 0, y: 0 };
}

// =============================================================================
// COLLISION DETECTION
// =============================================================================

/**
 * Check if two rects overlap
 */
export function rectsOverlap(rect1: Rect, rect2: Rect): boolean {
  return !(
    rect1.x > rect2.x + rect2.width ||
    rect1.x + rect1.width < rect2.x ||
    rect1.y > rect2.y + rect2.height ||
    rect1.y + rect1.height < rect2.y
  );
}

/**
 * Get overlap area between two rects
 */
export function getOverlapArea(rect1: Rect, rect2: Rect): number {
  const xOverlap = Math.max(
    0,
    Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x)
  );
  const yOverlap = Math.max(
    0,
    Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y)
  );

  return xOverlap * yOverlap;
}

/**
 * Find element with most overlap
 */
export function findMostOverlapping(
  dragRect: Rect,
  candidates: Array<{ element: HTMLElement; rect: Rect }>
): HTMLElement | null {
  let maxOverlap = 0;
  let bestMatch: HTMLElement | null = null;

  for (const candidate of candidates) {
    if (!rectsOverlap(dragRect, candidate.rect)) continue;

    const overlap = getOverlapArea(dragRect, candidate.rect);
    if (overlap > maxOverlap) {
      maxOverlap = overlap;
      bestMatch = candidate.element;
    }
  }

  return bestMatch;
}
