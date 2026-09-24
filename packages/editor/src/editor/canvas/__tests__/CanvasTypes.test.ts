/**
 * Canvas.types — DEVICE_SIZES map.
 *
 * Regression pin: "wide" was missing from DEVICE_SIZES and clicking the Wide
 * breakpoint crashed the editor (undefined.width → StudioErrorBoundary).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import type { Composer } from "../../../engine";
import { Viewport } from "../../../engine/Viewport";
import { DEVICE_SIZES } from "../Canvas.types";

describe("DEVICE_SIZES", () => {
  it("contains an entry for every breakpoint the switcher can select", () => {
    for (const device of ["wide", "desktop", "tablet", "mobile"] as const) {
      expect(DEVICE_SIZES[device], `missing DEVICE_SIZES["${device}"]`).toBeDefined();
      expect(DEVICE_SIZES[device].width).toBeTruthy();
      expect(DEVICE_SIZES[device].height).toBeTruthy();
    }
  });

  it('pins the "wide" crash fix — 1920px width matching BreakpointDropdown', () => {
    expect(DEVICE_SIZES.wide).toEqual({ width: "1920px", height: "100%" });
  });

  it("keeps canonical device dimensions stable", () => {
    expect(DEVICE_SIZES.desktop).toEqual({ width: "100%", height: "100%" });
    expect(DEVICE_SIZES.tablet).toEqual({ width: "768px", height: "1024px" });
    expect(DEVICE_SIZES.mobile).toEqual({ width: "375px", height: "812px" });
    // Decision #26: the Watch device is gone.
    expect((DEVICE_SIZES as Record<string, unknown>).watch).toBeUndefined();
  });
});

/* G2-013: the canvas frame and the engine viewport read one device table. */
describe("the engine viewport reads the same device table", () => {
  it("has the same widths", () => {
    const devices = new Viewport({ emit: () => {} } as unknown as Composer).getDevices();
    expect(devices.tablet).toMatchObject({ width: 768, height: 1024 });
    expect(devices.mobile).toMatchObject({ width: 375, height: 812 });
    expect(devices.desktop).toMatchObject({ width: 1024 });
    expect(devices.wide.width).toBe(1920);
  });
});
