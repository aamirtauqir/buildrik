/**
 * Canvas Constants
 * Centralized constants for canvas operations
 *
 * @module engine/canvas/constants
 * @license BSD-3-Clause
 */

// ============================================
// Snapping
// ============================================

/** Snap threshold in pixels - elements snap when within this distance */
export const SNAP_THRESHOLD = 5;

/** Default grid size for snap-to-grid */
export const GRID_SIZE = 10;

// ============================================
// Handles & UI
// ============================================

/** Size of resize handles in pixels */
export const HANDLE_SIZE = 8;

/** Size of selection box handles (slightly larger for visibility) */
export const SELECTION_HANDLE_SIZE = 12;

/** Rotation handle offset from element */
export const ROTATION_HANDLE_OFFSET = 24;

// ============================================
// Constraints
// ============================================

/** Minimum element size in pixels */
export const MIN_ELEMENT_SIZE = 10;

/** Maximum element size in pixels */
export const MAX_ELEMENT_SIZE = 10000;

// ============================================
// Default Configurations
// ============================================

/** Default size constraints */
export const DEFAULT_SIZE_CONSTRAINTS = {
  minWidth: MIN_ELEMENT_SIZE,
  minHeight: MIN_ELEMENT_SIZE,
  maxWidth: MAX_ELEMENT_SIZE,
  maxHeight: MAX_ELEMENT_SIZE,
  aspectRatio: undefined,
  snapToGrid: false,
  gridSize: GRID_SIZE,
} as const;

// ============================================
// Rulers & Guides
// ============================================

/** Ruler size in pixels (width for vertical, height for horizontal) */
export const RULER_SIZE = 20;

/** Major tick interval in pixels (shows number labels) */
export const MAJOR_TICK_INTERVAL = 100;

/** Minor tick interval in pixels */
export const MINOR_TICK_INTERVAL = 10;

/** Ruler color configuration */
export const RULER_COLORS = {
  /** Ruler background */
  BACKGROUND: "#f8f8f8",
  /** Tick mark color */
  TICK: "#888",
  /** Number label color */
  TEXT: "#666",
  /** Guide line color */
  GUIDE_LINE: "rgba(137,180,250,0.8)",
  /** Guide being dragged */
  GUIDE_DRAG: "var(--bd-accent)",
} as const;
