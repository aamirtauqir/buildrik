/**
 * Canvas Drag & Drop Hook
 * Orchestrates drag-and-drop using focused sub-hooks and utilities
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { SNAP_THRESHOLD } from "../../../engine/canvas/constants";
import type { SnapPoint, SmartGuide } from "../../../shared/types/canvas";
import { findDropTargetElement, getElementId } from "../../../shared/utils/dragDrop";
import type { InvalidDropReason } from "../../../shared/utils/dragDrop/dropValidation";
import {
  calculateDropPositionFromCursor,
  calculateDropSlotRect,
  validateDropOperation,
  buildBreadcrumbPath,
  calculateFreshDropTarget,
} from "./drag/dragCalculations";
import {
  handleMultiElementDrop,
  handleElementDrop,
  handleComponentDrop,
  handleTemplateDrop,
  handleBlockDrop,
  type DropContext,
} from "./drag/dropOperations";
import { useDragAutoScroll } from "./useDragAutoScroll";
import { useDragSession } from "./useDragSession";
import type { DropPosition, DropSlotRect, BreadcrumbItem } from "./useDragSession";
import { useDragVisuals } from "./useDragVisuals";

// Extracted drop handlers

// Import shared types from useDragSession to avoid duplication

// Re-export for backward compatibility
export type { DropPosition, DropSlotRect, BreadcrumbItem };

/** Drop error types for user feedback */
export type DropErrorType =
  | "NO_COMPOSER"
  | "EDITING_MODE"
  | "NO_VALID_TARGET"
  | "INVALID_DATA"
  | "NESTING_FORBIDDEN"
  | "VALIDATION_FAILED"
  | "MOVE_FAILED"
  | "INSERT_FAILED";

export interface DropError {
  type: DropErrorType;
  message: string;
}

/** Drop success payload for toast notifications */
export interface DropSuccess {
  elementLabel: string;
  elementType: string;
}

export interface UseCanvasDragDropOptions {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLDivElement>;
  showGuides: boolean;
  isEditing: boolean;
  onSnapLinesChange: (lines: import("./useCanvasSnapping").SnapLine[]) => void;
  snapCalculator?: (
    id: string,
    rect: { left: number; top: number; width: number; height: number },
    scale: number
  ) => { x: number; y: number; snapLines: import("./useCanvasSnapping").SnapLine[] };
  /** Callback for drop errors to show user feedback */
  onDropError?: (error: DropError) => void;
  /** Callback for successful drops to show toast notification */
  onDropSuccess?: (success: DropSuccess) => void;
}

export interface UseCanvasDragDropResult {
  isDragOver: boolean;
  dropTargetId: string | null;
  dropPosition: DropPosition;
  draggingElementId: string | null;
  /** Whether current drop target is valid */
  isValidDrop: boolean;
  /** Reason for invalid drop (null if valid) */
  invalidDropReason: InvalidDropReason;
  /** Animated drop slot preview rect (for before/after positions) */
  dropSlotRect: DropSlotRect | null;
  /** Breadcrumb path showing element hierarchy during drag */
  dropTargetPath: BreadcrumbItem[];
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  setDraggingElementId: (id: string | null) => void;
}

