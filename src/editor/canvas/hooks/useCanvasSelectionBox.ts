/**
 * Canvas Selection Box Hook
 * Implements Figma-style rectangle selection (marquee selection)
 *
 * Click and drag on empty canvas area to draw a selection rectangle.
 * All elements intersecting with the rectangle will be selected.
 *
 * Features:
 * - Click+drag on empty canvas to start selection
 * - Visual selection rectangle with animated border
 * - Shift+click to add to existing selection
 * - Elements fully or partially inside are selected
 * - Escape to cancel selection
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";

export interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface UseCanvasSelectionBoxOptions {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLDivElement>;
  enabled?: boolean;
  onSelectionChange?: (elementIds: string[]) => void;
}

export interface UseCanvasSelectionBoxReturn {
  selectionRect: SelectionRect | null;
  isSelecting: boolean;
}

export function useCanvasSelectionBox({
  composer,
  canvasRef,
  enabled = true,
  onSelectionChange,
}: UseCanvasSelectionBoxOptions): UseCanvasSelectionBoxReturn {
  const [selectionRect, setSelectionRect] = React.useState<SelectionRect | null>(null);
  const [isSelecting, setIsSelecting] = React.useState(false);

  // Refs for tracking state in event handlers
  const isSelectingRef = React.useRef(false);
  const startPointRef = React.useRef<{ x: number; y: number } | null>(null);
  const addToSelectionRef = React.useRef(false);

  // Ref for callback to avoid recreating event handlers on callback changes
  const onSelectionChangeRef = React.useRef(onSelectionChange);
  React.useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !composer || !enabled) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only handle left click
      if (e.button !== 0) return;

      // Check if clicking on an element (not empty canvas)
      const target = e.target as HTMLElement;
      const clickedElement = target.closest("[data-aqb-id]") as HTMLElement | null;

      // Only start selection box if clicking on empty canvas or root
      const rootId = composer.elements.getActivePage()?.root?.id;
      const clickedId = clickedElement?.getAttribute("data-aqb-id");

      if (clickedElement && clickedId !== rootId) {
        // Clicked on an element, don't start selection box
        return;
      }

      // Start selection box
      const canvasRect = canvas.getBoundingClientRect();
      const startX = e.clientX - canvasRect.left + canvas.scrollLeft;
      const startY = e.clientY - canvasRect.top + canvas.scrollTop;

      startPointRef.current = { x: startX, y: startY };
      addToSelectionRef.current = e.shiftKey;
      isSelectingRef.current = true;
      setIsSelecting(true);

      setSelectionRect({
        startX,
        startY,
        endX: startX,
        endY: startY,
      });

      // Prevent text selection during drag
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelectingRef.current || !startPointRef.current) return;

      const canvasRect = canvas.getBoundingClientRect();
      const currentX = e.clientX - canvasRect.left + canvas.scrollLeft;
      const currentY = e.clientY - canvasRect.top + canvas.scrollTop;

      setSelectionRect({
        startX: startPointRef.current.x,
        startY: startPointRef.current.y,
        endX: currentX,
        endY: currentY,
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isSelectingRef.current || !startPointRef.current) return;

      const canvasRect = canvas.getBoundingClientRect();
      const endX = e.clientX - canvasRect.left + canvas.scrollLeft;
      const endY = e.clientY - canvasRect.top + canvas.scrollTop;

      // Calculate normalized rectangle (handle negative dimensions)
      const rect = {
        left: Math.min(startPointRef.current.x, endX),
        top: Math.min(startPointRef.current.y, endY),
        right: Math.max(startPointRef.current.x, endX),
        bottom: Math.max(startPointRef.current.y, endY),
      };

      // Only select if rectangle has meaningful size
      const MIN_SIZE = 5;
      if (rect.right - rect.left > MIN_SIZE && rect.bottom - rect.top > MIN_SIZE) {
        // Find all elements intersecting with selection rect
        const selectedIds = findElementsInRect(canvas, rect, composer);

        if (selectedIds.length > 0) {
          if (addToSelectionRef.current) {
            // Add to existing selection
            const existingIds = composer.selection.getSelectedIds();
            const newIds = [...new Set([...existingIds, ...selectedIds])];
            composer.selection.selectMultiple(
              newIds
                .map((id) => {
                  const el = composer.elements.getElement(id);
                  return el!;
                })
                .filter(Boolean)
            );
          } else {
            // Replace selection
            composer.selection.selectMultiple(
              selectedIds
                .map((id) => {
                  const el = composer.elements.getElement(id);
                  return el!;
                })
                .filter(Boolean)
            );
          }

          onSelectionChangeRef.current?.(selectedIds);
        }
      }

      // Reset state
      isSelectingRef.current = false;
      startPointRef.current = null;
      addToSelectionRef.current = false;
      setIsSelecting(false);
      setSelectionRect(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to cancel selection
      if (e.key === "Escape" && isSelectingRef.current) {
        isSelectingRef.current = false;
        startPointRef.current = null;
        setIsSelecting(false);
        setSelectionRect(null);
      }
    };

    // Attach event listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [composer, canvasRef, enabled]); // Removed onSelectionChange - using ref instead

  return {
    selectionRect,
    isSelecting,
  };
}

/**
 * Find all elements that intersect with the selection rectangle
 */
function findElementsInRect(
  canvas: HTMLElement,
  rect: { left: number; top: number; right: number; bottom: number },
  composer: Composer
): string[] {
  const selectedIds: string[] = [];
  const rootId = composer.elements.getActivePage()?.root?.id;

  // Query all elements with data-aqb-id
  const elements = canvas.querySelectorAll("[data-aqb-id]");

  elements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const elementId = htmlEl.getAttribute("data-aqb-id");

    // Skip root element
    if (!elementId || elementId === rootId) return;

    // Get element bounds relative to canvas
    const elementRect = htmlEl.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    const elBounds = {
      left: elementRect.left - canvasRect.left + canvas.scrollLeft,
      top: elementRect.top - canvasRect.top + canvas.scrollTop,
      right: elementRect.right - canvasRect.left + canvas.scrollLeft,
      bottom: elementRect.bottom - canvasRect.top + canvas.scrollTop,
    };

    // Check intersection (element overlaps with selection rect)
    const intersects =
      elBounds.left < rect.right &&
      elBounds.right > rect.left &&
      elBounds.top < rect.bottom &&
      elBounds.bottom > rect.top;

    if (intersects) {
      selectedIds.push(elementId);
    }
  });

  return selectedIds;
}
