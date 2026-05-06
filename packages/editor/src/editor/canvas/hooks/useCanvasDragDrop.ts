/**
 * Canvas Drag & Drop Hook
 * Orchestrates drag-and-drop using focused sub-hooks and utilities
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { findDropTargetElement } from "../../../shared/utils/dragDrop";
import type { InvalidDropReason } from "../../../shared/utils/dragDrop/dropValidation";
import { calculateFreshDropTarget } from "./drag/dragCalculations";
import {
  handleMultiElementDrop,
  handleElementDrop,
  handleComponentDrop,
  handleTemplateDrop,
  handleBlockDrop,
  type DropContext,
  type DropPayloads,
} from "./drag/dropOperations";
import { useDragAutoScroll } from "./useDragAutoScroll";
import { useDragSession } from "./useDragSession";
import type { DropPosition, DropSlotRect, BreadcrumbItem } from "./useDragSession";
import { useDragSnapGuides } from "./drag/useDragSnapGuides";
import { useDragVisuals } from "./useDragVisuals";
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

  // ==========================================================================
  // DROP HANDLER
  // ==========================================================================
  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();

      // =========================================================================
      // CRITICAL: Snapshot every DataTransfer channel SYNCHRONOUSLY, BEFORE any
      // React state updates, awaits, or sub-handler calls. In real browsers the
      // DataTransfer object is only reliably readable inside the synchronous
      // native drop handler — a single microtask boundary (e.g. `await`) zeros
      // it out. We pre-read once and pass the cached payloads down.
      // =========================================================================
      const payloads: DropPayloads = {
        multiData: e.dataTransfer.getData("application/x-aquibra-multi"),
        elementData: e.dataTransfer.getData("element"),
        componentId: e.dataTransfer.getData("application/x-aquibra-component"),
        templateData: e.dataTransfer.getData("application/aquibra-template"),
        blockData: e.dataTransfer.getData("block"),
      };

      resetSession();
      onSnapLinesChangeRef.current([]);
      visuals.clearAllIndicators();
      clearDropAffordance();
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

      // Both e.clientX/clientY and rects (from getBoundingClientRect) are in
      // viewport space — already scroll-invariant. No scroll correction needed.
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

      // =========================================================================
      // OS FILE DROP HANDLER (Desktop-to-Canvas Direct Drop)
      // =========================================================================
      if (e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter((f) => f.type.startsWith("image/"));

        if (imageFiles.length > 0) {
          const { targetId: freshTargetId } = calculateFreshDropTarget(
            e.clientX,
            e.clientY,
            composer,
            canvasRef,
            findDropTargetElement
          );

          if (freshTargetId) {
            const el = composer.elements.getElement(freshTargetId);
            if (el) {
              // Upload and apply first image to target element
              const file = imageFiles[0];
              onDropSuccessRef.current?.({
                elementLabel: `Uploading ${file.name}...`,
                elementType: "image",
              });

              try {
                const result = await composer.media.uploadFile(file);
                if (result.success && result.asset) {
                  el.setAttribute("src", result.asset.src);
                  onDropSuccessRef.current?.({
                    elementLabel: `${file.name} applied ✓`,
                    elementType: "image",
                  });
                }
              } catch (err) {
                onDropErrorRef.current?.({
                  type: "INSERT_FAILED",
                  message: "Could not upload dropped image",
                });
              }
            }
          }
          return;
        }
      }

      // Try each drop type in order
      let dropSucceeded = false;
      if (handleMultiElementDrop(e, ctx, payloads)) {
        dropSucceeded = true;
      } else if (handleElementDrop(e, ctx, dropTargetId, payloads)) {
        dropSucceeded = true;
      } else if (await handleComponentDrop(e, ctx, payloads)) {
        dropSucceeded = true;
      } else if (handleTemplateDrop(e, ctx, payloads)) {
        dropSucceeded = true;
      } else {
        handleBlockDrop(e, ctx, payloads);
        dropSucceeded = true;
      }

      // Notify DragManager SSOT
      composer.drag?.end(dropSucceeded);
    },
    [
      composer,
      isEditing,
      dropTargetId,
      canvasRef,
      resetSession,
      visuals,
      autoScroll,
      clearDropAffordance,
    ]
  );

  const handleInternalMediaDrop = React.useCallback(
    async (e: React.DragEvent) => {
      const src = e.dataTransfer.getData("application/x-aquibra-media-src");
      const rawType = e.dataTransfer.getData("application/x-aquibra-media-type");
      const name = e.dataTransfer.getData("application/x-aquibra-media-name");
      if (!src || !composer) return;

      // Translate drop viewport coords to canvas-space coords. If we're
      // over a specific element (section with bg-image, img placeholder),
      // prefer that as targetElementId so the src replaces rather than
      // creates a new element. Otherwise fall back to coords-on-root.
      const { targetId } = calculateFreshDropTarget(
        e.clientX,
        e.clientY,
        composer,
        canvasRef,
        findDropTargetElement,
      );

      const canvasEl = canvasRef.current;
      const rect = canvasEl?.getBoundingClientRect();
      const x = rect ? Math.round(e.clientX - rect.left) : undefined;
      const y = rect ? Math.round(e.clientY - rect.top) : undefined;

      // Normalize the legacy "img"/"vid"/"ico"/"fnt" filter keys to the
      // engine's MediaInsertType vocabulary.
      const insertType =
        rawType === "img"
          ? "image"
          : rawType === "vid"
            ? "video"
            : rawType === "ico"
              ? "icon"
              : rawType === "fnt"
                ? "font"
                : (rawType as "image" | "video" | "icon" | "svg" | "audio" | "lottie" | "font");

      try {
        const result = composer.mediaCommands.insertMediaAt(src, insertType, {
          x,
          y,
          targetElementId: targetId ?? undefined,
          path: "drag",
        });

        if (result) {
          onDropSuccessRef.current?.({
            elementLabel: `${name || "Media"} ${targetId ? "applied" : "added"} ✓`,
            elementType: insertType,
          });
        } else {
          onDropErrorRef.current?.({
            type: "INSERT_FAILED",
            message: "Could not place media",
          });
        }
      } catch (err) {
        // MediaNoActivePageError and friends land here.
        onDropErrorRef.current?.({
          type: "INSERT_FAILED",
          message: err instanceof Error ? err.message : String(err),
        });
      }

      // Auto-save remote (stock/discovery) assets to the library so the
      // user's next session has them locally.
      if ((insertType === "image" || rawType === "img") && src.startsWith("http")) {
        try {
          const res = await fetch(src);
          const blob = await res.blob();
          const file = new File(
            [blob],
            `imported-${(name || "img").substring(0, 10)}.webp`,
            { type: blob.type || "image/webp" },
          );
          await composer.media.uploadFile(file);
        } catch (err) {
          // Non-fatal — drop already succeeded, library is just the cache.
          console.warn("Media auto-save to library failed:", err);
        }
      }
    },
    [composer, canvasRef],
  );

  const handleDropWithInternal = React.useCallback(
    async (e: React.DragEvent) => {
      const internalSrc = e.dataTransfer.getData("application/x-aquibra-media-src");
      if (internalSrc) {
        e.preventDefault();
        await handleInternalMediaDrop(e);
        return;
      }
      await handleDrop(e);
    },
    [handleDrop, handleInternalMediaDrop]
  );

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
    handleDrop: handleDropWithInternal,
    setDraggingElementId,
  };
}
