/**
 * useSectionReorder
 * Tracks section boundaries on the canvas and manages drag-to-reorder
 * for top-level sections (direct children of the page root).
 *
 * @license BSD-3-Clause
 */

import { canvasScale } from "../utils/canvasScale";
import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SectionBoundary {
  /** ID of the section below this boundary */
  sectionId: string;
  /** Section index within the root's children */
  index: number;
  /** Bounding rect relative to the canvas */
  rect: { top: number; left: number; width: number };
}

export interface SectionDragState {
  /** ID of the section being dragged */
  sectionId: string;
  /** Original index */
  fromIndex: number;
  /** Current target index (where the drop line shows) */
  toIndex: number;
}

export interface UseSectionReorderOptions {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  enabled?: boolean;
  /** Board 5940:148012: a finished move says so — "Moved down" + Undo. */
  addToast?: (toast: { description: string; action?: { label: string; onClick: () => void } }) => void;
}

export interface UseSectionReorderResult {
  /** Section boundaries for rendering grab handles */
  boundaries: SectionBoundary[];
  /** Current drag state, null when not dragging */
  dragState: SectionDragState | null;
  /** Hovered boundary section ID */
  hoveredBoundary: string | null;
  /** Start dragging a section */
  startDrag: (sectionId: string, fromIndex: number) => void;
  /** Update target index during drag */
  updateDrag: (clientY: number) => void;
  /** Complete the drag and move the section */
  completeDrag: () => void;
  /** Cancel the drag */
  cancelDrag: () => void;
  /** Set the hovered boundary */
  setHoveredBoundary: (id: string | null) => void;
}

