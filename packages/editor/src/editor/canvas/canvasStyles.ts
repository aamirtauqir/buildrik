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
import { BREAKPOINTS } from "../../shared/constants/breakpoints";
import { Z_LAYERS } from "../../shared/constants/canvas";
import type { DeviceType } from "../../shared/types";

/* Does NOT scroll — `.bd-canvas-scroll` (Canvas.css) is the viewport, and the
   reason is written there: an absolute child of a scrolling box travels with
   the content, which took the footer toolbar off screen. */
export const wrapperStyles: React.CSSProperties = {
  flex: 1,
  background: "var(--bk-bg-subtle)",
  display: "flex",
  overflow: "hidden",
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
    /* Desktop is the only device DEVICE_SIZES sizes elastically ("100%") —
       every other one carries a real device width. So desktop alone rendered
       at whatever the canvas column happened to be: 712px with the drawer
       open at 1440, which is below `BREAKPOINTS.desktop.minWidth`. The page
       reflowed as a narrow desktop while StyleEngine withheld the tablet and
       mobile overrides (device is still "desktop"), so the customer's site was
       drawn in a layout that ships on no screen. Floor it at the breakpoint
       the rest of the product already agrees on and let the wrapper scroll. */
    minWidth: device === "desktop" ? `${BREAKPOINTS.desktop.minWidth}px` : undefined,
    /* The canvas is a flex item, so `min-width: auto` resolves to 0 and the
       default `flex-shrink: 1` pulled EVERY device down to the column width.
       Measured live at 1440 with a drawer open (712px of viewport): tablet
       declared 768px and rendered 712 — below `BREAKPOINTS.tablet.minWidth`,
       i.e. the customer's page laid out at mobile width while StyleEngine was
       applying the tablet overrides — and wide declared 1920px and also
       rendered 712. Desktop only escaped because its minWidth above happens to
       floor it. A device frame that silently becomes the column is not a device
       frame; let it keep its width and let .bd-canvas-scroll scroll. */
    flexShrink: 0,
    maxWidth: device === "desktop" ? "100%" : safe.width,
    maxHeight: device === "desktop" ? "100%" : safe.height,
    background: "var(--bk-bg-card)",
    borderRadius: 12,
    boxShadow: isDragOver
      ? "var(--bk-shadow-focus), var(--bk-shadow-overlay)"
      : "var(--bk-shadow-overlay)",
    overflow: "auto",
    transform: `scale(${scale})`,
    transformOrigin: "center center",
    transition: "box-shadow 0.2s, width 0.3s, height 0.3s, transform 0.3s",
    position: "relative",
  };
}

/**
 * The div that receives customer HTML (`Canvas.tsx:608`,
 * `dangerouslySetInnerHTML`). It used to carry two CHROME tokens inline —
 * `--bk-font-ui` and `--bk-ink` — and inline beats every stylesheet, so the
 * editor's own UI font and ink were what every customer site rendered in, and
 * the Brand panel's font slots could not reach past them.
 *
 * The site's own defaults now come from `themes/design-system/site-content.css`,
 * which is where site-builder DS belongs. Nothing about the customer's type
 * belongs in this file.
 */
export const contentStyles: React.CSSProperties = {
  minHeight: "100%",
  padding: 20,
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
    backgroundColor: "var(--bk-alpha-accent-15)",
    border: "1px solid var(--bk-accent)",
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
