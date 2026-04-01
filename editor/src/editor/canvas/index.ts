/**
 * editor/canvas — Main visual editing surface
 * Integration: L2 — fully wired (drag-drop, selection, overlays, keyboard, inline edit)
 *
 * Public API: Canvas component + types. Internal hooks/overlays/controls are
 * intentionally NOT re-exported here — consumers that need them should import
 * from their canonical sub-paths (editor/canvas/hooks/*, editor/canvas/overlays/*, etc.)
 *
 * @license BSD-3-Clause
 */

// Main canvas component
export { Canvas } from "./Canvas";
export type { CanvasProps, CanvasRef } from "./Canvas";
export { DEVICE_SIZES } from "./Canvas.types";
// DeviceType lives in types/ — import from "../../shared/types" if you need it

// Footer toolbar (overlays + zoom, IA Redesign 2026)
export { CanvasFooterToolbar } from "./CanvasFooterToolbar";
export type { CanvasFooterToolbarProps, CanvasOverlayState } from "./CanvasFooterToolbar";

// Zoom controls (standalone widget)
export { ZoomControls } from "./ZoomControls";
export type { ZoomControlsProps } from "./ZoomControls";

// Empty canvas CTA
export { CanvasEmptyCTA } from "./CanvasEmptyCTA";
