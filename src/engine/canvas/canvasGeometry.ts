/**
 * Canvas Geometry Utilities
 * Shared geometry functions for canvas operations
 *
 * @module engine/canvas/canvasGeometry
 * @license BSD-3-Clause
 */

import type { Rect } from "../../shared/types/geometry";
import { parseNumericValue } from "../../shared/utils/helpers";
// Import canonical DOM utilities from resize/utils.ts
import {
  getCanvasContainer as _getCanvasContainer,
  getDOMElement as _getDOMElement,
} from "./resize/utils";

// ============================================
// Types
// ============================================

// Re-export Rect from types for convenience
export type { Rect } from "../../shared/types/geometry";

export interface TransformRect extends Rect {
  rotation?: number;
}

export interface ElementBoundsWithSpacing extends Rect {
  elementId: string;
  margin: { top: number; right: number; bottom: number; left: number };
  padding: { top: number; right: number; bottom: number; left: number };
}

// ============================================
// Canvas Helpers
// ============================================

/**
 * Get canvas container element
 * @canonical src/engine/canvas/resize/utils.ts - Import from there for new code
 */
export const getCanvasContainer: () => HTMLElement | null = _getCanvasContainer;

/**
 * Get canvas container rect
 */
export function getCanvasRect():
  | DOMRect
  | { left: number; top: number; width: number; height: number } {
  const canvas = getCanvasContainer();
  return canvas?.getBoundingClientRect() || { left: 0, top: 0, width: 0, height: 0 };
}

/**
 * Get DOM element by ID
 * @deprecated Use getDOMElement from resize/utils.ts instead
 * @canonical src/engine/canvas/resize/utils.ts
 */

export const getDOMElementById: (elementId: string) => HTMLElement | null = _getDOMElement;

/**
 * Get DOM element by element ID (canonical name)
 * @canonical src/engine/canvas/resize/utils.ts
 */

export const getDOMElement: (elementId: string) => HTMLElement | null = _getDOMElement;

// ============================================
// Bounds Calculation
// ============================================

/**
 * Get element bounds relative to canvas
 * Used by ResizeHandler
 */
export function getElementBounds(domElement: HTMLElement): TransformRect | null {
  if (!domElement) return null;

  const rect = domElement.getBoundingClientRect();
  const canvasRect = getCanvasRect();

  return {
    x: rect.left - canvasRect.left,
    y: rect.top - canvasRect.top,
    width: rect.width,
    height: rect.height,
    rotation: getElementRotation(domElement),
  };
}

/**
 * Get element bounds with spacing (margin/padding)
 * Used by CanvasIndicators
 */
export function getElementBoundsWithSpacing(
  elementId: string,
  domElement: HTMLElement
): ElementBoundsWithSpacing | null {
  if (!domElement) return null;

  const rect = domElement.getBoundingClientRect();
  const canvasRect = getCanvasRect();
  const computedStyle = window.getComputedStyle(domElement);

  return {
    elementId,
    x: rect.left - canvasRect.left,
    y: rect.top - canvasRect.top,
    width: rect.width,
    height: rect.height,
    margin: {
      top: parseNumericValue(computedStyle.marginTop),
      right: parseNumericValue(computedStyle.marginRight),
      bottom: parseNumericValue(computedStyle.marginBottom),
      left: parseNumericValue(computedStyle.marginLeft),
    },
    padding: {
      top: parseNumericValue(computedStyle.paddingTop),
      right: parseNumericValue(computedStyle.paddingRight),
      bottom: parseNumericValue(computedStyle.paddingBottom),
      left: parseNumericValue(computedStyle.paddingLeft),
    },
  };
}

/**
 * Get all element bounds excluding specified ID
 */
export function getAllElementBounds(excludeId: string): TransformRect[] {
  const bounds: TransformRect[] = [];
  const elements = document.querySelectorAll("[data-aqb-id]");

  elements.forEach((el) => {
    const id = el.getAttribute("data-aqb-id");
    if (id && id !== excludeId) {
      const elBounds = getElementBounds(el as HTMLElement);
      if (elBounds) bounds.push(elBounds);
    }
  });

  return bounds;
}

/**
 * Get element rotation from transform style
 */
export function getElementRotation(domElement: HTMLElement): number {
  const transform = domElement.style.transform || window.getComputedStyle(domElement).transform;
  if (!transform || transform === "none") return 0;

  // Parse matrix or rotate
  const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
  if (matrixMatch) {
    const values = matrixMatch[1].split(",").map(Number);
    // For 2D matrix: matrix(a, b, c, d, tx, ty)
    // rotation = atan2(b, a) in radians, convert to degrees
    return Math.round(Math.atan2(values[1], values[0]) * (180 / Math.PI));
  }

  const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
  if (rotateMatch) {
    return parseFloat(rotateMatch[1]);
  }

  return 0;
}

// ============================================
// Rect Utilities
// ============================================

/**
 * Convert DOMRect to simple Rect
 */
export function domRectToRect(domRect: DOMRect): Rect {
  return {
    x: domRect.left,
    y: domRect.top,
    width: domRect.width,
    height: domRect.height,
  };
}

/**
 * Check if point is inside rect
 */
export function pointInRect(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

/**
 * Get rect center point
 */
export function getRectCenter(rect: Rect): { x: number; y: number } {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

/**
 * Get rect edges
 */
export function getRectEdges(rect: Rect): {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
} {
  return {
    left: rect.x,
    right: rect.x + rect.width,
    top: rect.y,
    bottom: rect.y + rect.height,
    centerX: rect.x + rect.width / 2,
    centerY: rect.y + rect.height / 2,
  };
}

/**
 * Check if two rects overlap
 */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

/**
 * Clamp point to rect bounds
 */
export function clampToRect(x: number, y: number, rect: Rect): { x: number; y: number } {
  return {
    x: Math.max(rect.x, Math.min(x, rect.x + rect.width)),
    y: Math.max(rect.y, Math.min(y, rect.y + rect.height)),
  };
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