export function useCanvasDragDrop({
  composer,
  canvasRef,
  showGuides,
  isEditing,
  onSnapLinesChange,
  snapCalculator,
  onDropError,
  onDropSuccess,
}: UseCanvasDragDropOptions): UseCanvasDragDropResult {
  // Use sub-hooks for focused responsibilities
  const session = useDragSession();
  const visuals = useDragVisuals({ canvasRef });
  const autoScroll = useDragAutoScroll({ canvasRef });

  // Destructure session state
  const {
    isDragOver,
    setIsDragOver,
    dropTargetId,
    setDropTargetId,
    dropPosition,
    setDropPosition,
    draggingElementId,
    setDraggingElementId,
    isValidDrop,
    setIsValidDrop,
    invalidDropReason,
    setInvalidDropReason,
    dropSlotRect,
    setDropSlotRect,
    dropTargetPath,
    setDropTargetPath,
    resetSession,
  } = session;

  // Throttle ref for snap calculation
  const lastSnapCalcRef = React.useRef<number>(0);
  const SNAP_THROTTLE_MS = 50;

  // Refs for callbacks to avoid recreating handlers
  const onSnapLinesChangeRef = React.useRef(onSnapLinesChange);
  const onDropErrorRef = React.useRef(onDropError);
  const onDropSuccessRef = React.useRef(onDropSuccess);

  React.useEffect(() => {
    onSnapLinesChangeRef.current = onSnapLinesChange;
  }, [onSnapLinesChange]);

  React.useEffect(() => {
    onDropErrorRef.current = onDropError;
  }, [onDropError]);

  React.useEffect(() => {
    onDropSuccessRef.current = onDropSuccess;
  }, [onDropSuccess]);

  // ==========================================================================
  // DRAG OVER HANDLER
  // ==========================================================================
  const handleDragOver = React.useCallback(
    (e: React.DragEvent) => {
      if (isEditing) return;
      e.preventDefault();
      e.stopPropagation();

      const now = Date.now();
      const isThrottled = now - lastSnapCalcRef.current < SNAP_THROTTLE_MS;

      setIsDragOver(true);

      // Find drop target
      const dropTarget = findDropTargetElement(e.clientX, e.clientY);
      let targetId = getElementId(dropTarget);

      // Fallback to root if no target
      if (!targetId && composer) {
        const page = composer.elements.getActivePage();
        if (page?.root?.id) targetId = page.root.id;
      }

      if (targetId && composer) {
        setDropTargetId(targetId);

        const targetEl = canvasRef.current?.querySelector(
          `[data-aqb-id="${targetId}"]`
        ) as HTMLElement | null;

        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          const canvasRect = canvasRef.current?.getBoundingClientRect();

          // Calculate drop position
          const { position, isParentHorizontal } = calculateDropPositionFromCursor(
            e.clientX,
            e.clientY,
            rect,
            targetEl.parentElement
          );
          setDropPosition(position);

          // Calculate drop slot rect
          if (canvasRect) {
            const slotRect = calculateDropSlotRect({
              position,
              targetRect: rect,
              canvasRect,
              isParentHorizontal,
            });
            setDropSlotRect(slotRect);
          }

          // Show visual feedback
          visuals.showDropTarget(targetEl, position);
          visuals.clearInvalidTarget();

          // Validate drop operation
          const validation = validateDropOperation({
            composer,
            draggingElementId,
            targetId,
            position,
            dataTransferTypes: e.dataTransfer.types,
          });
          setIsValidDrop(validation.isValid);
          setInvalidDropReason(validation.reason);

          if (!validation.isValid) {
            visuals.showInvalidTarget(targetEl);
          }

          // Build breadcrumb path
          setDropTargetPath(buildBreadcrumbPath(composer, targetId));

          // Update DragManager SSOT (fires throttled DRAG_MOVE event)
          composer.drag?.move(
            { x: e.clientX, y: e.clientY },
            targetId,
            position,
            validation.isValid
          );
        } else {
          // Target element not found in DOM
          setDropPosition("inside");
          setIsValidDrop(true);
          setInvalidDropReason(null);
          setDropSlotRect(null);
          setDropTargetPath([]);
          visuals.clearDropTarget();
          visuals.clearInvalidTarget();
        }
      } else {
        setDropTargetId(null);
        setDropPosition(null);
        setIsValidDrop(true);
        setInvalidDropReason(null);
        setDropSlotRect(null);
        setDropTargetPath([]);
        visuals.clearDropTarget();
      }

      // Skip expensive snap calculation if throttled
      if (!isThrottled) {
        calculateSnapGuides(e, now);
      }

      // Auto-scroll when near canvas edges
      autoScroll.handleAutoScroll(e.clientX, e.clientY);
    },
    [composer, showGuides, draggingElementId, isEditing, canvasRef, visuals, autoScroll]
  );

  // Snap guide calculation (extracted for readability)
  const calculateSnapGuides = React.useCallback(
    (e: React.DragEvent, now: number) => {
      if (!composer?.canvasIndicators || !showGuides || !canvasRef.current || !draggingElementId) {
        onSnapLinesChangeRef.current([]);
        lastSnapCalcRef.current = now;
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;

      const draggedDomEl = canvasRef.current.querySelector(
        `[data-aqb-id="${draggingElementId}"]`
      ) as HTMLElement | null;

      const lines: import("./useCanvasSnapping").SnapLine[] = [];

      if (draggedDomEl) {
        const draggedRect = draggedDomEl.getBoundingClientRect();
        const draggedBounds = {
          x: draggedRect.left - rect.left,
          y: draggedRect.top - rect.top,
          width: draggedRect.width,
          height: draggedRect.height,
        };

        if (snapCalculator) {
          const snapResult = snapCalculator(
            draggingElementId,
            {
              left: draggedBounds.x,
              top: draggedBounds.y,
              width: draggedBounds.width,
              height: draggedBounds.height,
            },
            1
          );
          if (snapResult.snapLines) lines.push(...snapResult.snapLines);
        } else {
          const smartGuides = composer.canvasIndicators.calculateSmartGuides(
            draggingElementId,
            draggedBounds
          );
          smartGuides.forEach((guide: SmartGuide) => {
            lines.push({
              orientation: guide.axis,
              position: guide.position,
              start: -99999,
              end: 99999,
            });
          });
        }
      }

      // Check snap points
      const snapPoints = composer.canvasIndicators.calculateSnapPoints(draggingElementId) || [];
      snapPoints.forEach((pt: SnapPoint) => {
        if (pt.axis === "vertical" && Math.abs(localX - pt.position) <= SNAP_THRESHOLD) {
          if (
            !lines.some(
              (l) => l.orientation === "vertical" && Math.abs(l.position - pt.position) < 2
            )
          ) {
            lines.push({
              orientation: "vertical",
              position: pt.position,
              start: -99999,
              end: 99999,
            });
          }
        }
        if (pt.axis === "horizontal" && Math.abs(localY - pt.position) <= SNAP_THRESHOLD) {
          if (
            !lines.some(
              (l) => l.orientation === "horizontal" && Math.abs(l.position - pt.position) < 2
            )
          ) {
            lines.push({
              orientation: "horizontal",
              position: pt.position,
              start: -99999,
              end: 99999,
            });
          }
        }
      });

      onSnapLinesChangeRef.current(lines);
      lastSnapCalcRef.current = now;
    },
    [composer, showGuides, draggingElementId, canvasRef, snapCalculator]
  );

  // ==========================================================================
  // DRAG LEAVE HANDLER
  // ==========================================================================
  const handleDragLeave = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      const stillInCanvas = relatedTarget?.closest(".aqb-canvas");
      if (!stillInCanvas) {
        resetSession();
        onSnapLinesChangeRef.current([]);
        visuals.clearAllIndicators();
        autoScroll.stopCurrentAutoScroll();
        composer?.drag?.cancel("Left canvas");
      }
    },
    [composer, resetSession, visuals, autoScroll]
  );

  // ==========================================================================
  // DROP HANDLER
  // ==========================================================================
  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      resetSession();
      onSnapLinesChangeRef.current([]);
      visuals.clearAllIndicators();
      autoScroll.stopCurrentAutoScroll();

      if (!composer || isEditing) {
        if (isEditing) {
          onDropErrorRef.current?.({
            type: "EDITING_MODE",
            message: "Cannot drop while editing text",
          });
        }
        return;
      }

      // Calculate fresh drop target at drop time
      const { targetId: freshTargetId, dropPosition: freshDropPosition } = calculateFreshDropTarget(
        e.clientX,
        e.clientY,
        composer,
        canvasRef,
        findDropTargetElement
      );

      // Create drop context for handlers
      const ctx: DropContext = {
        composer,
        canvasRef,
        freshTargetId,
        freshDropPosition,
        onDropError: onDropErrorRef.current,
        onDropSuccess: onDropSuccessRef.current,
      };

      // Try each drop type in order
      let dropSucceeded = false;
      if (handleMultiElementDrop(e, ctx)) {
        dropSucceeded = true;
      } else if (handleElementDrop(e, ctx, dropTargetId)) {
        dropSucceeded = true;
      } else if (await handleComponentDrop(e, ctx)) {
        dropSucceeded = true;
      } else if (handleTemplateDrop(e, ctx)) {
        dropSucceeded = true;
      } else {
        handleBlockDrop(e, ctx);
        dropSucceeded = true;
      }

      // Notify DragManager SSOT
      composer.drag?.end(dropSucceeded);
    },
    [composer, isEditing, dropTargetId, canvasRef, resetSession, visuals, autoScroll]
  );

  // ==========================================================================
  // CLEANUP EFFECTS
  // ==========================================================================
  React.useEffect(() => {
    if (!draggingElementId) {
      lastSnapCalcRef.current = 0;
    }
  }, [draggingElementId]);

  // Global dragend listener for cleanup
  React.useEffect(() => {
    const handleGlobalDragEnd = () => {
      onSnapLinesChangeRef.current([]);
      visuals.clearAllIndicators();
      resetSession();
      autoScroll.stopCurrentAutoScroll();
      composer?.drag?.cancel("Global dragend");
    };

    document.addEventListener("dragend", handleGlobalDragEnd);
    return () => document.removeEventListener("dragend", handleGlobalDragEnd);
  }, [visuals, resetSession, autoScroll]);

  return {
    isDragOver,
    dropTargetId,
    dropPosition,
    draggingElementId,
    isValidDrop,
    invalidDropReason,
    dropSlotRect,
    dropTargetPath,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    setDraggingElementId,
  };
}
