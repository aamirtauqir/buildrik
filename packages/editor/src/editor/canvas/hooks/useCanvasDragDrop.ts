/**
 * Canvas Drag & Drop Hook
 * Orchestrates drag-and-drop using focused sub-hooks and utilities
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { InvalidDropReason } from "../../../shared/utils/dragDrop/dropValidation";
import { useDragAutoScroll } from "./useDragAutoScroll";
import { useDragSession } from "./useDragSession";
import type { DropPosition, DropSlotRect, BreadcrumbItem } from "./useDragSession";
import { useDragSnapGuides } from "./drag/useDragSnapGuides";
import { useDragVisuals } from "./useDragVisuals";
import { useDropExecution } from "./drag/useDropExecution";
import { useDropTargetResolver } from "./drag/useDropTargetResolver";

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
  canvasRef: React.RefObject<HTMLDivElement | null>;
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

  const SNAP_THROTTLE_MS = 50;

  // Drop target resolution + validation + visuals coordination — extracted
  // into its own hook (Phase D D1 stage 2). Owns the per-dragOver target
  // lookup, breadcrumb build, validation, and the drop-affordance CSS class.
  const dropTargetResolver = useDropTargetResolver({
    composer,
    canvasRef,
    session,
    visuals,
    draggingElementId,
  });
  const clearDropAffordance = dropTargetResolver.clearAffordance;

  // Refs for callbacks to avoid recreating handlers
  const onSnapLinesChangeRef = React.useRef(onSnapLinesChange);
  const onDropErrorRef = React.useRef(onDropError);
  const onDropSuccessRef = React.useRef(onDropSuccess);

  React.useEffect(() => {
    onSnapLinesChangeRef.current = onSnapLinesChange;
  }, [onSnapLinesChange]);

  // Snap guide computation extracted into its own hook (Phase D D1 stage 1).
  const snapGuides = useDragSnapGuides({
    composer,
    canvasRef,
    showGuides,
    draggingElementId,
    snapCalculator,
    onSnapLinesChangeRef,
  });

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
      const isThrottled = now - snapGuides.lastSnapCalcRef.current < SNAP_THROTTLE_MS;

      setIsDragOver(true);

      // Resolve target + position + validation + visuals via the resolver hook.
      dropTargetResolver.resolve(e);

      // Skip expensive snap calculation if throttled
      if (!isThrottled) {
        snapGuides.calculate(e, now);
      }

      // Auto-scroll when near canvas edges
      autoScroll.handleAutoScroll(e.clientX, e.clientY);
    },
    [isEditing, setIsDragOver, dropTargetResolver, snapGuides, autoScroll],
  );

  // ==========================================================================
  // DRAG LEAVE HANDLER
  // ==========================================================================
  const handleDragLeave = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      const stillInCanvas = relatedTarget?.closest(".buildrick-canvas");
      if (!stillInCanvas) {
        resetSession();
        onSnapLinesChangeRef.current([]);
        visuals.clearAllIndicators();
        clearDropAffordance();
        autoScroll.stopCurrentAutoScroll();
        composer?.drag?.cancel("Left canvas");
      }
    },
    [composer, resetSession, visuals, autoScroll, clearDropAffordance]
  );

  // Drop dispatcher — extracted into useDropExecution (Phase D D1 stage 3).
  // Owns DataTransfer pre-snapshot, OS file drop, internal media drop, and
  // the 5-handler dispatch chain.
  const dropExecution = useDropExecution({
    composer,
    canvasRef,
    isEditing,
    dropTargetId,
    resetSession,
    visuals,
    autoScroll,
    clearDropAffordance,
    onSnapLinesChangeRef,
    onDropErrorRef,
    onDropSuccessRef,
  });

  // ==========================================================================
  // CLEANUP EFFECTS
  // ==========================================================================
  // Snap-throttle reset effect lives in useDragSnapGuides now.

  // Global dragend listener for cleanup
  React.useEffect(() => {
    const handleGlobalDragEnd = () => {
      onSnapLinesChangeRef.current([]);
      visuals.clearAllIndicators();
      clearDropAffordance();
      resetSession();
      autoScroll.stopCurrentAutoScroll();
      composer?.drag?.cancel("Global dragend");
    };

    document.addEventListener("dragend", handleGlobalDragEnd);
    return () => document.removeEventListener("dragend", handleGlobalDragEnd);
  }, [visuals, resetSession, autoScroll, clearDropAffordance, composer]);

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
    handleDrop: dropExecution.drop,
    setDraggingElementId,
  };
}
