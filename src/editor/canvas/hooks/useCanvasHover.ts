/**
 * Canvas Hover Hook
 * Handles hover state for canvas elements (DevTools-style)
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine/Composer";
import { EVENTS } from "../../../shared/constants/events";
import { devLogger } from "../../../shared/utils/devLogger";

export interface UseCanvasHoverOptions {
  /** Composer instance for event listening */
  composer: Composer | null;
  /** Currently selected element ID */
  selectedId: string | null;
  /** Whether drag is in progress */
  isDragOver: boolean;
  /** ID of element being edited inline */
  editingId: string | null;
  /** ID of element being dragged */
  draggingElementId: string | null;
  /** Whether resize is in progress */
  isResizing?: boolean;
}

export interface UseCanvasHoverResult {
  /** Currently hovered element ID */
  hoveredElementId: string | null;
  /** Computed: whether hover overlay should be visible */
  shouldShowHover: boolean;
  /** Handle mouse move over canvas */
  handleCanvasMouseMove: (e: React.MouseEvent) => void;
  /** Handle mouse leave from canvas */
  handleCanvasMouseLeave: () => void;
  /** Manually clear hover state */
  clearHover: () => void;
}

/**
 * Hook for handling hover state on canvas elements
 * Shows hover overlay like browser DevTools element inspector
 */
export function useCanvasHover({
  composer,
  selectedId,
  isDragOver,
  editingId,
  draggingElementId,
  isResizing = false,
}: UseCanvasHoverOptions): UseCanvasHoverResult {
  const [hoveredElementId, setHoveredElementId] = React.useState<string | null>(null);

  // Listen for layer hover events from Layers panel
  React.useEffect(() => {
    if (!composer) return;

    const handleLayerHover = (data: { id: string | null }) => {
      // Set hover from layers panel, unless during drag/resize/edit
      if (!isDragOver && !editingId && !draggingElementId && !isResizing) {
        devLogger.hover("layer", { elementId: data.id });
        setHoveredElementId(data.id);
      }
    };

    composer.on(EVENTS.LAYER_HOVER, handleLayerHover);
    return () => {
      composer.off(EVENTS.LAYER_HOVER, handleLayerHover);
    };
  }, [composer, isDragOver, editingId, draggingElementId, isResizing]);

  // Handle mouse move for hover overlay
  const handleCanvasMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      // Don't show hover during drag, edit, resize, or element drag operations
      if (isDragOver || editingId || draggingElementId || isResizing) {
        setHoveredElementId(null);
        return;
      }

      const target = e.target as HTMLElement;
      const hoveredEl = target.closest("[data-aqb-id]") as HTMLElement | null;

      if (hoveredEl) {
        const id = hoveredEl.getAttribute("data-aqb-id");
        // Don't show hover on already selected element
        if (id && id !== selectedId) {
          devLogger.hover("enter", { elementId: id });
          setHoveredElementId(id);
        } else {
          setHoveredElementId(null);
        }
      } else {
        setHoveredElementId(null);
      }
    },
    [isDragOver, editingId, draggingElementId, selectedId, isResizing]
  );

  // Clear hover on mouse leave
  const handleCanvasMouseLeave = React.useCallback(() => {
    devLogger.hover("leave");
    setHoveredElementId(null);
  }, []);

  // Manual clear function
  const clearHover = React.useCallback(() => {
    setHoveredElementId(null);
  }, []);

  // Compute whether hover overlay should be visible
  // Single source of truth for hover visibility conditions
  const shouldShowHover = React.useMemo(() => {
    return Boolean(
      hoveredElementId && !isDragOver && !editingId && !isResizing && !draggingElementId
    );
  }, [hoveredElementId, isDragOver, editingId, isResizing, draggingElementId]);

  return {
    hoveredElementId,
    shouldShowHover,
    handleCanvasMouseMove,
    handleCanvasMouseLeave,
    clearHover,
  };
}

export default useCanvasHover;
