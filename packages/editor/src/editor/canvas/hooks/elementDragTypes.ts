/**
 * Element Drag Types & Constants
 * Shared types for the useCanvasElementDrag decomposition
 *
 * @module components/Canvas/hooks/elementDragTypes
 * @license BSD-3-Clause
 */

import type { SnapLine } from "./useCanvasSnapping";

/** Drag modifiers state */
export interface DragModifiers {
  alt: boolean; // Clone mode
  shift: boolean; // Constrain axis
  ctrl: boolean; // Snap to grid
}

/** Axis constraint for shift+drag */
export type AxisConstraint = "none" | "horizontal" | "vertical";

/** Auto-scroll configuration */
export const AUTO_SCROLL_CONFIG = {
  EDGE_THRESHOLD: 60, // Pixels from edge to trigger scroll
  MAX_SPEED: 20, // Maximum scroll speed
  MIN_SPEED: 2, // Minimum scroll speed
  INTERVAL: 16, // ~60fps
} as const;

/** Drag throttle interval in milliseconds */
export const DRAG_THROTTLE_MS = 50;

/** SnapLine type re-export for convenience */
export type { SnapLine };
