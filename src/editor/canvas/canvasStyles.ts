/**
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
  background: "#f1f5f9",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "auto",
  padding: 24,
  position: "relative",
  outline: "none",
};

export function getCanvasStyles(
  size: { width: string; height: string },
  device: DeviceType,
  scale: number,
  isDragOver: boolean
): React.CSSProperties {
  return {
    width: size.width,
    height: size.height,
    maxWidth: device === "desktop" ? "100%" : size.width,
    maxHeight: device === "desktop" ? "100%" : size.height,
    background: "#fff",
    borderRadius: 12,
    boxShadow: isDragOver
      ? "0 0 0 3px #89b4fa, 0 8px 32px rgba(0,0,0,0.4)"
      : "0 8px 32px rgba(0,0,0,0.4)",
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
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  color: "#1a1a2e",
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
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    border: "1px solid rgba(59, 130, 246, 0.8)",
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
