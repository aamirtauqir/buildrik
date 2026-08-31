/**
 * Element Drag Auto-Scroll Hook
 * Manages auto-scrolling when dragging near canvas edges during element drag
 *
 * Extracted from useCanvasElementDrag.ts for file size compliance.
 * This is distinct from useDragAutoScroll.ts (which handles external panel drags).
 *
 * @module components/Canvas/hooks/useElementDragAutoScroll
 * @license BSD-3-Clause
 */

import * as React from "react";
import { AUTO_SCROLL_CONFIG } from "./elementDragTypes";
import { getAxisScroller } from "@/shared/utils/dragDrop";

// =============================================================================
// TYPES
// =============================================================================

export interface UseElementDragAutoScrollOptions {
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export interface UseElementDragAutoScrollResult {
  /** Start auto-scroll based on cursor position near canvas edges */
  startAutoScroll: (clientX: number, clientY: number) => void;
  /** Stop active auto-scroll interval */
  stopAutoScroll: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook managing auto-scroll during element drag operations.
 * Scrolls the canvas when the cursor is near the edge during a drag.
 */
export function useElementDragAutoScroll({
  canvasRef,
}: UseElementDragAutoScrollOptions): UseElementDragAutoScrollResult {
  const autoScrollIntervalRef = React.useRef<number | null>(null);

  /**
   * Calculate scroll speed based on distance from edge.
   * Returns 0 if not near edge, negative for top/left, positive for bottom/right.
   */
  const calculateScrollSpeed = React.useCallback(
    (mousePos: number, edgeStart: number, edgeEnd: number): number => {
      const { EDGE_THRESHOLD, MAX_SPEED, MIN_SPEED } = AUTO_SCROLL_CONFIG;

      // Check if near top/left edge
      if (mousePos < edgeStart + EDGE_THRESHOLD) {
        const distance = edgeStart + EDGE_THRESHOLD - mousePos;
        const ratio = distance / EDGE_THRESHOLD;
        return -(MIN_SPEED + (MAX_SPEED - MIN_SPEED) * ratio);
      }

      // Check if near bottom/right edge
      if (mousePos > edgeEnd - EDGE_THRESHOLD) {
        const distance = mousePos - (edgeEnd - EDGE_THRESHOLD);
        const ratio = distance / EDGE_THRESHOLD;
        return MIN_SPEED + (MAX_SPEED - MIN_SPEED) * ratio;
      }

      return 0;
    },
    []
  );

  /**
   * Start auto-scrolling based on mouse position
   */
  const startAutoScroll = React.useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Stop any existing auto-scroll
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }

      /* Edges are the VISIBLE viewport's, not the canvas's. The desktop canvas
         carries a minWidth of the desktop breakpoint and is routinely wider
         than the column it sits in, so its own left/right edges are off screen
         — thresholds measured against them describe a trigger zone the pointer
         can never enter, and auto-scroll simply never fires. And the two axes
         scroll DIFFERENT elements: the canvas owns its vertical overflow, the
         horizontal lives on .bd-canvas-scroll. */
      const hx = getAxisScroller(canvas, "x");
      const vy = getAxisScroller(canvas, "y");
      const box = hx === canvas ? canvas.getBoundingClientRect() : hx.getBoundingClientRect();
      const vbox = vy === canvas ? canvas.getBoundingClientRect() : vy.getBoundingClientRect();
      const scrollSpeedX = calculateScrollSpeed(clientX, box.left, box.right);
      const scrollSpeedY = calculateScrollSpeed(clientY, vbox.top, vbox.bottom);

      // Only start interval if we need to scroll
      if (scrollSpeedX !== 0 || scrollSpeedY !== 0) {
        autoScrollIntervalRef.current = window.setInterval(() => {
          if (scrollSpeedX !== 0) {
            hx.scrollLeft += scrollSpeedX;
          }
          if (scrollSpeedY !== 0) {
            vy.scrollTop += scrollSpeedY;
          }
        }, AUTO_SCROLL_CONFIG.INTERVAL);
      }
    },
    [canvasRef, calculateScrollSpeed]
  );

  /**
   * Stop auto-scrolling
   */
  const stopAutoScroll = React.useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, []);

  return { startAutoScroll, stopAutoScroll };
}
