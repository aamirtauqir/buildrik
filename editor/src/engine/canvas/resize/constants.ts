/**
 * Resize Handler Constants
 * Default configurations and element-specific constraints
 *
 * @module engine/canvas/resize/constants
 * @license BSD-3-Clause
 */

import type { SizeConstraints, SnapConfig, HandlePosition } from "./types";

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/** Default size constraints */
export const DEFAULT_CONSTRAINTS: SizeConstraints = {
  minWidth: 10,
  minHeight: 10,
  maxWidth: 10000,
  maxHeight: 10000,
  lockAspectRatio: false,
};

/** Default snap configuration */
export const DEFAULT_SNAP_CONFIG: SnapConfig = {
  snapToGrid: false,
  gridSize: 10,
  snapToElements: true,
  snapThreshold: 5,
  snapToGuides: true,
  rotationSnapAngles: [
    0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, -15, -30, -45, -60, -75, -90, -105,
    -120, -135, -150, -165,
  ],
};

// =============================================================================
// ELEMENT-SPECIFIC CONSTRAINTS
// =============================================================================

/** Element type specific constraints */
export const ELEMENT_CONSTRAINTS: Record<string, Partial<SizeConstraints>> = {
  image: { minWidth: 20, minHeight: 20, lockAspectRatio: true },
  video: { minWidth: 100, minHeight: 60, lockAspectRatio: true },
  icon: { minWidth: 16, minHeight: 16, maxWidth: 256, maxHeight: 256, lockAspectRatio: true },
  button: { minWidth: 40, minHeight: 24 },
  input: { minWidth: 60, minHeight: 24 },
  container: { minWidth: 40, minHeight: 40 },
  text: { minWidth: 20, minHeight: 16 },
};

// =============================================================================
// HIT TESTING DEFAULTS
// =============================================================================

/** Default hit area for handles (pixels) */
export const DEFAULT_HANDLE_HIT_AREA = 14;

/** Default border hit width (pixels) */
export const DEFAULT_BORDER_HIT_WIDTH = 6;

// =============================================================================
// CURSOR MAPPINGS
// =============================================================================

/** Cursor for each handle position */
export const HANDLE_CURSORS: Record<HandlePosition, string> = {
  nw: "nwse-resize",
  n: "ns-resize",
  ne: "nesw-resize",
  e: "ew-resize",
  se: "nwse-resize",
  s: "ns-resize",
  sw: "nesw-resize",
  w: "ew-resize",
};

/** Cursor for rotation handle */
export const ROTATION_CURSOR = "grab";

// =============================================================================
// PERFORMANCE
// =============================================================================

/** Throttle interval for mouse move events (ms) */
export const MOVE_THROTTLE_MS = 16; // ~60fps

/** Rotation snap threshold in degrees */
export const ROTATION_SNAP_THRESHOLD = 5;

/** Default rotation snap angle when shift is held */
export const SHIFT_ROTATION_SNAP_ANGLE = 15;
