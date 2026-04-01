/**
 * Drag & Drop Namespace Object
 * Convenience namespace for all drag & drop utilities
 *
 * @module utils/dragDrop/namespace
 * @license BSD-3-Clause
 */

import * as animations from "./animations";
import * as autoScroll from "./autoScroll";
import * as domHelpers from "./domHelpers";
import * as dragData from "./dragData";
import * as dragGhost from "./dragGhost";
import * as dropTarget from "./dropTarget";
import * as dropZones from "./dropZones";
import * as geometry from "./geometry";
import * as indicators from "./indicators";
import * as keyboardSupport from "./keyboardSupport";
import * as positioning from "./positioning";
import * as session from "./session";
import * as sortable from "./sortable";
import * as touchSupport from "./touchSupport";

export const dragDropHelpers = {
  // Utilities
  generateSessionId: dragData.generateDragSessionId,
  distance: geometry.distance,
  manhattanDistance: geometry.manhattanDistance,
  pointInRect: geometry.pointInRect,
  getRectCenter: geometry.getRectCenter,
  clampToRect: geometry.clampToRect,
  snapToGrid: geometry.snapToGrid,
  applyAxisConstraint: geometry.applyAxisConstraint,
  domRectToRect: geometry.domRectToRect,
  getEventPosition: geometry.getEventPosition,
  getPagePosition: geometry.getPagePosition,

  // DOM helpers
  getElementId: domHelpers.getElementId,
  setElementId: domHelpers.setElementId,
  findDOMElementById: domHelpers.findDOMElementById,
  findAllDOMElements: domHelpers.findAllDOMElements,
  findDropTargetElement: domHelpers.findDropTargetElement,
  findAllElementsAtPoint: domHelpers.findAllElementsAtPoint,
  findValidDOMTarget: domHelpers.findValidDOMTarget,
  getDescendantIds: domHelpers.getDescendantIds,
  isDescendantOf: domHelpers.isDescendantOf,
  getScrollableParent: domHelpers.getScrollableParent,

  // Drag data
  parseDragData: dragData.parseDragData,
  setElementDragData: dragData.setElementDragData,
  setBlockDragData: dragData.setBlockDragData,
  setMultiDragData: dragData.setMultiDragData,
  hasDragDataType: dragData.hasDragDataType,
  getDragEffect: dragData.getDragEffect,

  // Drop target resolution
  findValidDropTarget: dropTarget.findValidDropTarget,
  findValidDropTargetWithFallback: dropTarget.findValidDropTargetWithFallback,
  findBestDropTarget: dropTarget.findBestDropTarget,

  // Index calculation
  calculateFinalIndex: positioning.calculateFinalIndex,
  wouldMoveChangePosition: positioning.wouldMoveChangePosition,
  calculateInsertionIndex: positioning.calculateInsertionIndex,

  // Drop position
  calculateDropPosition: positioning.calculateDropPosition,
  calculateDropPosition2D: positioning.calculateDropPosition2D,
  calculateDropPosition4D: positioning.calculateDropPosition4D,
  isHorizontalLayout: positioning.isHorizontalLayout,

  // Visual feedback
  calculateDropIndicator: indicators.calculateDropIndicator,
  createDropIndicatorElement: indicators.createDropIndicatorElement,
  updateDropIndicator: indicators.updateDropIndicator,

  // Drag ghost
  createDragGhost: dragGhost.createDragGhost,
  updateDragGhost: dragGhost.updateDragGhost,
  removeDragGhost: dragGhost.removeDragGhost,
  animateDragGhostToDrop: dragGhost.animateDragGhostToDrop,

  // Auto-scroll
  startAutoScroll: autoScroll.startAutoScroll,
  stopAutoScroll: autoScroll.stopAutoScroll,

  // Touch support
  createTouchDragState: touchSupport.createTouchDragState,
  hasTouchMoved: touchSupport.hasTouchMoved,
  startLongPressDetection: touchSupport.startLongPressDetection,
  cancelLongPressDetection: touchSupport.cancelLongPressDetection,
  preventTouchDefaults: touchSupport.preventTouchDefaults,

  // Keyboard support
  handleKeyboardDrag: keyboardSupport.handleKeyboardDrag,

  // Drop zones
  createDropZoneRegistry: dropZones.createDropZoneRegistry,

  // Sortable
  getSortableInsertIndex: sortable.getSortableInsertIndex,
  calculatePlaceholderRect: sortable.calculatePlaceholderRect,
  animateSortableItems: sortable.animateSortableItems,
  resetSortableItems: sortable.resetSortableItems,

  // Animations
  animateToPosition: animations.animateToPosition,
  shakeElement: animations.shakeElement,
  pulseElement: animations.pulseElement,

  // Session management
  createDragSession: session.createDragSession,
  getCurrentDragSession: session.getCurrentDragSession,
  updateDragSession: session.updateDragSession,
  endDragSession: session.endDragSession,
  isDragging: session.isDragging,

  // Collision detection
  rectsOverlap: geometry.rectsOverlap,
  getOverlapArea: geometry.getOverlapArea,
  findMostOverlapping: geometry.findMostOverlapping,
};

export default dragDropHelpers;
