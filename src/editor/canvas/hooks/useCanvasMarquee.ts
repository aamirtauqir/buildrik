/**
 * Canvas Marquee Selection Hook
 * Handles marquee (lasso) selection for multi-selecting elements
 *
 * @module components/Canvas/hooks/useCanvasMarquee
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { Element } from "../../../engine/elements/Element";

/** Minimum drag distance (px) in X or Y before a marquee is confirmed and selection is cleared */
const MARQUEE_MIN_DRAG = 5;

export interface MarqueeState {
  start: { x: number; y: number };
  current: { x: number; y: number };
}

export interface UseCanvasMarqueeOptions {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLDivElement>;
  isEditing: boolean;
  isDragOver: boolean;
  draggingElementId: string | null;
  clear: () => void;
}

export interface UseCanvasMarqueeResult {
  marquee: MarqueeState | null;
  handleMarqueeStart: (e: React.MouseEvent) => void;
  handleMarqueeMove: (e: React.MouseEvent) => void;
  handleMarqueeEnd: () => void;
}

/**
 * Hook to handle marquee (lasso) selection on the canvas
 */
export function useCanvasMarquee({
  composer,
  canvasRef,
  isEditing,
  isDragOver,
  draggingElementId,
  clear,
}: UseCanvasMarqueeOptions): UseCanvasMarqueeResult {
  const [marquee, setMarquee] = React.useState<MarqueeState | null>(null);
  const marqueeStartRef = React.useRef<{ x: number; y: number } | null>(null);
  /** Tracks whether clear() has already been called for the current marquee gesture */
  const hasClearedRef = React.useRef(false);

  // Start marquee selection
  const handleMarqueeStart = React.useCallback(
    (e: React.MouseEvent) => {
      // Only start marquee if clicking on empty canvas (not on an element or toolbar)
      const target = e.target as HTMLElement;
      const clickedElement = target.closest("[data-aqb-id]") as HTMLElement | null;
      const clickedToolbar = target.closest(
        ".aqb-quick-actions, .aqb-unified-toolbar, .aqb-selection-label, .aqb-canvas-breadcrumb, .aqb-alignment-toolbar, .aqb-context-menu"
      ) as HTMLElement | null;

      // If clicking on an element or toolbar, don't start marquee
      if (clickedElement || clickedToolbar) return;

      // Don't start marquee if we're editing or dragging
      if (isEditing || isDragOver || draggingElementId) return;

      const canvasEl = canvasRef.current;
      if (!canvasEl) return;

      const rect = canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      marqueeStartRef.current = { x, y };
      hasClearedRef.current = false;
      setMarquee({ start: { x, y }, current: { x, y } });
    },
    [isEditing, isDragOver, draggingElementId, canvasRef]
  );

  // Update marquee during mouse move
  const handleMarqueeMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!marqueeStartRef.current) return;

      const canvasEl = canvasRef.current;
      if (!canvasEl) return;

      const rect = canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Defer clear() until the drag exceeds the minimum threshold — prevents
      // accidental deselection on unintentional micro-drags (mousedown + immediate mouseup).
      if (!hasClearedRef.current) {
        const dx = Math.abs(x - marqueeStartRef.current.x);
        const dy = Math.abs(y - marqueeStartRef.current.y);
        if (dx >= MARQUEE_MIN_DRAG || dy >= MARQUEE_MIN_DRAG) {
          clear();
          hasClearedRef.current = true;
        }
      }

      setMarquee({
        start: marqueeStartRef.current,
        current: { x, y },
      });
    },
    [canvasRef, clear]
  );

  // End marquee and select intersecting elements
  const handleMarqueeEnd = React.useCallback(() => {
    if (!marquee || !composer) {
      marqueeStartRef.current = null;
      setMarquee(null);
      return;
    }

    // Calculate marquee bounds
    const minX = Math.min(marquee.start.x, marquee.current.x);
    const maxX = Math.max(marquee.start.x, marquee.current.x);
    const minY = Math.min(marquee.start.y, marquee.current.y);
    const maxY = Math.max(marquee.start.y, marquee.current.y);

    // Only proceed if marquee has some size (not just a click)
    const marqueeWidth = maxX - minX;
    const marqueeHeight = maxY - minY;

    if (marqueeWidth > 5 && marqueeHeight > 5) {
      // Find all elements that intersect with the marquee
      const page = composer.elements.getActivePage();
      if (page && page.root) {
        const elementsToSelect: Element[] = [];
        const rootElement = composer.elements.getElement(page.root.id);
        if (!rootElement) {
          marqueeStartRef.current = null;
          setMarquee(null);
          return;
        }

        const checkElement = (element: Element) => {
          const id = element.getId();
          if (id === page.root?.id) return; // Skip root

          const domEl = canvasRef.current?.querySelector(
            `[data-aqb-id="${id}"]`
          ) as HTMLElement | null;

          if (domEl) {
            const canvasRect = canvasRef.current!.getBoundingClientRect();
            const elRect = domEl.getBoundingClientRect();

            // Element bounds relative to canvas
            const elX = elRect.left - canvasRect.left;
            const elY = elRect.top - canvasRect.top;
            const elRight = elX + elRect.width;
            const elBottom = elY + elRect.height;

            // Check if element intersects with marquee
            const intersects = !(elRight < minX || elX > maxX || elBottom < minY || elY > maxY);

            if (intersects) {
              elementsToSelect.push(element);
            }
          }

          // Check children
          element.getChildren?.()?.forEach(checkElement);
        };

        rootElement.getChildren?.()?.forEach(checkElement);

        // Select all intersecting elements
        if (elementsToSelect.length > 0) {
          composer.selection.selectMultiple(elementsToSelect);
        }
      }
    }

    marqueeStartRef.current = null;
    hasClearedRef.current = false;
    setMarquee(null);
  }, [marquee, composer, canvasRef]);

  return {
    marquee,
    handleMarqueeStart,
    handleMarqueeMove,
    handleMarqueeEnd,
  };
}