const sameBoundaries = (a: SectionBoundary[], b: SectionBoundary[]) =>
  a.length === b.length &&
  a.every(
    (x, i) =>
      x.sectionId === b[i].sectionId &&
      x.index === b[i].index &&
      x.rect.top === b[i].rect.top &&
      x.rect.left === b[i].rect.left &&
      x.rect.width === b[i].rect.width
  );

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useSectionReorder({
  composer,
  canvasRef,
  enabled = true,
  addToast,
}: UseSectionReorderOptions): UseSectionReorderResult {
  /* Held in a ref: the toast function is not a reason to rebuild the drag
     callbacks (their identity feeds the canvas overlay's effects). */
  const addToastRef = React.useRef(addToast);
  addToastRef.current = addToast;
  const [boundaries, setBoundaries] = React.useState<SectionBoundary[]>([]);
  const [dragState, setDragState] = React.useState<SectionDragState | null>(null);
  const [hoveredBoundary, setHoveredBoundary] = React.useState<string | null>(null);

  // Compute section boundaries from DOM positions of top-level sections
  const computeBoundaries = React.useCallback(() => {
    if (!composer || !canvasRef.current || !enabled) {
      setBoundaries([]);
      return;
    }

    const page = composer.elements.getActivePage();
    if (!page?.root?.id) return;

    const rootElement = composer.elements.getElement(page.root.id);
    if (!rootElement) return;

    const children = rootElement.getChildren();
    if (children.length === 0) {
      setBoundaries([]);
      return;
    }

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const zs = canvasScale(canvasRef.current);
    const newBoundaries: SectionBoundary[] = [];

    children.forEach((child, index) => {
      const id = child.getId();
      const domEl = canvasRef.current?.querySelector(`[data-buildrick-id="${id}"]`) as HTMLElement | null;
      if (!domEl) return;

      const elRect = domEl.getBoundingClientRect();
      newBoundaries.push({
        sectionId: id,
        index,
        rect: {
          top: (elRect.top - canvasRect.top) / zs,
          left: (elRect.left - canvasRect.left) / zs,
          width: elRect.width / zs,
        },
      });
    });

    setBoundaries((prev) => (sameBoundaries(prev, newBoundaries) ? prev : newBoundaries));
  }, [composer, canvasRef, enabled]);

  // Recompute on content changes
  React.useEffect(() => {
    if (!composer || !enabled) return;

    computeBoundaries();

    const handler = () => {
      // Small delay to let DOM settle after content change
      requestAnimationFrame(computeBoundaries);
    };

    composer.on(EVENTS.ELEMENT_CREATED, handler);
    composer.on(EVENTS.ELEMENT_DELETED, handler);
    composer.on(EVENTS.ELEMENT_MOVED, handler);
    composer.on(EVENTS.HISTORY_UNDO, handler);
    composer.on(EVENTS.HISTORY_REDO, handler);
    composer.on(EVENTS.CANVAS_FORCE_SYNC, handler);

    return () => {
      composer.off(EVENTS.ELEMENT_CREATED, handler);
      composer.off(EVENTS.ELEMENT_DELETED, handler);
      composer.off(EVENTS.ELEMENT_MOVED, handler);
      composer.off(EVENTS.HISTORY_UNDO, handler);
      composer.off(EVENTS.HISTORY_REDO, handler);
      composer.off(EVENTS.CANVAS_FORCE_SYNC, handler);
    };
  }, [composer, enabled, computeBoundaries]);

  /* A loaded project or a page switch renders its sections with no element
     event (the import fires before this hook subscribes, and the markup lands
     after), which left a freshly opened page with no handles at all. Watching
     the canvas markup covers every way sections appear. */
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas || typeof MutationObserver === "undefined") return;
    let frame = 0;
    const observer = new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        computeBoundaries();
      });
    });
    observer.observe(canvas, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [canvasRef, enabled, computeBoundaries]);

  // Also recompute on window resize / scroll
  React.useEffect(() => {
    if (!enabled) return;

    const handleResize = () => requestAnimationFrame(computeBoundaries);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [enabled, computeBoundaries]);

  // ── Drag operations ─────────────────────────────────────────────────────

  const startDrag = React.useCallback(
    (sectionId: string, fromIndex: number) => {
      setDragState({ sectionId, fromIndex, toIndex: fromIndex });
    },
    []
  );

  const updateDrag = React.useCallback(
    (clientY: number) => {
      if (!dragState || boundaries.length === 0 || !canvasRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const zs = canvasScale(canvasRef.current);
      const relativeY = (clientY - canvasRect.top) / zs;

      // Find the closest boundary position to determine target index
      let targetIndex = 0;
      for (let i = 0; i < boundaries.length; i++) {
        const midpoint = boundaries[i].rect.top;
        if (relativeY > midpoint) {
          targetIndex = i + 1;
        }
      }

      // Clamp to valid range
      targetIndex = Math.max(0, Math.min(targetIndex, boundaries.length));

      setDragState((prev) =>
        prev ? { ...prev, toIndex: targetIndex } : null
      );
    },
    [dragState, boundaries, canvasRef]
  );

  const completeDrag = React.useCallback(() => {
    if (!dragState || !composer) {
      setDragState(null);
      return;
    }

    const { sectionId, fromIndex, toIndex } = dragState;

    // Only move if target is different
    if (fromIndex !== toIndex && fromIndex !== toIndex - 1) {
      const page = composer.elements.getActivePage();
      if (!page?.root?.id) {
        setDragState(null);
        return;
      }

      // toIndex is a slot in the pre-move list; moveElement itself shifts a
      // same-parent downward move by one, so it takes the slot unadjusted.
      composer.beginTransaction("reorder-section");
      try {
        const moved = composer.elements.moveElement(sectionId, page.root.id, toIndex);
        composer.endTransaction();
        if (moved) {
          /* Board 5940:148012: the moved section stays selected. The pointer
             is released over a different section, and the click that follows
             would select that one instead — swallow it. */
          const swallowClick = (e: MouseEvent) => e.stopPropagation();
          window.addEventListener("click", swallowClick, { capture: true, once: true });
          setTimeout(() => window.removeEventListener("click", swallowClick, true), 0);
          const movedEl = composer.elements.getElement(sectionId);
          if (movedEl) composer.selection.select(movedEl);
        }
        if (moved) addToastRef.current?.({
          description: toIndex > fromIndex ? "Moved down" : "Moved up",
          action: { label: "Undo", onClick: () => composer.history.undo() },
        });
      } catch {
        composer.rollbackTransaction();
      }
    }

    setDragState(null);

    // Recompute boundaries after move
    requestAnimationFrame(computeBoundaries);
  }, [dragState, composer, computeBoundaries]);

  const cancelDrag = React.useCallback(() => {
    setDragState(null);
  }, []);

  return {
    boundaries,
    dragState,
    hoveredBoundary,
    startDrag,
    updateDrag,
    completeDrag,
    cancelDrag,
    setHoveredBoundary,
  };
}
