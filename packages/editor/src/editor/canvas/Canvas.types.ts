/**
 * Canvas Types and Constants
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "../../engine";
import { DEVICE_PREVIEW_SIZES } from "../../shared/constants/breakpoints";
import type { DeviceType } from "../../shared/types";
import type { CanvasOverlayState } from "./CanvasFooterToolbar";

export interface CanvasProps {
  composer: Composer | null;
  device: DeviceType;
  zoom: number;
  onAIRequest?: (payload: { elementId: string; elementType?: string }) => void;
  showSpacing?: boolean;
  showBadges?: boolean;
  showGuides?: boolean;
  showGrid?: boolean;
  showOutlines?: boolean;
  showRulers?: boolean;
  showXRay?: boolean;
  /** Dev Mode - auto-enables Level 3/4 hover (boxmodel/hierarchy) without Alt/Shift */
  devMode?: boolean;
  /** Show the canvas footer toolbar with overlays and zoom controls */
  showFooterToolbar?: boolean;
  /**
   * View mode. Hiding the rail and the inspector left the canvas itself fully
   * live: double-click still opened contentEditable and typing replaced the
   * heading — measured, not assumed. A view that can be edited is not a view,
   * so the handlers that MUTATE the document are withheld. Selection and cursor
   * sync stay: they change nothing and comments need the pointer.
   */
  readOnly?: boolean;
  /** Callback when zoom changes (from footer toolbar) */
  onZoomChange?: (zoom: number) => void;
  /** Callback when overlay toggles change (from footer toolbar) */
  onOverlayChange?: (overlay: keyof CanvasOverlayState, enabled: boolean) => void;
  /** Change the active device/breakpoint (from the footer toolbar's switcher). */
  onDeviceChange?: (device: DeviceType) => void;
  /** Whether an undo step is available (drives the footer toolbar's Undo). */
  canUndo?: boolean;
  /** Whether a redo step is available (drives the footer toolbar's Redo). */
  canRedo?: boolean;
  /** Open the image editor for a media element on the canvas (consumed by CanvasOverlayGroup) */
  onOpenImageEditor?: (item: { key: string; src: string; name: string }) => void;
}

export interface CanvasRef {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  getHTML: () => string;
  getCSS: () => string;
  getContent: () => string;
}

const px = (v: number | "100%") => (typeof v === "number" ? `${v}px` : v);

/** Canvas frame size per device, in CSS — derived from DEVICE_PREVIEW_SIZES. */
export const DEVICE_SIZES = Object.fromEntries(
  Object.entries(DEVICE_PREVIEW_SIZES).map(([id, s]) => [id, { width: px(s.width), height: px(s.height) }])
) as Record<DeviceType, { width: string; height: string }>;
