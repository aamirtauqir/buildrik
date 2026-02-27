/**
 * Resize Handler Utility Functions
 * DOM helpers and cursor utilities
 *
 * @module engine/canvas/resize/utils
 * @license BSD-3-Clause
 */

import { HANDLE_CURSORS, ROTATION_CURSOR } from "./constants";
import type { AnyHandle, HandlePosition, Bounds } from "./types";

// =============================================================================
// DOM UTILITIES
// =============================================================================

/**
 * Get DOM element by element ID
 */
export function getDOMElement(elementId: string): HTMLElement | null {
  return document.querySelector(`[data-aqb-id="${elementId}"]`) as HTMLElement | null;
}

/**
 * Get canvas container element
 */
export function getCanvasContainer(): HTMLElement | null {
  return document.querySelector("[data-aqb-canvas], .aqb-canvas") as HTMLElement | null;
}

/**
 * Get canvas bounds
 */
export function getCanvasBounds(): Bounds {
  const canvas = getCanvasContainer();
  const canvasRect = canvas?.getBoundingClientRect();

  return {
    x: 0,
    y: 0,
    width: canvasRect?.width || 1440,
    height: canvasRect?.height || 900,
  };
}

// =============================================================================
// CURSOR UTILITIES
// =============================================================================

/**
 * Get cursor for a given handle
 */
export function getCursor(handle: AnyHandle): string {
  if (handle === "rotation") {
    return ROTATION_CURSOR;
  }
  return HANDLE_CURSORS[handle] || "default";
}

/**
 * Set body cursor and disable selection during resize
 */
export function setResizeCursor(handle: AnyHandle): void {
  document.body.style.userSelect = "none";
  document.body.style.cursor = getCursor(handle);
}

/**
 * Reset body cursor and selection after resize
 */
export function resetCursor(): void {
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
}

// =============================================================================
// POSITION UTILITIES
// =============================================================================

/**
 * Extract client coordinates from mouse or touch event
 */
export function getClientCoords(event: MouseEvent | Touch): { x: number; y: number } {
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Calculate angle from center to a point (in degrees)
 */
export function calculateAngle(
  centerX: number,
  centerY: number,
  pointX: number,
  pointY: number
): number {
  return Math.atan2(pointY - centerY, pointX - centerX) * (180 / Math.PI);
}

// =============================================================================
// HANDLE UTILITIES
// =============================================================================

/**
 * Check if handle affects horizontal dimension
 */
export function affectsWidth(handle: HandlePosition): boolean {
  return (
    handle === "e" ||
    handle === "w" ||
    handle === "ne" ||
    handle === "nw" ||
    handle === "se" ||
    handle === "sw"
  );
}

/**
 * Check if handle affects vertical dimension
 */
export function affectsHeight(handle: HandlePosition): boolean {
  return (
    handle === "n" ||
    handle === "s" ||
    handle === "ne" ||
    handle === "nw" ||
    handle === "se" ||
    handle === "sw"
  );
}

/**
 * Check if handle affects left edge (position)
 */
export function affectsLeft(handle: HandlePosition): boolean {
  return handle === "w" || handle === "nw" || handle === "sw";
}

/**
 * Check if handle affects top edge (position)
 */
export function affectsTop(handle: HandlePosition): boolean {
  return handle === "n" || handle === "nw" || handle === "ne";
}

/**
 * Check if handle is a corner handle
 */
export function isCornerHandle(handle: HandlePosition): boolean {
  return handle === "nw" || handle === "ne" || handle === "sw" || handle === "se";
}

/**
 * Check if handle is an edge handle
 */
export function isEdgeHandle(handle: HandlePosition): boolean {
  return handle === "n" || handle === "s" || handle === "e" || handle === "w";
}
