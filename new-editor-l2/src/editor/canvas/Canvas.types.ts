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
}

export interface CanvasRef {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  getHTML: () => string;
  getCSS: () => string;
  getContent: () => string;
  /** Open the command palette (Cmd+Shift+P) */
  openCommandPalette: () => void;
}

export const DEVICE_SIZES: Record<string, { width: string; height: string }> = {
  desktop: { width: "100%", height: "100%" },
  tablet: { width: "768px", height: "1024px" },
  mobile: { width: "375px", height: "812px" },
  watch: { width: "196px", height: "230px" },
};
