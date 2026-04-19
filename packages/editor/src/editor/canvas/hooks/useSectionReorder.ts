/**
 * useSectionReorder
 * Tracks section boundaries on the canvas and manages drag-to-reorder
 * for top-level sections (direct children of the page root).
 *
 * @license BSD-3-Clause
 */

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

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useSectionReorder({
  composer,
  canvasRef,
  enabled = true,
}: UseSectionReorderOptions): UseSectionReorderResult {
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
          top: elRect.top - canvasRect.top,
          left: elRect.left - canvasRect.left,
          width: elRect.width,
        },
      });
    });

    setBoundaries(newBoundaries);
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
      const relativeY = clientY - canvasRect.top;

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

      // Adjust index: if moving down, account for removal of the element
      const adjustedIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;

      composer.beginTransaction("reorder-section");
      try {
        composer.elements.moveElement(sectionId, page.root.id, adjustedIndex);
        composer.endTransaction();
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
