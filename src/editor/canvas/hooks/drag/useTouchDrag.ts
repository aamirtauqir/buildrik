/**
 * Touch Drag Hook
 * Handles touch-based drag operations for mobile/tablet support
 *
 * Features:
 * - Long-press to initiate drag
 * - Touch move with drop target detection
 * - Visual feedback during drag
 * - Snap lines support
 *
 * @module components/Canvas/hooks/drag/useTouchDrag
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import type { ElementType, GrapesElement } from "../../../../shared/types";
import {
  createTouchDragState,
  hasTouchMoved,
  startLongPressDetection,
  cancelLongPressDetection,
  cleanupDropIndicators,
  type TouchDragState,
} from "../../../../shared/utils/dragDrop";
import { canNestElement } from "../../../../shared/utils/nesting";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Minimum movement (px) to cancel long-press */
const DRAG_THRESHOLD = 5;

/** Time (ms) to hold before drag starts */
const LONG_PRESS_DELAY = 500;

// =============================================================================
// TYPES
// =============================================================================

export interface UseTouchDragOptions {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLDivElement>;
  rootIdRef: React.MutableRefObject<string | null>;
  showGuides?: boolean;
  onDraggingChange: (elementId: string | null) => void;
  onSnapLinesChange: (lines: import("../useCanvasSnapping").SnapLine[]) => void;
}

