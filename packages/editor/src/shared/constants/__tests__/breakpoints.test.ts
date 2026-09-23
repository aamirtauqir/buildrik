/**
 * constants/breakpoints — query/config lookups + width classification.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  getBreakpointQuery,
  getBreakpointConfig,
  isValidBreakpoint,
  getBreakpointForWidth,
  DEVICE_PREVIEW_SIZES,
  BREAKPOINTS,
} from "../breakpoints";
import { DEVICE_PRESETS } from "../canvas";

describe("getBreakpointQuery", () => {
  it("returns null for desktop (base styles) and media queries otherwise", () => {
    expect(getBreakpointQuery("desktop")).toBeNull();
    expect(getBreakpointQuery("tablet")).toBe("(max-width: 1023px)");
    expect(getBreakpointQuery("mobile")).toBe("(max-width: 767px)");
  });
});

describe("getBreakpointConfig", () => {
  it("returns the config record", () => {
    expect(getBreakpointConfig("mobile")).toMatchObject({ id: "mobile", minWidth: 0, maxWidth: 767 });
    expect(getBreakpointConfig("desktop").minWidth).toBe(1024);
  });
});

describe("isValidBreakpoint", () => {
  it("recognises the three breakpoint ids", () => {
    expect(isValidBreakpoint("tablet")).toBe(true);
    expect(isValidBreakpoint("watch")).toBe(false);
    expect(isValidBreakpoint("")).toBe(false);
  });
});

describe("getBreakpointForWidth", () => {
  it("classifies widths at the boundaries", () => {
    expect(getBreakpointForWidth(1440)).toBe("desktop");
    expect(getBreakpointForWidth(1024)).toBe("desktop");
    expect(getBreakpointForWidth(1023)).toBe("tablet");
    expect(getBreakpointForWidth(768)).toBe("tablet");
    expect(getBreakpointForWidth(767)).toBe("mobile");
    expect(getBreakpointForWidth(0)).toBe("mobile");
  });
});

describe("DEVICE_PREVIEW_SIZES — the one device table (G2-013)", () => {
  it("holds fixed device dimensions", () => {
    expect(DEVICE_PREVIEW_SIZES.mobile).toMatchObject({ width: 375, height: 812 });
    expect(DEVICE_PREVIEW_SIZES.tablet).toMatchObject({ width: 768, height: 1024 });
    expect(DEVICE_PREVIEW_SIZES.desktop).toMatchObject({ width: "100%", height: "100%" });
    expect(DEVICE_PREVIEW_SIZES.wide).toMatchObject({ width: 1920 });
  });

  it("the legacy presets agree with it", () => {
    expect(DEVICE_PRESETS.map((d) => d.width)).toEqual([BREAKPOINTS.desktop.minWidth, 768, 375]);
  });
});
