/**
 * useElementRect Hook
 * Efficiently caches element bounding rects with RAF batching
 *
 * Performance optimizations:
 * - Uses ResizeObserver instead of polling for size changes
 * - Batches layout reads with requestAnimationFrame
 * - Caches results to prevent redundant getBoundingClientRect calls
 * - Cleans up properly on unmount
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface ElementRect {
  left: number;
  top: number;
  width: number;
  height: number;
  /** Raw DOMRect for advanced use cases */
  raw: DOMRect;
}

export interface UseElementRectOptions {
  /** Whether to update rect on scroll (default: true) */
  trackScroll?: boolean;
  /** Whether to update rect on window resize (default: true) */
  trackResize?: boolean;
  /** Throttle updates in ms during scroll (default: 16 for ~60fps) */
  scrollThrottle?: number;
}

const DEFAULT_OPTIONS: UseElementRectOptions = {
  trackScroll: true,
  trackResize: true,
  scrollThrottle: 16,
};

/**
 * Hook to efficiently track an element's bounding rect
 * Uses ResizeObserver and RAF batching to minimize layout thrashing
 *
 * @param elementId - The data-aqb-id of the element to track
 * @param canvasRef - Reference to the canvas container
 * @param options - Configuration options
 * @returns The element's rect relative to canvas, or null if not found
 */
export function useElementRect(
  elementId: string | null,
  canvasRef: React.RefObject<HTMLElement>,
  options: UseElementRectOptions = {}
): ElementRect | null {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [rect, setRect] = React.useState<ElementRect | null>(null);

  // Refs for cleanup and debouncing
  const rafIdRef = React.useRef<number | null>(null);
  const lastUpdateRef = React.useRef<number>(0);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);

  // Memoized update function to avoid recreating on each render
  const updateRect = React.useCallback(() => {
    if (!elementId || !canvasRef.current) {
      setRect(null);
      return;
    }

    const element = canvasRef.current.querySelector(
      `[data-aqb-id="${elementId}"]`
    ) as HTMLElement | null;

    if (!element) {
      setRect(null);
      return;
    }

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    // Account for canvas scroll position
    const scrollLeft = canvasRef.current.scrollLeft || 0;
    const scrollTop = canvasRef.current.scrollTop || 0;

    const newRect: ElementRect = {
      left: elementRect.left - canvasRect.left + scrollLeft,
      top: elementRect.top - canvasRect.top + scrollTop,
      width: elementRect.width,
      height: elementRect.height,
      raw: elementRect,
    };

    setRect(newRect);
  }, [elementId, canvasRef]);

  // RAF-batched update function for scroll/resize events
  const scheduleUpdate = React.useCallback(() => {
    const now = performance.now();

    // Throttle updates during rapid events
    if (now - lastUpdateRef.current < opts.scrollThrottle!) {
      return;
    }

    // Cancel any pending RAF
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    // Schedule update on next frame
    rafIdRef.current = requestAnimationFrame(() => {
      lastUpdateRef.current = performance.now();
      updateRect();
      rafIdRef.current = null;
    });
  }, [updateRect, opts.scrollThrottle]);

  // Set up observers and event listeners
  React.useEffect(() => {
    if (!elementId || !canvasRef.current) {
      setRect(null);
      return;
    }

    // Initial measurement
    updateRect();

    const canvas = canvasRef.current;
    const element = canvas.querySelector(`[data-aqb-id="${elementId}"]`) as HTMLElement | null;

    // Set up ResizeObserver for efficient size change detection
    resizeObserverRef.current = new ResizeObserver(() => {
      scheduleUpdate();
    });

    // Observe both canvas and target element
    resizeObserverRef.current.observe(canvas);
    if (element) {
      resizeObserverRef.current.observe(element);
    }

    // Scroll listener (if enabled)
    const handleScroll = opts.trackScroll ? scheduleUpdate : undefined;
    if (handleScroll) {
      window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    }

    // Resize listener (if enabled)
    const handleResize = opts.trackResize ? scheduleUpdate : undefined;
    if (handleResize) {
      window.addEventListener("resize", handleResize, { passive: true });
    }

    // Cleanup
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;

      if (handleScroll) {
        window.removeEventListener("scroll", handleScroll, { capture: true });
      }
      if (handleResize) {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, [elementId, canvasRef, updateRect, scheduleUpdate, opts.trackScroll, opts.trackResize]);

  return rect;
}

/**
 * Hook to track multiple element rects efficiently
 * Shares a single ResizeObserver for all elements
 *
 * @param elementIds - Array of data-aqb-ids to track
 * @param canvasRef - Reference to the canvas container
 * @returns Map of elementId -> rect
 */
export function useMultipleElementRects(
  elementIds: string[],
  canvasRef: React.RefObject<HTMLElement>
): Map<string, ElementRect> {
  const [rects, setRects] = React.useState<Map<string, ElementRect>>(new Map());
  const rafIdRef = React.useRef<number | null>(null);
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null);

  const updateRects = React.useCallback(() => {
    if (!canvasRef.current || elementIds.length === 0) {
      setRects(new Map());
      return;
    }

    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    const scrollLeft = canvas.scrollLeft || 0;
    const scrollTop = canvas.scrollTop || 0;

    const newRects = new Map<string, ElementRect>();

    for (const id of elementIds) {
      const element = canvas.querySelector(`[data-aqb-id="${id}"]`) as HTMLElement | null;

      if (element) {
        const elementRect = element.getBoundingClientRect();
        newRects.set(id, {
          left: elementRect.left - canvasRect.left + scrollLeft,
          top: elementRect.top - canvasRect.top + scrollTop,
          width: elementRect.width,
          height: elementRect.height,
          raw: elementRect,
        });
      }
    }

    setRects(newRects);
  }, [elementIds, canvasRef]);

  const scheduleUpdate = React.useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      updateRects();
      rafIdRef.current = null;
    });
  }, [updateRects]);

  React.useEffect(() => {
    if (!canvasRef.current || elementIds.length === 0) {
      setRects(new Map());
      return;
    }

    // Initial measurement
    updateRects();

    const canvas = canvasRef.current;

    // Set up ResizeObserver
    resizeObserverRef.current = new ResizeObserver(() => {
      scheduleUpdate();
    });

    resizeObserverRef.current.observe(canvas);

    // Observe all elements
    for (const id of elementIds) {
      const element = canvas.querySelector(`[data-aqb-id="${id}"]`);
      if (element) {
        resizeObserverRef.current.observe(element);
      }
    }

    // Scroll and resize listeners
    window.addEventListener("scroll", scheduleUpdate, { capture: true, passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      window.removeEventListener("scroll", scheduleUpdate, { capture: true });
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [elementIds.join(","), canvasRef, updateRects, scheduleUpdate]);

  return rects;
}

export default useElementRect;
