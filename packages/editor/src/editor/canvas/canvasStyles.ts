/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette (error boundary / overlay / preview
 *   frame / warm neutral / onboarding theme). Chrome-hex lint rules do not apply.
 *
 * Canvas Style Objects
 * Extracted from Canvas.tsx for maintainability.
 * All inline style constants live here.
 *
 * @module components/Canvas/canvasStyles
 * @license BSD-3-Clause
 */

import type * as React from "react";
import { Z_LAYERS } from "../../shared/constants/canvas";
import type { DeviceType } from "../../shared/types";

export const wrapperStyles: React.CSSProperties = {
  flex: 1,
  background: "var(--buildrick-bg-subtle)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "auto",
  padding: 24,
  position: "relative",
  outline: "none",
};

// Fallback when the caller passes an unknown DeviceType that's missing
// from DEVICE_SIZES. Without this the canvas read `undefined.width` and
// crashed the editor (StudioErrorBoundary) — see the wide-breakpoint fix
// in Canvas.types.ts.
const DEFAULT_CANVAS_SIZE = { width: "100%", height: "100%" };

export function getCanvasStyles(
  size: { width: string; height: string } | undefined,
  device: DeviceType,
  scale: number,
  isDragOver: boolean
): React.CSSProperties {
  const safe = size ?? DEFAULT_CANVAS_SIZE;
  return {
    width: safe.width,
    height: safe.height,
    maxWidth: device === "desktop" ? "100%" : safe.width,
    maxHeight: device === "desktop" ? "100%" : safe.height,
    background: "var(--buildrick-bg-card)",
    borderRadius: 12,
    boxShadow: isDragOver
      ? "var(--bd-glow-primary), var(--bd-shadow-lg)"
      : "var(--bd-shadow-lg)",
    overflow: "auto",
    transform: `scale(${scale})`,
    transformOrigin: "center center",
    transition: "box-shadow 0.2s, width 0.3s, height 0.3s, transform 0.3s",
    position: "relative",
  };
}

export const contentStyles: React.CSSProperties = {
  minHeight: "100%",
  padding: 20,
  fontFamily: "var(--bd-font)",
  color: "var(--bd-fg-primary)",
  lineHeight: 1.6,
  position: "relative",
};

export const guidesContainerStyles: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  zIndex: 15,
};

export const spotsOverlayStyles: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: "none",
  zIndex: 1000,
};

export const alignmentToolbarStyles: React.CSSProperties = {
  position: "absolute",
  top: 60,
  right: 12,
  zIndex: Z_LAYERS.floatingToolbar,
  pointerEvents: "auto",
};

export function getMarqueeStyles(marquee: {
  start: { x: number; y: number };
  current: { x: number; y: number };
}): React.CSSProperties {
  return {
    position: "absolute",
    left: Math.min(marquee.start.x, marquee.current.x),
    top: Math.min(marquee.start.y, marquee.current.y),
    width: Math.abs(marquee.current.x - marquee.start.x),
    height: Math.abs(marquee.current.y - marquee.start.y),
    backgroundColor: "var(--buildrick-primary-alpha-15)",
    border: "1px solid var(--bd-accent)",
    borderRadius: 2,
    pointerEvents: "none",
    zIndex: Z_LAYERS.modal,
  };
}

export const footerToolbarContainerStyles: React.CSSProperties = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: Z_LAYERS.floatingToolbar,
  pointerEvents: "auto",
};
