/**
 * useLayerDrag - Holds HTML5 drag-and-drop STATE for layer reordering.
 * The drag/drop handlers themselves live in panels/layers/index.tsx.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { DragState } from "../types";

export interface UseLayerDragReturn {
  dragState: DragState;
  setDragState: React.Dispatch<React.SetStateAction<DragState>>;
}

export function useLayerDrag(): UseLayerDragReturn {
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
