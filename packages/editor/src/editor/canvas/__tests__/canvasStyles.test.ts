/**
 * getCanvasStyles — the device-frame contract.
 *
 * Written 2026-08-31, after an adversarial review pointed out that the
 * higher-risk of two changes shipped with no coverage at all while the lower-
 * risk one got a whole test file. Both defects below were found by measuring
 * the running editor at 1440x900 with a drawer open (712px of viewport), and
 * both are the same shape: the canvas silently became its container, so the
 * customer's page was laid out at a width that ships on no screen.
 *
 *   1. `DEVICE_SIZES.desktop` is `"100%"` — the only elastic entry — so desktop
 *      rendered at 712, under `BREAKPOINTS.desktop.minWidth` (1024), while
 *      StyleEngine withheld the tablet/mobile overrides because the device was
 *      still "desktop".
 *   2. The canvas is a flex item, so `min-width: auto` resolves to 0 and the
 *      default `flex-shrink: 1` pulled the FIXED devices down too: tablet
 *      declared 768 and rendered 712 (under its own breakpoint), wide declared
 *      1920 and rendered 712.
 *
 * These assert the mechanism, not a screenshot. The live proof is in
 * docs/audits/2026-08-31-chrome-weight-and-canvas-fit.md.
 */
import { describe, it, expect } from "vitest";
import { BREAKPOINTS } from "@/shared/constants/breakpoints";
import { DEVICE_SIZES } from "../Canvas.types";
import { getCanvasStyles, wrapperStyles } from "../canvasStyles";
import type { DeviceType } from "@/shared/types";

const styles = (device: DeviceType, scale = 1) =>
  getCanvasStyles(DEVICE_SIZES[device], device, scale, false);

describe("getCanvasStyles — a device frame keeps its width", () => {
  it("never lets the canvas shrink to its container, for any device", () => {
    // The single line that stops findings 1 and 2 above from returning.
    for (const device of ["desktop", "wide", "tablet", "mobile"] as DeviceType[]) {
      expect(styles(device).flexShrink, `${device} may shrink to the column`).toBe(0);
    }
  });

  it("floors desktop at the breakpoint the rest of the product uses", () => {
    expect(styles("desktop").minWidth).toBe(`${BREAKPOINTS.desktop.minWidth}px`);
  });

  it("reads the floor from BREAKPOINTS, not a literal", () => {
    // A hardcoded 1024 here would drift the day the breakpoint moves, and the
    // symptom would be a page laid out below its own breakpoint again.
    expect(styles("desktop").minWidth).not.toBe("1024px_literal");
    expect(String(styles("desktop").minWidth)).toContain(String(BREAKPOINTS.desktop.minWidth));
  });

  it("does not floor the fixed-width devices — their own width is the frame", () => {
    for (const device of ["wide", "tablet", "mobile"] as DeviceType[]) {
      expect(styles(device).minWidth, `${device} should not carry a desktop floor`).toBeUndefined();
      expect(styles(device).width).toBe(DEVICE_SIZES[device].width);
    }
  });

  it("every fixed device renders at or above its own breakpoint", () => {
    // tablet 768 vs BREAKPOINTS.tablet.minWidth 768 — the case that was failing
    // live at 712. Guards the pairing itself, not just the number.
    const px = (v: unknown) => parseInt(String(v), 10);
    expect(px(styles("tablet").width)).toBeGreaterThanOrEqual(BREAKPOINTS.tablet.minWidth);
    expect(px(styles("desktop").minWidth)).toBeGreaterThanOrEqual(BREAKPOINTS.desktop.minWidth);
  });

  it("keeps the scroll off the padded wrapper", () => {
    /* The wrapper is the footer toolbar's containing block. If it scrolls, an
       absolutely-positioned child is laid out against the scroll CONTENT box,
       so `right: 0` means the far edge of a 1024px page and the toolbar slides
       off screen — which is exactly what happened. `.bd-canvas-scroll`
       (Canvas.css) is the viewport. */
    expect(wrapperStyles.overflow).toBe("hidden");
    expect(wrapperStyles.position).toBe("relative");
  });

  it("applies zoom as a transform, so callers must not read width for size", () => {
    // Recorded because it bit this arc: transform is post-layout, so the box
    // stays full-size at every zoom. Fit-to-screen cannot centre by shrinking
    // the layout, and a scaled canvas still overflows its scroller.
    expect(styles("desktop", 0.5).transform).toBe("scale(0.5)");
    expect(styles("desktop", 0.5).width).toBe(DEVICE_SIZES.desktop.width);
  });
});
