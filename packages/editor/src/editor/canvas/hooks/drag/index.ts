/**
 * Drag Hooks Module
 * Specialized hooks for drag operations
 *
 * @module components/Canvas/hooks/drag
 * @license BSD-3-Clause
 */

// Drag calculation utilities (extracted from useCanvasDragDrop)
export {
  calculateDropPositionFromCursor,
  calculateDropSlotRect,
  validateDropOperation,
  buildBreadcrumbPath,
  calculateFreshDropTarget,
  type DropPositionResult,
  type DropSlotCalculationInput,
  type DropValidationInput,
  type DropValidationResult,
  type FreshDropTargetResult,
} from "./dragCalculations";

// Drop operation handlers (extracted from useCanvasDragDrop)
export {
  handleMultiElementDrop,
  handleElementDrop,
  handleComponentDrop,
  handleTemplateDrop,
  handleBlockDrop,
  type DropContext,
} from "./dropOperations";
