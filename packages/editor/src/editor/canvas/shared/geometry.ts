/**
 * Canvas Geometry Utilities
 * Shared utilities for rect/point calculations
 *
 * Why this exists:
 * - Consistent rect calculation across all features
 * - Centralized hit testing and collision detection
 * - Zoom-aware coordinate transformations
 *
 * @license BSD-3-Clause
 */

/** Point in 2D space */
export interface Point {
  x: number;
  y: number;
}

/** Rectangle with position and size */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Rectangle with all four edges */
export interface RectEdges {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Convert DOMRect to our Rect type
 */
export function domRectToRect(domRect: DOMRect): Rect {
  return {
    x: domRect.x,
    y: domRect.y,
    width: domRect.width,
    height: domRect.height,
  };
}

/**
 * Convert Rect to edge representation
 */
export function rectToEdges(rect: Rect): RectEdges {
  return {
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
    left: rect.x,
  };
}

/**
 * Get center point of a rect
 */
export function getRectCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * Check if a point is inside a rect
 */
export function isPointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Check if two rects intersect
 */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Check if rect A fully contains rect B
 */
export function rectContains(container: Rect, contained: Rect): boolean {
  return (
    contained.x >= container.x &&
    contained.y >= container.y &&
    contained.x + contained.width <= container.x + container.width &&
    contained.y + contained.height <= container.y + container.height
  );
}

/**
 * Get intersection rect of two rects (returns null if no intersection)
 */
export function getIntersection(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);

  const width = right - x;
  const height = bottom - y;

  if (width <= 0 || height <= 0) return null;

  return { x, y, width, height };
}

/**
 * Get bounding rect of multiple rects
 */
export function getBoundingRect(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Expand rect by padding
 */
export function expandRect(rect: Rect, padding: number): Rect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

/**
 * Calculate distance between two points
 */
export function distanceBetween(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate distance from point to rect edge
 */
export function distanceToRect(point: Point, rect: Rect): number {
  const edges = rectToEdges(rect);

  // If point is inside rect, distance is 0
  if (isPointInRect(point, rect)) return 0;

  // Find closest point on rect boundary
  const closestX = Math.max(edges.left, Math.min(point.x, edges.right));
  const closestY = Math.max(edges.top, Math.min(point.y, edges.bottom));

  return distanceBetween(point, { x: closestX, y: closestY });
}

/**
 * Convert viewport coordinates to canvas coordinates
 */
export function viewportToCanvas(viewportPoint: Point, canvasRect: DOMRect, zoom: number): Point {
  return {
    x: (viewportPoint.x - canvasRect.x) / zoom,
    y: (viewportPoint.y - canvasRect.y) / zoom,
  };
}

/**
 * Convert canvas coordinates to viewport coordinates
 */
export function canvasToViewport(canvasPoint: Point, canvasRect: DOMRect, zoom: number): Point {
  return {
    x: canvasPoint.x * zoom + canvasRect.x,
    y: canvasPoint.y * zoom + canvasRect.y,
  };
}

/**
 * Determine which edge of a rect a point is closest to
 */
export type RectEdge = "top" | "right" | "bottom" | "left";

export function getClosestEdge(point: Point, rect: Rect): RectEdge {
  const edges = rectToEdges(rect);

  const distTop = Math.abs(point.y - edges.top);
  const distBottom = Math.abs(point.y - edges.bottom);
  const distLeft = Math.abs(point.x - edges.left);
  const distRight = Math.abs(point.x - edges.right);

  const minDist = Math.min(distTop, distBottom, distLeft, distRight);

  if (minDist === distTop) return "top";
  if (minDist === distBottom) return "bottom";
  if (minDist === distLeft) return "left";
  return "right";
}

/**
 * Get relative position of point within rect (0-1 range)
 */
export function getRelativePosition(point: Point, rect: Rect): Point {
  return {
    x: (point.x - rect.x) / rect.width,
    y: (point.y - rect.y) / rect.height,
  };
}

/**
 * Clamp a point to stay within a rect
 */
export function clampPointToRect(point: Point, rect: Rect): Point {
  return {
    x: Math.max(rect.x, Math.min(point.x, rect.x + rect.width)),
    y: Math.max(rect.y, Math.min(point.y, rect.y + rect.height)),
  };
}
