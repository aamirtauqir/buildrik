/**
 * TRANSITION REDIRECT — components/Canvas is being migrated to editor/canvas/
 * Canonical location: src/editor/canvas/
 * Remove this file in Phase 5 (barrel cleanup).
 *
 * This redirect only surfaces the top-level public API from editor/canvas/index.ts.
 * For hooks, overlays, controls, etc. import directly from:
 *   editor/canvas/hooks/*, editor/canvas/overlays/*, etc.
 *
 * @license BSD-3-Clause
 */

// Main canvas component
export { Canvas } from "../../editor/canvas/Canvas";
export type { CanvasProps, CanvasRef } from "../../editor/canvas/Canvas";
export { DEVICE_SIZES } from "../../editor/canvas/Canvas.types";
// DeviceType lives in types/ — import from "../../shared/types" if you need it

// Footer toolbar
export { CanvasFooterToolbar } from "../../editor/canvas/CanvasFooterToolbar";
export type {
  CanvasFooterToolbarProps,
  CanvasOverlayState,
} from "../../editor/canvas/CanvasFooterToolbar";

// Zoom controls
export { ZoomControls } from "../../editor/canvas/ZoomControls";
export type { ZoomControlsProps } from "../../editor/canvas/ZoomControls";

// Empty canvas CTA
export { CanvasEmptyCTA } from "../../editor/canvas/CanvasEmptyCTA";
