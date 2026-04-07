/**
 * useLayerDrag - Manages HTML5 drag-and-drop state for layer reordering.
 *
 * Responsibilities:
 * - Track draggedId, targetId, and drop position (before/after/inside)
 * - Calculate drop position from cursor Y relative to row height
 * - Expose drag event handlers for LayerTreeItem rows
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import type { DragState } from "../types";

export interface UseLayerDragReturn {
  dragState: DragState;
  setDragState: React.Dispatch<React.SetStateAction<DragState>>;
}

export function useLayerDrag(_composer: Composer | null): UseLayerDragReturn {
  const [dragState, setDragState] = React.useState<DragState>({
    draggedId: null,
    targetId: null,
    position: null,
  });

  return {
    dragState,
    setDragState,
  };
}
