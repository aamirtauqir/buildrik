/**
 * Constraint Manager
 * Pure functions for applying resize constraints
 *
 * @module engine/canvas/resize/ConstraintManager
 * @license BSD-3-Clause
 */

import { devLog } from "../../../shared/utils/devLogger";
import { clamp } from "../../../shared/utils/helpers";
import type { TransformBounds, SizeConstraints, BoundaryConstraints, Bounds } from "./types";

/**
 * Apply size constraints to bounds
 */
export function applyConstraints(
  bounds: TransformBounds,
  constraints: SizeConstraints
): TransformBounds {
  const result = { ...bounds };

  result.width = clamp(result.width, constraints.minWidth, constraints.maxWidth);
  result.height = clamp(result.height, constraints.minHeight, constraints.maxHeight);

  return result;
}

export function applyBoundaryConstraints(
  bounds: TransformBounds,
  boundary: BoundaryConstraints,
  _onExpandParent?: (
    parentId: string,
    parentElement: HTMLElement,
    width: number,
    height: number
  ) => void
): TransformBounds {
  const result = { ...bounds };
  const { parentBounds, canvasBounds, offsetInParent: _offsetInParent } = boundary;

  // Calculate the absolute position of child's edges
  const childRight = result.x + result.width;
  const childBottom = result.y + result.height;

  // Canvas is the hard limit
  const canvasRight = canvasBounds.x + canvasBounds.width;
  const canvasBottom = canvasBounds.y + canvasBounds.height;

  // CRITICAL FIX: Enforce hard parent boundaries
  // If element has a parent, constrain the child WITHIN the parent (no auto-expand)
  if (parentBounds) {
    const parentRight = parentBounds.x + parentBounds.width;
    const parentBottom = parentBounds.y + parentBounds.height;

    devLog("ConstraintManager", "Parent bounds:", parentBounds);
    devLog("ConstraintManager", "Child attempting:", {
      x: result.x,
      y: result.y,
      width: result.width,
      height: result.height,
    });
    devLog(
      "ConstraintManager",
      `Child right edge: ${childRight}, Parent right edge: ${parentRight}`
    );
    devLog(
      "ConstraintManager",
      `Child bottom edge: ${childBottom}, Parent bottom edge: ${parentBottom}`
    );

    // Constrain width to fit within parent
    if (childRight > parentRight) {
      // Child is trying to exceed parent's right edge
      const maxAllowedWidth = parentRight - result.x;
      devLog(
        "ConstraintManager",
        `⚠️ Constraining WIDTH from ${result.width} to ${maxAllowedWidth}`
      );
      result.width = Math.max(10, maxAllowedWidth);
    }

    // Constrain height to fit within parent
    if (childBottom > parentBottom) {
      // Child is trying to exceed parent's bottom edge
      const maxAllowedHeight = parentBottom - result.y;
      devLog(
        "ConstraintManager",
        `⚠️ Constraining HEIGHT from ${result.height} to ${maxAllowedHeight}`
      );
      result.height = Math.max(10, maxAllowedHeight);
    }

    // Also prevent resizing to the left/top beyond parent
    if (result.x < parentBounds.x) {
      const diff = parentBounds.x - result.x;
      result.x = parentBounds.x;
      result.width = Math.max(10, result.width - diff);
      devLog("ConstraintManager", "⚠️ Constraining X position");
    }
    if (result.y < parentBounds.y) {
      const diff = parentBounds.y - result.y;
      result.y = parentBounds.y;
      result.height = Math.max(10, result.height - diff);
      devLog("ConstraintManager", "⚠️ Constraining Y position");
    }
  } else {
    devLog("ConstraintManager", "No parent bounds - element is at root level");
  }

  // Always enforce canvas boundaries (hard limit)
  if (result.x + result.width > canvasRight) {
    result.width = canvasRight - result.x;
  }
  if (result.y + result.height > canvasBottom) {
    result.height = canvasBottom - result.y;
  }
  if (result.x < canvasBounds.x) {
    const diff = canvasBounds.x - result.x;
    result.x = canvasBounds.x;
    result.width = result.width - diff;
  }
  if (result.y < canvasBounds.y) {
    const diff = canvasBounds.y - result.y;
    result.y = canvasBounds.y;
    result.height = result.height - diff;
  }

  // Ensure minimum dimensions after all constraints
  result.width = Math.max(result.width, 10);
  result.height = Math.max(result.height, 10);

  return result;
}

export function getBoundaryConstraints(
  domElement: HTMLElement,
  elementBounds: Bounds,
  canvasSelector = "[data-aqb-canvas], .aqb-canvas"
): BoundaryConstraints {
  devLog("ConstraintManager", "Starting boundary detection for element:", domElement);

  const canvas = document.querySelector(canvasSelector) as HTMLElement | null;
  const canvasRect = canvas?.getBoundingClientRect();

  const canvasBounds: Bounds = {
    x: 0,
    y: 0,
    width: canvasRect?.width || 1440,
    height: canvasRect?.height || 900,
  };

  const parent = domElement.parentElement;
  devLog("ConstraintManager", "Parent element:", parent);
  devLog(
    "ConstraintManager",
    `Parent has aqb-canvas class? ${parent?.classList.contains("aqb-canvas")}`
  );
  devLog(
    "ConstraintManager",
    `Parent has data-aqb-canvas? ${parent?.hasAttribute("data-aqb-canvas")}`
  );

  let parentBounds: Bounds | null = null;
  let parentElementId: string | null = null;
  let parentElement: HTMLElement | null = null;
  let offsetInParent = { x: elementBounds.x, y: elementBounds.y };

  if (
    parent &&
    !parent.classList.contains("aqb-canvas") &&
    !parent.hasAttribute("data-aqb-canvas")
  ) {
    devLog("ConstraintManager", "✅ Valid parent detected! Setting up parent bounds...");

    const parentRect = parent.getBoundingClientRect();
    const canvasOffset = canvasRect
      ? { left: canvasRect.left, top: canvasRect.top }
      : { left: 0, top: 0 };

    parentBounds = {
      x: parentRect.left - canvasOffset.left,
      y: parentRect.top - canvasOffset.top,
      width: parentRect.width,
      height: parentRect.height,
    };

    parentElementId = parent.getAttribute("data-aqb-id");
    parentElement = parent;

    offsetInParent = {
      x: elementBounds.x - parentBounds.x,
      y: elementBounds.y - parentBounds.y,
    };

    devLog("ConstraintManager", "Parent bounds:", parentBounds);
    devLog("ConstraintManager", `Parent ID: ${parentElementId}`);
  } else {
    devLog("ConstraintManager", "❌ No valid parent (element is at root or parent is canvas)");
  }

  return {
    parentBounds,
    parentElementId,
    parentElement,
    canvasBounds,
    offsetInParent,
  };
}
