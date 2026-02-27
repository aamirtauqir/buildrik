/**
 * Drag Auto-Scroll Hook
 * Manages automatic scrolling during drag operations
 *
 * @module components/Canvas/hooks/useDragAutoScroll
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  startAutoScroll,
  stopAutoScroll,
  getScrollableParent,
} from "../../../shared/utils/dragDrop";

// =============================================================================
// CONSTANTS
// =============================================================================

const EDGE_SCROLL_THRESHOLD = 50;
const MAX_AUTO_SCROLL_SPEED = 15;
const AUTO_SCROLL_ACCELERATION = 1.2;

// =============================================================================
// TYPES
// =============================================================================

export interface UseDragAutoScrollOptions {
  canvasRef: React.RefObject<HTMLDivElement>;
}

export interface UseDragAutoScrollResult {
  /** Start auto-scroll based on cursor position */
  handleAutoScroll: (clientX: number, clientY: number) => void;
  /** Stop current auto-scroll */
  stopCurrentAutoScroll: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook to manage auto-scrolling during drag operations
 * Uses RAF-based scrolling for smooth performance
 */
export function useDragAutoScroll({
  canvasRef,
}: UseDragAutoScrollOptions): UseDragAutoScrollResult {
  const autoScrollTimerRef = React.useRef<number | null>(null);

  /**
   * Handle auto-scroll based on cursor position near canvas edges
   */
  const handleAutoScroll = React.useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const scrollContainer = getScrollableParent(canvasRef.current) || canvasRef.current;

      // Stop any existing auto-scroll before potentially starting a new one
      if (autoScrollTimerRef.current !== null) {
        stopAutoScroll(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }

      // Determine scroll direction based on cursor position
      const distFromTop = clientY - rect.top;
      const distFromBottom = rect.bottom - clientY;
      const distFromLeft = clientX - rect.left;
      const distFromRight = rect.right - clientX;

      let scrollX = 0;
      let scrollY = 0;

      if (distFromTop < EDGE_SCROLL_THRESHOLD) {
        scrollY = -Math.max(1, (EDGE_SCROLL_THRESHOLD - distFromTop) / 5);
      } else if (distFromBottom < EDGE_SCROLL_THRESHOLD) {
        scrollY = Math.max(1, (EDGE_SCROLL_THRESHOLD - distFromBottom) / 5);
      }

      if (distFromLeft < EDGE_SCROLL_THRESHOLD) {
        scrollX = -Math.max(1, (EDGE_SCROLL_THRESHOLD - distFromLeft) / 5);
      } else if (distFromRight < EDGE_SCROLL_THRESHOLD) {
        scrollX = Math.max(1, (EDGE_SCROLL_THRESHOLD - distFromRight) / 5);
      }

      if (scrollX !== 0 || scrollY !== 0) {
        autoScrollTimerRef.current = startAutoScroll(
          { x: clientX, y: clientY },
          {
            container: scrollContainer,
            threshold: EDGE_SCROLL_THRESHOLD,
            maxSpeed: MAX_AUTO_SCROLL_SPEED,
            acceleration: AUTO_SCROLL_ACCELERATION,
          }
        );
      }
    },
    [canvasRef]
  );

  /**
   * Stop current auto-scroll animation
   */
  const stopCurrentAutoScroll = React.useCallback(() => {
    if (autoScrollTimerRef.current !== null) {
      stopAutoScroll(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCurrentAutoScroll();
    };
  }, [stopCurrentAutoScroll]);

  return {
    handleAutoScroll,
    stopCurrentAutoScroll,
  };
}
