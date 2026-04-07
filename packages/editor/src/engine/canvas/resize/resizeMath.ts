/**
 * Bounds Calculator
 * Pure functions for calculating resize bounds
 *
 * @module engine/canvas/resize/resizeMath
 * @license BSD-3-Clause
 */

import { clamp } from "../../../shared/utils/helpers";
import type { HandlePosition, TransformBounds, SizeConstraints } from "./types";

/**
 * Calculate new bounds based on handle position and delta
 */
export function calculateBoundsFromHandle(
  handle: HandlePosition,
  startBounds: TransformBounds,
  deltaX: number,
  deltaY: number,
  constraints: SizeConstraints
): TransformBounds {
  const { minWidth, minHeight, maxWidth, maxHeight } = constraints;
  const newBounds: TransformBounds = { ...startBounds };

  switch (handle) {
    case "e":
      newBounds.width = clamp(startBounds.width + deltaX, minWidth, maxWidth);
      break;

    case "w": {
      const wWidth = clamp(startBounds.width - deltaX, minWidth, maxWidth);
      newBounds.x = startBounds.x + (startBounds.width - wWidth);
      newBounds.width = wWidth;
      break;
    }

    case "s":
      newBounds.height = clamp(startBounds.height + deltaY, minHeight, maxHeight);
      break;

    case "n": {
      const nHeight = clamp(startBounds.height - deltaY, minHeight, maxHeight);
      newBounds.y = startBounds.y + (startBounds.height - nHeight);
      newBounds.height = nHeight;
      break;
    }

    case "se":
      newBounds.width = clamp(startBounds.width + deltaX, minWidth, maxWidth);
      newBounds.height = clamp(startBounds.height + deltaY, minHeight, maxHeight);
      break;

    case "sw": {
      const swWidth = clamp(startBounds.width - deltaX, minWidth, maxWidth);
      newBounds.x = startBounds.x + (startBounds.width - swWidth);
      newBounds.width = swWidth;
      newBounds.height = clamp(startBounds.height + deltaY, minHeight, maxHeight);
      break;
    }

    case "ne": {
      newBounds.width = clamp(startBounds.width + deltaX, minWidth, maxWidth);
      const neHeight = clamp(startBounds.height - deltaY, minHeight, maxHeight);
      newBounds.y = startBounds.y + (startBounds.height - neHeight);
      newBounds.height = neHeight;
      break;
    }

    case "nw": {
      const nwWidth = clamp(startBounds.width - deltaX, minWidth, maxWidth);
      const nwHeight = clamp(startBounds.height - deltaY, minHeight, maxHeight);
      newBounds.x = startBounds.x + (startBounds.width - nwWidth);
      newBounds.y = startBounds.y + (startBounds.height - nwHeight);
      newBounds.width = nwWidth;
      newBounds.height = nwHeight;
      break;
    }
  }

  return newBounds;
}

/**
 * Apply aspect ratio constraint to bounds
 */
export function applyAspectRatio(
  bounds: TransformBounds,
  handle: HandlePosition,
  aspectRatio: number,
  startBounds: TransformBounds
): TransformBounds {
  const result = { ...bounds };

  if (handle === "e" || handle === "w") {
    result.height = result.width / aspectRatio;
  } else if (handle === "n" || handle === "s") {
    result.width = result.height * aspectRatio;
  } else {
    // Corner handles - use diagonal direction
    const widthBasedHeight = result.width / aspectRatio;
    const heightBasedWidth = result.height * aspectRatio;

    // Prefer the dimension that changed more
    const widthDelta = Math.abs(result.width - startBounds.width);
    const heightDelta = Math.abs(result.height - startBounds.height);

    if (widthDelta >= heightDelta) {
      result.height = widthBasedHeight;
    } else {
      result.width = heightBasedWidth;
    }
  }

  // Adjust position for handles affecting position
  if (handle.includes("n")) {
    result.y = startBounds.y + startBounds.height - result.height;
  }
  if (handle.includes("w")) {
    result.x = startBounds.x + startBounds.width - result.width;
  }

  return result;
}

/**
 * Apply center-based resize (Alt key behavior)
 */
export function applyCenterResize(
  bounds: TransformBounds,
  center: { x: number; y: number },
  handle: HandlePosition
): TransformBounds {
  const result = { ...bounds };

  // Apply changes symmetrically from center
  if (handle === "e" || handle === "w" || handle.includes("e") || handle.includes("w")) {
    result.x = center.x - result.width / 2;
  }
  if (handle === "n" || handle === "s" || handle.includes("n") || handle.includes("s")) {
    result.y = center.y - result.height / 2;
  }

  return result;
}

/**
 * Calculate rotation based on mouse position
 */
export function calculateRotation(
  centerPoint: { x: number; y: number },
  startMouse: { x: number; y: number },
  currentMouse: { x: number; y: number },
  startRotation: number,
  shiftHeld: boolean,
  snapAngles: number[],
  snapThreshold: number = 5
): number {
  // Calculate angle from center to mouse (in radians, then convert to degrees)
  const currentAngle =
    Math.atan2(currentMouse.y - centerPoint.y, currentMouse.x - centerPoint.x) * (180 / Math.PI);

  // Calculate angle from center to initial mouse position
  const startAngle =
    Math.atan2(startMouse.y - centerPoint.y, startMouse.x - centerPoint.x) * (180 / Math.PI);

  // Calculate rotation delta and add to start rotation
  let rotation = startRotation + (currentAngle - startAngle);

  // Normalize to 0-360 range
  rotation = ((rotation % 360) + 360) % 360;

  // Snap to angles (Shift for 15° increments)
  if (shiftHeld) {
    const snapAngle = 15;
    rotation = Math.round(rotation / snapAngle) * snapAngle;
    rotation = ((rotation % 360) + 360) % 360;
  } else if (snapAngles.length > 0) {
    for (const snapAngle of snapAngles) {
      const normalizedSnapAngle = ((snapAngle % 360) + 360) % 360;
      const diff = Math.abs(rotation - normalizedSnapAngle);
      if (diff < snapThreshold || Math.abs(diff - 360) < snapThreshold) {
        rotation = normalizedSnapAngle;
        break;
      }
    }
  }

  return rotation;
}

/**
 * Scale bounds for multi-element resize
 */
export function scaleBounds(
  startBounds: TransformBounds,
  primaryStartBounds: TransformBounds,
  primaryNewBounds: TransformBounds
): TransformBounds {
  const scaleX = primaryNewBounds.width / primaryStartBounds.width;
  const scaleY = primaryNewBounds.height / primaryStartBounds.height;

  const relX = startBounds.x - primaryStartBounds.x;
  const relY = startBounds.y - primaryStartBounds.y;

  return {
    x: primaryNewBounds.x + relX * scaleX,
    y: primaryNewBounds.y + relY * scaleY,
    width: startBounds.width * scaleX,
    height: startBounds.height * scaleY,
    rotation: startBounds.rotation,
  };
}
