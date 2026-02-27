/**
 * useSelectionRect Hook
 * Tracks and updates selection bounding box for single or multiple elements
 * Uses ResizeObserver and MutationObserver for efficient updates
 * @license BSD-3-Clause
 */

import * as React from "react";

/** Selection rectangle in canvas coordinates */
export interface SelectionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface UseSelectionRectOptions {
  /** Element IDs to track */
  elementIds: string[];
  /** Whether multiple elements are selected */
  isMultiSelect: boolean;
  /** Canvas selector (default: ".aqb-canvas") */
  canvasSelector?: string;
}

/**
 * Hook to track selection bounding rectangle
 * Efficiently observes size and style changes using observers
 */
export function useSelectionRect({
  elementIds,
  isMultiSelect,
  canvasSelector = ".aqb-canvas",
}: UseSelectionRectOptions): SelectionRect | null {
  const [rect, setRect] = React.useState<SelectionRect | null>(null);

  React.useEffect(() => {
    if (elementIds.length === 0) {
      setRect(null);
      return;
    }

    const updateRect = () => {
      const canvas = document.querySelector(canvasSelector) as HTMLElement;
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const scrollLeft = canvas.scrollLeft || 0;
      const scrollTop = canvas.scrollTop || 0;

      if (isMultiSelect) {
        // Calculate combined bounding box for multi-select
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        elementIds.forEach((id) => {
          const element = document.querySelector(`[data-aqb-id="${id}"]`) as HTMLElement;
          if (element) {
            const elRect = element.getBoundingClientRect();
            minX = Math.min(minX, elRect.left - canvasRect.left + scrollLeft);
            minY = Math.min(minY, elRect.top - canvasRect.top + scrollTop);
            maxX = Math.max(maxX, elRect.right - canvasRect.left + scrollLeft);
            maxY = Math.max(maxY, elRect.bottom - canvasRect.top + scrollTop);
          }
        });

        if (minX !== Infinity) {
          setRect({
            left: minX,
            top: minY,
            width: maxX - minX,
            height: maxY - minY,
          });
        }
      } else {
        // Single element selection
        const element = document.querySelector(`[data-aqb-id="${elementIds[0]}"]`) as HTMLElement;

        if (element) {
          const elementRect = element.getBoundingClientRect();
          setRect({
            left: elementRect.left - canvasRect.left + scrollLeft,
            top: elementRect.top - canvasRect.top + scrollTop,
            width: elementRect.width,
            height: elementRect.height,
          });
        }
      }
    };

    updateRect();

    // ResizeObserver for efficient size change detection
    const resizeObserver = new ResizeObserver(() => {
      updateRect();
    });

    // Observe the canvas for overall layout changes
    const canvas = document.querySelector(canvasSelector) as HTMLElement;
    if (canvas) {
      resizeObserver.observe(canvas);
    }

    // Observe all selected elements for size changes
    elementIds.forEach((id) => {
      const element = document.querySelector(`[data-aqb-id="${id}"]`);
      if (element) {
        resizeObserver.observe(element);
      }
    });

    // MutationObserver for attribute/style changes
    const mutationObserver = new MutationObserver((mutations) => {
      const shouldUpdate = mutations.some(
        (m) =>
          m.type === "attributes" && (m.attributeName === "style" || m.attributeName === "class")
      );
      if (shouldUpdate) {
        updateRect();
      }
    });

    // Observe selected elements for style changes
    elementIds.forEach((id) => {
      const element = document.querySelector(`[data-aqb-id="${id}"]`);
      if (element) {
        mutationObserver.observe(element, {
          attributes: true,
          attributeFilter: ["style", "class"],
        });
      }
    });

    // Scroll and window resize listeners - passive for scroll performance
    window.addEventListener("scroll", updateRect, { capture: true, passive: true });
    window.addEventListener("resize", updateRect, { passive: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", updateRect, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", updateRect);
    };
  }, [elementIds.join(","), isMultiSelect, canvasSelector]);

  return rect;
}

export default useSelectionRect;
