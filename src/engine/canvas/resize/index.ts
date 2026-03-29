/**
 * Resize Module Barrel Exports
 * @license BSD-3-Clause
 */

// Types
export type {
  HandlePosition,
  RotationHandle,
  AnyHandle,
  Bounds,
  TransformBounds,
  SnappedEdges,
  EdgePositions,
  SizeConstraints,
  BoundaryConstraints,
  SnapConfig,
  SnapResult,
  ModifierKeys,
  ResizeOptions,
  ResizeState,
  ResizeEventData,
} from "./types";

// Constants
export {
  DEFAULT_CONSTRAINTS,
  DEFAULT_SNAP_CONFIG,
  ELEMENT_CONSTRAINTS,
  DEFAULT_HANDLE_HIT_AREA,
  DEFAULT_BORDER_HIT_WIDTH,
  HANDLE_CURSORS,
  ROTATION_CURSOR,
  MOVE_THROTTLE_MS,
  ROTATION_SNAP_THRESHOLD,
  SHIFT_ROTATION_SNAP_ANGLE,
} from "./constants";

// Utilities
export {
  getDOMElement,
  getCanvasContainer,
  getCanvasBounds,
  getCursor,
  setResizeCursor,
  resetCursor,
  getClientCoords,
  normalizeAngle,
  calculateAngle,
  affectsWidth,
  affectsHeight,
  affectsLeft,
  affectsTop,
  isCornerHandle,
  isEdgeHandle,
} from "./utils";

// Resize Math (pure functions: bounds from handle, aspect ratio, center resize, rotation)
export {
  calculateBoundsFromHandle,
  applyAspectRatio,
  applyCenterResize,
  calculateRotation,
  scaleBounds,
} from "./resizeMath";

// Snap Manager
export { snapToGrid, getEdgePositions, snapToElements } from "./SnapManager";

// Constraint Manager
export {
  applyConstraints,
  applyBoundaryConstraints,
  getBoundaryConstraints,
} from "./ConstraintManager";

// Hit Tester
export { hitTestHandles, hitTestRotation, hitTestBorder, hitTest } from "./HitTester";

// DOM Updater
export {
  applyBoundsToDOM,
  applyMultiResizeToDOM,
  expandParentDOM,
  applyBoundsToModel,
  applyMultiResizeToModel,
  expandParent,
} from "./DOMUpdater";

// Resize Orchestrator
export { calculateResizeBounds, calculateRotationBounds } from "./ResizeOrchestrator";
