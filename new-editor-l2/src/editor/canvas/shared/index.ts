/**
 * Canvas Shared Exports
 * Centralized utilities, hooks, and tokens for Canvas components
 * @license BSD-3-Clause
 */

// ============================================
// Design Tokens (CSS variable references)
// ============================================
export {
  tokens,
  colors,
  typography,
  spacing,
  radius,
  shadows,
  selection,
  transitions,
  zIndex,
  sizes,
} from "./tokens";

// ============================================
// Shared Hooks
// ============================================
export { useCanvasDOM } from "./useCanvasDOM";
export type { CanvasElement, UseCanvasDOMOptions, UseCanvasDOMResult } from "./useCanvasDOM";
export { useClickOutside } from "./useClickOutside";

// ============================================
// Geometry Utilities
// ============================================
export {
  domRectToRect,
  rectToEdges,
  getRectCenter,
  isPointInRect,
  rectsIntersect,
  rectContains,
  getIntersection,
  getBoundingRect,
  expandRect,
  distanceBetween,
  distanceToRect,
  viewportToCanvas,
  canvasToViewport,
  getClosestEdge,
  getRelativePosition,
  clampPointToRect,
} from "./geometry";
export type { Point, Rect, RectEdges, RectEdge } from "./geometry";

// ============================================
// Hit Testing Utilities
// ============================================
export { HIT_EXPANSION, buildElementStack, findElementWithHitExpansion } from "./hitTesting";

// ============================================
// Shared Components
// ============================================
export { CanvasButton } from "./CanvasButton";
export type { CanvasButtonProps } from "./CanvasButton";
export { GuideLine, GuideLines } from "./GuideLine";
export type { GuideLineProps, GuideLinesProps } from "./GuideLine";

// ============================================
// Legacy Exports (for backward compatibility)
// Re-export from central constants during migration
// ============================================
export {
  CANVAS_COLORS,
  BUTTON_BASE_STYLE,
  PANEL_STYLE,
  INPUT_STYLE,
  DROPDOWN_STYLE,
  LABEL_STYLE,
  GROUP_HEADER_STYLE,
  Z_INDEX,
  SIZES,
  DEVICE_PRESETS,
  ZOOM_PRESETS,
  ZOOM_LIMITS,
} from "../../../shared/constants/canvas";
