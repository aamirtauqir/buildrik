/**
 * Drag & Drop Utilities - Modular Export
 * Complete drag & drop system for Canvas operations
 *
 * @module utils/dragDrop
 * @license BSD-3-Clause
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  // Core types
  Point,
  Rect,
  DropPosition,
  DragState,
  DragSourceType,
  AxisConstraint,
  // Drag data types
  DragData,
  DragDataElement,
  DragDataBlock,
  DragDataMulti,
  DragDataExternal,
  DragDataUnknown,
  MultiDragElement,
  // Extended geometry
  ElementRect,
  // Options & Results
  FindDropTargetOptions,
  DropTargetResult,
  DropTargetSearchResult,
  DropIndicatorStyle,
  // Session types
  DragConstraints,
  DragSession,
  // Event types
  DragEventType,
  DragEvent,
  DragEventHandler,
  // Drop zone types
  DropZone,
  DropZoneRegistry,
  // Touch types
  TouchDragState,
  // Keyboard types
  KeyboardDragConfig,
  // Ghost options
  DragGhostOptions,
  AutoScrollConfig,
} from "./types";

// =============================================================================
// GEOMETRY
// =============================================================================

export {
  distance,
  manhattanDistance,
  pointInRect,
  getRectCenter,
  clampToRect,
  snapToGrid,
  applyAxisConstraint,
  domRectToRect,
  getEventPosition,
  getPagePosition,
  rectsOverlap,
  getOverlapArea,
  findMostOverlapping,
} from "./geometry";

// =============================================================================
// DOM HELPERS
// =============================================================================

export {
  getElementId,
  setElementId,
  findDOMElementById,
  findAllDOMElements,
  findDropTargetElement,
  findAllElementsAtPoint,
  findValidDOMTarget,
  getDescendantIds,
  isDescendantOf,
  getScrollableParent,
  cleanupDropIndicators,
} from "./domHelpers";

// =============================================================================
// DRAG DATA
// =============================================================================

export {
  generateDragSessionId,
  parseDragData,
  setElementDragData,
  setBlockDragData,
  setMultiDragData,
  hasDragDataType,
  getDragEffect,
} from "./dragData";

// =============================================================================
// DROP TARGET
// =============================================================================

export {
  findValidDropTarget,
  findValidDropTargetWithFallback,
  findBestDropTarget,
} from "./dropTarget";

// =============================================================================
// POSITIONING
// =============================================================================

export {
  calculateFinalIndex,
  wouldMoveChangePosition,
  calculateInsertionIndex,
  calculateDropPosition,
  calculateDropPosition2D,
  calculateDropPosition4D,
  isHorizontalLayout,
} from "./positioning";

// =============================================================================
// INDICATORS
// =============================================================================

export {
  calculateDropIndicator,
  createDropIndicatorElement,
  updateDropIndicator,
} from "./indicators";

// =============================================================================
// DRAG GHOST
// =============================================================================

export {
  createDragGhost,
  updateDragGhost,
  removeDragGhost,
  animateDragGhostToDrop,
} from "./dragGhost";

// =============================================================================
// AUTO-SCROLL
// =============================================================================

export { startAutoScroll, stopAutoScroll } from "./autoScroll";

// =============================================================================
// TOUCH SUPPORT
// =============================================================================

export {
  createTouchDragState,
  hasTouchMoved,
  startLongPressDetection,
  cancelLongPressDetection,
  preventTouchDefaults,
} from "./touchSupport";

// =============================================================================
// KEYBOARD SUPPORT
// =============================================================================

export { handleKeyboardDrag } from "./keyboardSupport";

// =============================================================================
// DROP ZONES
// =============================================================================

export { createDropZoneRegistry } from "./dropZones";

// =============================================================================
// SORTABLE
// =============================================================================

export {
  getSortableInsertIndex,
  calculatePlaceholderRect,
  animateSortableItems,
  resetSortableItems,
} from "./sortable";

// =============================================================================
// ANIMATIONS
// =============================================================================

export { animateToPosition, shakeElement, pulseElement } from "./animations";

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

export {
  createDragSession,
  getCurrentDragSession,
  getDragSessionById,
  updateDragSession,
  endDragSessionById,
  endDragSession,
  endAllDragSessions,
  getActiveDragSessionCount,
  isDragging,
  isSessionDragging,
} from "./session";

// =============================================================================
// DROP VALIDATION
// =============================================================================

export { validateDrop, validateElementDrop, getDropReasonMessage } from "./dropValidation";

export type { InvalidDropReason, DropValidationResult } from "./dropValidation";

// =============================================================================
// CONVENIENCE NAMESPACE
// =============================================================================

export { dragDropHelpers, dragDropHelpers as default } from "./namespace";
