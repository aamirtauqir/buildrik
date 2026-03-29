/**
 * Snap Manager
 * Pure functions for snapping during resize operations
 *
 * @module engine/canvas/resize/SnapManager
 * @license BSD-3-Clause
 */

import { getAllElementBounds } from "../canvasGeometry";
import type {
  HandlePosition,
  TransformBounds,
  SnapResult,
  SnappedEdges,
  EdgePositions,
} from "./types";

/**
 * Snap bounds to grid
 */
export function snapToGrid(
  bounds: TransformBounds,
  gridSize: number,
  handle: HandlePosition
): TransformBounds {
  const result = { ...bounds };

  // Snap affected edges to grid
  if (handle.includes("w") || handle === "nw" || handle === "sw") {
    result.x = Math.round(result.x / gridSize) * gridSize;
    result.width = bounds.x + bounds.width - result.x;
  }
  if (handle.includes("e") || handle === "ne" || handle === "se" || handle === "e") {
    const right = Math.round((bounds.x + result.width) / gridSize) * gridSize;
    result.width = right - result.x;
  }
  if (handle.includes("n") || handle === "nw" || handle === "ne") {
    result.y = Math.round(result.y / gridSize) * gridSize;
    result.height = bounds.y + bounds.height - result.y;
  }
  if (handle.includes("s") || handle === "sw" || handle === "se" || handle === "s") {
    const bottom = Math.round((bounds.y + result.height) / gridSize) * gridSize;
    result.height = bottom - result.y;
  }

  return result;
}

/**
 * Calculate edge positions from bounds
 */
export function getEdgePositions(bounds: TransformBounds): EdgePositions {
  return {
    left: bounds.x,
    right: bounds.x + bounds.width,
    top: bounds.y,
    bottom: bounds.y + bounds.height,
    centerX: bounds.x + bounds.width / 2,
    centerY: bounds.y + bounds.height / 2,
  };
}

/**
 * Snap bounds to other elements
 */
export function snapToElements(
  bounds: TransformBounds,
  excludeId: string,
  threshold: number
): SnapResult {
  const result = { ...bounds };
  const edges: SnappedEdges = {};

  // Get all other element bounds
  const otherBounds = getAllElementBounds(excludeId);
  const myEdges = getEdgePositions(result);

  for (const other of otherBounds) {
    const otherEdges = getEdgePositions(other);

    // Check horizontal snaps
    if (Math.abs(myEdges.left - otherEdges.left) < threshold) {
      result.x = otherEdges.left;
      edges.left = otherEdges.left;
    }
    if (Math.abs(myEdges.right - otherEdges.right) < threshold) {
      result.width = otherEdges.right - result.x;
      edges.right = otherEdges.right;
    }
    if (Math.abs(myEdges.left - otherEdges.right) < threshold) {
      result.x = otherEdges.right;
      edges.left = otherEdges.right;
    }
    if (Math.abs(myEdges.right - otherEdges.left) < threshold) {
      result.width = otherEdges.left - result.x;
      edges.right = otherEdges.left;
    }
    if (Math.abs(myEdges.centerX - otherEdges.centerX) < threshold) {
      result.x = otherEdges.centerX - result.width / 2;
      edges.centerX = otherEdges.centerX;
    }

    // Check vertical snaps
    if (Math.abs(myEdges.top - otherEdges.top) < threshold) {
      result.y = otherEdges.top;
      edges.top = otherEdges.top;
    }
    if (Math.abs(myEdges.bottom - otherEdges.bottom) < threshold) {
      result.height = otherEdges.bottom - result.y;
      edges.bottom = otherEdges.bottom;
    }
    if (Math.abs(myEdges.top - otherEdges.bottom) < threshold) {
      result.y = otherEdges.bottom;
      edges.top = otherEdges.bottom;
    }
    if (Math.abs(myEdges.bottom - otherEdges.top) < threshold) {
      result.height = otherEdges.top - result.y;
      edges.bottom = otherEdges.top;
    }
    if (Math.abs(myEdges.centerY - otherEdges.centerY) < threshold) {
      result.y = otherEdges.centerY - result.height / 2;
      edges.centerY = otherEdges.centerY;
    }
  }

  return { bounds: result, edges };
}
