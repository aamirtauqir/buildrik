/**
 * Canvas Types and Constants
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "../../engine";
import type { DeviceType } from "../../shared/types";
import type { CanvasOverlayState } from "./CanvasFooterToolbar";

export interface CanvasProps {
  composer: Composer | null;
  device: DeviceType;
  zoom: number;
  onAIRequest?: (payload: { elementId: string; elementType?: string }) => void;
  showComponentView?: boolean;
  showSpacing?: boolean;
  showBadges?: boolean;
  showGuides?: boolean;
  showGrid?: boolean;
  gridSize?: number;
  showOutlines?: boolean;
  showRulers?: boolean;
  showXRay?: boolean;
  /** Dev Mode - auto-enables Level 3/4 hover (boxmodel/hierarchy) without Alt/Shift */
  devMode?: boolean;
  /** Show the canvas footer toolbar with overlays and zoom controls */
  showFooterToolbar?: boolean;
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

export const DEVICE_SIZES: Record<string, { width: string; height: string }> = {
  // "wide" was missing — clicking the Wide breakpoint button caused the
  // canvas to read undefined.width and crash the editor (StudioErrorBoundary).
  // Width matches BreakpointDropdown.tsx { id: "wide", width: 1920 }.
  wide: { width: "1920px", height: "100%" },
  desktop: { width: "100%", height: "100%" },
  tablet: { width: "768px", height: "1024px" },
  mobile: { width: "375px", height: "812px" },
  watch: { width: "196px", height: "230px" },
};
