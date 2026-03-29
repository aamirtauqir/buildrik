/**
 * useToolbarPosition Hook
 * Calculates optimal toolbar positioning relative to an element
 * Builds on useElementRect to avoid duplication and ensure consistent behavior
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useElementRect } from "./useElementRect";

/** Where to position the toolbar relative to the element */
export type ToolbarPlacement = "above" | "below" | "auto";

export interface ToolbarPosition {
  left: number;
  top: number;
  /** The element width (useful for centering) */
  elementWidth: number;
  /** Whether toolbar flipped due to viewport constraints */
  flipped: boolean;
}

export interface UseToolbarPositionOptions {
  /** Placement preference (default: "above") */
  placement?: ToolbarPlacement;
  /** Vertical offset from element edge (default: 8) */
  offsetY?: number;
  /** Minimum distance from viewport edges (default: 8) */
  viewportPadding?: number;
  /** Height of the toolbar for flip calculations (default: 36) */
  toolbarHeight?: number;
}

const DEFAULT_OPTIONS: Required<UseToolbarPositionOptions> = {
  placement: "above",
  offsetY: 8,
  viewportPadding: 8,
  toolbarHeight: 36,
};

/**
 * Hook to calculate optimal toolbar position relative to an element
 * Automatically handles:
 * - Scroll and resize tracking (via useElementRect)
 * - Viewport edge clamping
 * - Auto-flip when element is too close to edge
 *
 * @param elementId - The data-aqb-id of the target element
 * @param canvasRef - Reference to the canvas container
 * @param options - Position customization options
 * @returns Calculated position or null if element not found
 */
export function useToolbarPosition(
  elementId: string | null,
  canvasRef: React.RefObject<HTMLElement>,
  options: UseToolbarPositionOptions = {}
): ToolbarPosition | null {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Use the shared useElementRect hook for efficient position tracking
  const rect = useElementRect(elementId, canvasRef, {
    trackScroll: true,
    trackResize: true,
  });

  // Calculate final toolbar position
  const position = React.useMemo(() => {
    if (!rect) return null;

    const { placement, offsetY, viewportPadding, toolbarHeight } = opts;

    let top: number;
    let flipped = false;

    // Calculate initial position based on placement
    if (placement === "below") {
      top = rect.top + rect.height + offsetY;
    } else if (placement === "above") {
      top = rect.top - toolbarHeight - offsetY;
    } else {
      // "auto" - prefer above, but flip if not enough space
      top = rect.top - toolbarHeight - offsetY;
      if (top < viewportPadding) {
        top = rect.top + rect.height + offsetY;
        flipped = true;
      }
    }

    // Clamp to viewport
    if (top < viewportPadding) {
      top = rect.top + rect.height + offsetY;
      flipped = placement === "above";
    }

    let left = rect.left;
    if (left < viewportPadding) {
      left = viewportPadding;
    }

    return {
      left,
      top,
      elementWidth: rect.width,
      flipped,
    };
  }, [rect, opts.placement, opts.offsetY, opts.viewportPadding, opts.toolbarHeight]);

  return position;
}

/**
 * Convenience hook for toolbar positioned above element (most common case)
 */
export function useToolbarPositionAbove(
  elementId: string | null,
  canvasRef: React.RefObject<HTMLElement>,
  offsetY = 8
): ToolbarPosition | null {
  return useToolbarPosition(elementId, canvasRef, {
    placement: "above",
    offsetY,
  });
}

/**
 * Convenience hook for toolbar positioned below element
 */
export function useToolbarPositionBelow(
  elementId: string | null,
  canvasRef: React.RefObject<HTMLElement>,
  offsetY = 8
): ToolbarPosition | null {
  return useToolbarPosition(elementId, canvasRef, {
    placement: "below",
    offsetY,
  });
}

export default useToolbarPosition;
