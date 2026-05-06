/**
 * useDropTargetResolver — extracted from useCanvasDragDrop (Phase D D1
 * split, stage 2). Owns the drag-over target resolution + validation +
 * visuals coordination that previously made up ~110 lines of inline
 * logic in handleDragOver.
 *
 * Behavior preserved bit-for-bit. The hook returns:
 *   - resolve(e):     the per-dragOver target-resolution body
 *   - clearAffordance(): exposed so handleDragLeave + global dragend
 *                        can wipe the lingering CSS class
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { findDropTargetElement, getElementId } from "../../../../shared/utils/dragDrop";
import {
  buildBreadcrumbPath,
  calculateDropPositionFromCursor,
  calculateDropSlotRect,
  validateDropOperation,
} from "./dragCalculations";

// Session-shape subset the resolver mutates. Match the public surface of
// useDragSession; passing the full session object keeps mocking simple.
export interface ResolverSession {
  setDropTargetId: (id: string | null) => void;
  setDropPosition: (pos: any) => void;
  setIsValidDrop: (v: boolean) => void;
  setInvalidDropReason: (r: any) => void;
  setDropSlotRect: (r: any) => void;
  setDropTargetPath: (p: any[]) => void;
}

// Visuals subset the resolver calls.
export interface ResolverVisuals {
  showDropTarget: (el: HTMLElement, position: any) => void;
  showInvalidTarget: (el: HTMLElement) => void;
  clearDropTarget: () => void;
  clearInvalidTarget: () => void;
}

export interface UseDropTargetResolverOptions {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  session: ResolverSession;
  visuals: ResolverVisuals;
  draggingElementId: string | null;
}

export interface UseDropTargetResolverResult {
  /** Resolve target + position + validation for this dragOver event. */
  resolve: (e: React.DragEvent) => void;
  /** Wipe the lingering `.bd-drop-target--active` class. */
  clearAffordance: () => void;
}

export function useDropTargetResolver({
  composer,
  canvasRef,
  session,
  visuals,
  draggingElementId,
}: UseDropTargetResolverOptions): UseDropTargetResolverResult {
  // Track the currently highlighted drop-affordance element so we can
  // remove the `.bd-drop-target--active` class when the target
  // changes or drag ends.
  const dropAffordanceElRef = React.useRef<HTMLElement | null>(null);

  const applyDropAffordance = React.useCallback((el: HTMLElement | null) => {
    if (dropAffordanceElRef.current === el) return;
    if (dropAffordanceElRef.current) {
      dropAffordanceElRef.current.classList.remove("bd-drop-target--active");
    }
    if (el) {
      el.classList.add("bd-drop-target--active");
    }
    dropAffordanceElRef.current = el;
  }, []);

  const clearAffordance = React.useCallback(() => {
    if (dropAffordanceElRef.current) {
      dropAffordanceElRef.current.classList.remove("bd-drop-target--active");
      dropAffordanceElRef.current = null;
    }
  }, []);

  const resolve = React.useCallback(
    (e: React.DragEvent) => {
      // Find drop target
      const dropTarget = findDropTargetElement(e.clientX, e.clientY);
      let targetId = getElementId(dropTarget);

      // Fallback to root if no target
      if (!targetId && composer) {
        const page = composer.elements.getActivePage();
        if (page?.root?.id) targetId = page.root.id;
      }

      if (targetId && composer) {
        session.setDropTargetId(targetId);

        const targetEl = canvasRef.current?.querySelector(
          `[data-buildrick-id="${targetId}"]`,
        ) as HTMLElement | null;

        if (targetEl) {
          applyDropAffordance(targetEl);
          const rect = targetEl.getBoundingClientRect();
          const canvasRect = canvasRef.current?.getBoundingClientRect();

          // Both e.clientX/clientY and rect (from getBoundingClientRect) are
          // in viewport space — already scroll-invariant.
          const { position, isParentHorizontal } = calculateDropPositionFromCursor(
            e.clientX,
            e.clientY,
            rect,
            targetEl.parentElement,
          );
          session.setDropPosition(position);

          if (canvasRect) {
            const slotRect = calculateDropSlotRect({
              position,
              targetRect: rect,
              canvasRect,
              isParentHorizontal,
            });
            session.setDropSlotRect(slotRect);
          }

          visuals.showDropTarget(targetEl, position);
          visuals.clearInvalidTarget();

          const validation = validateDropOperation({
            composer,
            draggingElementId,
            targetId,
            position,
            dataTransferTypes: e.dataTransfer.types,
          });
          session.setIsValidDrop(validation.isValid);
          session.setInvalidDropReason(validation.reason);

          if (!validation.isValid) {
            visuals.showInvalidTarget(targetEl);
          }

          session.setDropTargetPath(buildBreadcrumbPath(composer, targetId));

          // Update DragManager SSOT (fires throttled DRAG_MOVE event)
          composer.drag?.move(
            { x: e.clientX, y: e.clientY },
            targetId,
            position,
            validation.isValid,
          );
        } else {
          // Target element not found in DOM
          session.setDropPosition("inside");
          session.setIsValidDrop(true);
          session.setInvalidDropReason(null);
          session.setDropSlotRect(null);
          session.setDropTargetPath([]);
          visuals.clearDropTarget();
          visuals.clearInvalidTarget();
          clearAffordance();
        }
      } else {
        session.setDropTargetId(null);
        session.setDropPosition(null);
        session.setIsValidDrop(true);
        session.setInvalidDropReason(null);
        session.setDropSlotRect(null);
        session.setDropTargetPath([]);
        visuals.clearDropTarget();
        clearAffordance();
      }
    },
    [
      composer,
      canvasRef,
      session,
      visuals,
      draggingElementId,
      applyDropAffordance,
      clearAffordance,
    ],
  );

  return { resolve, clearAffordance };
}