export interface UseTouchDragResult {
  /** Whether touch drag is currently active */
  isTouchDragging: boolean;
  /** Touch event handlers to attach to canvas */
  touchHandlers: {
    onTouchStart: (e: TouchEvent) => void;
    onTouchMove: (e: TouchEvent) => void;
    onTouchEnd: (e: TouchEvent) => void;
    onTouchCancel: (e: TouchEvent) => void;
  };
  /** Reset all touch drag state */
  resetTouchState: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook for touch-based drag operations
 * Provides long-press to drag functionality for mobile/tablet
 */
export function useTouchDrag({
  composer,
  canvasRef,
  rootIdRef,
  showGuides = true,
  onDraggingChange,
  onSnapLinesChange,
}: UseTouchDragOptions): UseTouchDragResult {
  // Touch state refs
  const touchStateRef = React.useRef<TouchDragState | null>(null);
  const touchDraggingRef = React.useRef(false);
  const touchElementIdRef = React.useRef<string | null>(null);
  const touchDropTargetIdRef = React.useRef<string | null>(null);
  const isDraggingRef = React.useRef(false);

  /**
   * Reset all touch drag state and clean up visual feedback
   */
  const resetTouchState = React.useCallback(() => {
    // Clean up visual feedback if an element was being dragged
    if (touchElementIdRef.current && canvasRef.current) {
      try {
        const draggedEl = canvasRef.current.querySelector(
          `[data-aqb-id="${touchElementIdRef.current}"]`
        ) as HTMLElement | null;
        if (draggedEl) {
          draggedEl.style.opacity = "1";
          draggedEl.classList.remove("aqb-dragging");
        }

        // Unified cleanup for all drop indicators
        cleanupDropIndicators(canvasRef.current);
      } catch {
        // Element may have been removed from DOM
      }
    }

    // Reset all touch state refs
    touchDraggingRef.current = false;
    isDraggingRef.current = false;
    touchElementIdRef.current = null;
    touchDropTargetIdRef.current = null;

    // Notify parent
    try {
      onDraggingChange(null);
      onSnapLinesChange([]);
    } catch {
      // Callbacks may fail if component unmounted
    }
  }, [canvasRef, onDraggingChange, onSnapLinesChange]);

  /**
   * Handle touch start - setup for potential drag
   */
  const handleTouchStart = React.useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const target = touch.target as HTMLElement;
      const draggableEl = target.closest("[data-aqb-id]") as HTMLElement | null;
      if (!draggableEl) return;

      const elementId = draggableEl.getAttribute("data-aqb-id");
      const rootId = rootIdRef.current;

      // Don't allow dragging root element
      if (!elementId || elementId === rootId) return;

      // Create touch state and store in ref
      touchStateRef.current = createTouchDragState(touch);
      touchElementIdRef.current = elementId;

      // Capture values for closure
      const capturedElementId = elementId;
      const capturedDraggableEl = draggableEl;

      // Start long-press detection
      startLongPressDetection(
        touchStateRef.current,
        () => {
          // Long press completed - start drag
          if (touchStateRef.current && capturedElementId) {
            touchDraggingRef.current = true;
            isDraggingRef.current = true;
            onDraggingChange(capturedElementId);

            // Visual feedback
            capturedDraggableEl.style.opacity = "0.4";
            capturedDraggableEl.classList.add("aqb-dragging");
          }
        },
        LONG_PRESS_DELAY
      );
    },
    [rootIdRef, onDraggingChange]
  );

  /**
   * Handle touch move - update drag position and drop target
   */
  const handleTouchMove = React.useCallback(
    (e: TouchEvent) => {
      if (e.touches.length !== 1 || !touchStateRef.current) return;

      const touch = e.touches[0];

      // Update current position
      touchStateRef.current.currentPosition = {
        x: touch.clientX,
        y: touch.clientY,
      };

      // Check if moved beyond threshold (cancels long-press)
      if (hasTouchMoved(touchStateRef.current, DRAG_THRESHOLD)) {
        cancelLongPressDetection(touchStateRef.current);

        // Only handle drag if actually dragging
        if (touchDraggingRef.current) {
          e.preventDefault();
          onDraggingChange(touchElementIdRef.current);

          const canvas = canvasRef.current;
          const elementId = touchElementIdRef.current;

          // Find drop target under touch
          const elemUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
          const dropTargetEl = elemUnderTouch?.closest("[data-aqb-id]") as HTMLElement | null;
          const targetId = dropTargetEl?.getAttribute("data-aqb-id") || null;

          // Don't set self as drop target
          if (targetId && targetId !== elementId) {
            touchDropTargetIdRef.current = targetId;

            // Apply drop target visual feedback
            if (dropTargetEl && canvas) {
              canvas.querySelectorAll("[data-drop-target]").forEach((el) => {
                el.removeAttribute("data-drop-target");
              });
              dropTargetEl.setAttribute("data-drop-target", "true");
            }
          }

          // Calculate snap lines
          if (showGuides && composer?.canvasIndicators && canvas && elementId) {
            const draggableEl = canvas.querySelector(
              `[data-aqb-id="${elementId}"]`
            ) as HTMLElement | null;
            if (draggableEl) {
              const canvasRect = canvas.getBoundingClientRect();
              const elementRect = draggableEl.getBoundingClientRect();

              const smartGuides = composer.canvasIndicators.calculateSmartGuides(elementId, {
                x: elementRect.left - canvasRect.left,
                y: elementRect.top - canvasRect.top,
                width: elementRect.width,
                height: elementRect.height,
              });

              onSnapLinesChange(
                smartGuides.map((guide) => ({
                  orientation: guide.axis,
                  position: guide.position,
                  start: -99999,
                  end: 99999,
                }))
              );
            }
          }
        }
      }
    },
    [canvasRef, composer, showGuides, onDraggingChange, onSnapLinesChange]
  );

  /**
   * Handle touch end - complete the drag operation
   */
  const handleTouchEnd = React.useCallback(
    (_e: TouchEvent) => {
      // Cancel long-press detection
      if (touchStateRef.current) {
        cancelLongPressDetection(touchStateRef.current);
        touchStateRef.current = null;
      }

      if (touchDraggingRef.current && touchElementIdRef.current && composer) {
        // Move the element
        const sourceEl = composer.elements.getElement(touchElementIdRef.current);
        const currentDropTargetId = touchDropTargetIdRef.current;

        if (sourceEl && currentDropTargetId) {
          const targetEl = composer.elements.getElement(currentDropTargetId);
          const page = composer.elements.getActivePage();
          const rootId = page?.root?.id;

          if (
            targetEl &&
            currentDropTargetId !== touchElementIdRef.current &&
            currentDropTargetId !== rootId
          ) {
            // Check not moving to descendant
            const descendants = sourceEl.getDescendants?.() || [];
            const descendantIds = new Set(descendants.map((d: GrapesElement) => d.getId()));

            if (!descendantIds.has(currentDropTargetId)) {
              const targetParent = targetEl.getParent?.();
              if (targetParent) {
                const targetParentId = targetParent.getId();

                // Check parent is not source or descendant
                if (
                  targetParentId === touchElementIdRef.current ||
                  descendantIds.has(targetParentId)
                ) {
                  showInvalidDropFeedback(currentDropTargetId);
                } else {
                  // Validate nesting rules
                  const sourceType = sourceEl.getType?.() as ElementType;
                  const parentType = targetParent.getType?.() as ElementType;

                  if (!canNestElement(sourceType, parentType)) {
                    showInvalidDropFeedback(currentDropTargetId);
                  } else {
                    // Perform the move
                    const siblings = targetParent.getChildren?.() || [];
                    const targetIndex = siblings.findIndex(
                      (s: GrapesElement) => s.getId() === currentDropTargetId
                    );

                    composer.beginTransaction("touch-move-element");
                    try {
                      composer.elements.moveElement(
                        touchElementIdRef.current!,
                        targetParentId,
                        targetIndex >= 0 ? targetIndex + 1 : undefined
                      );
                      composer.endTransaction();

                      // Force re-emit selection
                      setTimeout(() => composer.selection.reselect(), 0);
                    } catch {
                      composer.rollbackTransaction();
                    }
                  }
                }
              }
            }
          }
        }

        resetTouchState();
      }
    },
    [composer, resetTouchState]
  );

  /**
   * Show visual feedback for invalid drop
   */
  const showInvalidDropFeedback = React.useCallback(
    (targetId: string) => {
      const targetDomEl = canvasRef.current?.querySelector(
        `[data-aqb-id="${targetId}"]`
      ) as HTMLElement | null;
      if (targetDomEl) {
        targetDomEl.setAttribute("data-drop-invalid", "true");
        targetDomEl.classList.add("aqb-invalid-drop-shake");
        setTimeout(() => {
          targetDomEl.removeAttribute("data-drop-invalid");
          targetDomEl.classList.remove("aqb-invalid-drop-shake");
        }, 500);
      }
    },
    [canvasRef]
  );

  /**
   * Handle touch cancel
   */
  const handleTouchCancel = React.useCallback(
    (_e: TouchEvent) => {
      if (touchStateRef.current) {
        cancelLongPressDetection(touchStateRef.current);
        touchStateRef.current = null;
      }

      if (touchDraggingRef.current) {
        resetTouchState();
      }
    },
    [resetTouchState]
  );

  return {
    isTouchDragging: touchDraggingRef.current,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel,
    },
    resetTouchState,
  };
}

export default useTouchDrag;
