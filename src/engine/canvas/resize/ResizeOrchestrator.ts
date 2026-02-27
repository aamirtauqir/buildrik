/**
 * Resize Orchestrator - Coordinates resize calculations
 * Orchestrates the flow: calculate → aspect ratio → center → snap → constraints
 *
 * @module engine/canvas/resize/ResizeOrchestrator
 * @license BSD-3-Clause
 */

import { applyConstraints, applyBoundaryConstraints } from "./ConstraintManager";
import { expandParent } from "./DOMUpdater";
import {
  calculateBoundsFromHandle,
  applyAspectRatio,
  applyCenterResize,
  calculateRotation,
} from "./resizeMath";
import { snapToGrid, snapToElements } from "./SnapManager";
import type { HandlePosition, TransformBounds, ResizeState } from "./types";

// =============================================================================
// RESIZE BOUNDS CALCULATION
// =============================================================================

/**
 * Calculate new bounds during resize operation
 * Applies all transformations in correct order:
 * 1. Base calculation from handle delta
 * 2. Aspect ratio (if Shift or locked)
 * 3. Center resize (if Alt)
 * 4. Grid snapping (if enabled)
 * 5. Element snapping (if enabled)
 * 6. Size constraints
 * 7. Boundary constraints
 */
export function calculateResizeBounds(
  state: ResizeState,
  mouseX: number,
  mouseY: number,
  composer: {
    elements: {
      getElement(id: string):
        | {
            setStyle?(prop: string, value: string): void;
          }
        | null
        | undefined;
    };
  }
): TransformBounds {
  const { handle, startBounds, startMouse, constraints, modifiers, snap, centerPoint } = state;

  const deltaX = mouseX - startMouse.x;
  const deltaY = mouseY - startMouse.y;
  const snapEnabled = modifiers.ctrl ? !snap.snapToGrid : snap.snapToGrid;

  // Step 1: Calculate base bounds from handle delta
  let newBounds = calculateBoundsFromHandle(
    handle as HandlePosition,
    startBounds,
    deltaX,
    deltaY,
    constraints
  );

  // Step 2: Apply aspect ratio (Shift key or locked)
  if (modifiers.shift || constraints.lockAspectRatio) {
    const ratio = constraints.aspectRatio || state.aspectRatio;
    newBounds = applyAspectRatio(newBounds, handle as HandlePosition, ratio, startBounds);
  }

  // Step 3: Apply center resize (Alt key)
  if (modifiers.alt) {
    newBounds = applyCenterResize(newBounds, centerPoint, handle as HandlePosition);
  }

  // Step 4: Apply grid snapping
  if (snapEnabled && snap.gridSize > 0) {
    newBounds = snapToGrid(newBounds, snap.gridSize, handle as HandlePosition);
  }

  // Step 5: Apply element snapping
  if (snap.snapToElements) {
    const snapped = snapToElements(newBounds, state.elementId, snap.snapThreshold);
    newBounds = snapped.bounds;
    state.snappedEdges = snapped.edges;
  }

  // Step 6: Apply size constraints
  newBounds = applyConstraints(newBounds, constraints);

  // Step 7: Apply boundary constraints
  newBounds = applyBoundaryConstraints(
    newBounds,
    state.boundaryConstraints,
    (parentId, parentEl, w, h) => expandParent(parentId, parentEl, w, h, composer)
  );

  return newBounds;
}

// =============================================================================
// ROTATION BOUNDS CALCULATION
// =============================================================================

/**
 * Calculate rotation bounds during rotation operation
 * Applies rotation with optional snap to angles
 */
export function calculateRotationBounds(
  state: ResizeState,
  mouseX: number,
  mouseY: number
): TransformBounds {
  const { startBounds, centerPoint, startRotation, snap, modifiers, startMouse } = state;

  const rotation = calculateRotation(
    centerPoint,
    startMouse,
    { x: mouseX, y: mouseY },
    startRotation,
    modifiers.shift,
    snap.rotationSnapAngles
  );

  // Update state's current rotation
  state.currentRotation = rotation;

  return { ...startBounds, rotation };
}
