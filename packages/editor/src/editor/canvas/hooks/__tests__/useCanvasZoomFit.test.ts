/**
 * L1-012 (owner 2026-10-10): Fit when the frame exceeds the column, else
 * 100%; remember per site whether the user chose Fit or a fixed percent;
 * re-fit on resize unless a percent was chosen.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Composer } from "@/engine";
import {
  computeFitZoom,
  readZoomPreference,
  useCanvasZoomFit,
  FIT_GUTTER,
} from "../useCanvasZoomFit";

let resizeCallbacks: Array<() => void> = [];
class FakeResizeObserver {
  constructor(cb: () => void) {
    resizeCallbacks.push(cb);
  }
  observe() {}
  disconnect() {}
}

function setup(opts: { frameWidth: number; columnWidth: number; siteId?: string }) {
  const viewport = { clientWidth: opts.columnWidth } as HTMLElement;
  const scrollRef = { current: viewport };
  let zoom = 100;
  const composer = { setZoom: vi.fn((z: number) => { zoom = z; }) } as unknown as Composer & { setZoom: ReturnType<typeof vi.fn> };
  const hook = renderHook(
    (props: { zoom: number; frameWidth: number; ready: boolean }) =>
      useCanvasZoomFit({ composer, scrollRef, siteId: opts.siteId ?? "site-1", ...props }),
    { initialProps: { zoom, frameWidth: opts.frameWidth, ready: false } },
  );
  /* The canvas re-renders with whatever the composer now holds. */
  const sync = (over: Partial<{ frameWidth: number; ready: boolean }> = {}) =>
    hook.rerender({ zoom, frameWidth: opts.frameWidth, ready: true, ...over });
  return { hook, composer, viewport, sync, getZoom: () => zoom, setZoom: (z: number) => { zoom = z; } };
}

beforeEach(() => {
  window.localStorage.clear();
  resizeCallbacks = [];
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
});

describe("computeFitZoom", () => {
  it("is 100% when the frame fits the column", () => {
    expect(computeFitZoom(375, 752)).toBe(100);
    expect(computeFitZoom(1280, 1280 + FIT_GUTTER * 2)).toBe(100);
  });

  it("scales the frame width into the column, with the gutter, when it is wider", () => {
    expect(computeFitZoom(1280, 752)).toBe(Math.floor(((752 - FIT_GUTTER * 2) / 1280) * 100));
  });

  it("never enlarges and never drops under 10%", () => {
    expect(computeFitZoom(375, 4000)).toBe(100);
    expect(computeFitZoom(20000, 300)).toBe(10);
  });
});

describe("useCanvasZoomFit", () => {
  it("opens in Fit when nothing is remembered", () => {
    const t = setup({ frameWidth: 1280, columnWidth: 752 });
    t.sync();
    expect(t.composer.setZoom).toHaveBeenLastCalledWith(computeFitZoom(1280, 752));
  });

  /* Live regression (2026-10-10): the render that applies the first fit still
     carries the old 100, and the pin effect read that as a chosen 100%. */
  it("does not pin the stale zoom of the render that applies the first fit", () => {
    const t = setup({ frameWidth: 1280, columnWidth: 752 });
    t.hook.rerender({ zoom: 100, frameWidth: 1280, ready: true });
    expect(window.localStorage.getItem("bk-canvas-zoom:site-1")).toBeNull();
    t.sync();
    expect(window.localStorage.getItem("bk-canvas-zoom:site-1")).toBeNull();
    expect(t.getZoom()).toBe(computeFitZoom(1280, 752));
  });

  it("waits for the column to have a width before the first fit", () => {
    const t = setup({ frameWidth: 1280, columnWidth: 0 });
    t.sync();
    expect(t.composer.setZoom).not.toHaveBeenCalled();
    Object.defineProperty(t.viewport, "clientWidth", { value: 752 });
    act(() => resizeCallbacks.forEach((cb) => cb()));
    expect(t.getZoom()).toBe(computeFitZoom(1280, 752));
  });

  it("opens at 100% when the frame already fits", () => {
    const t = setup({ frameWidth: 768, columnWidth: 1100 });
    t.sync();
    expect(t.getZoom()).toBe(100);
  });

  it("re-fits when the column resizes while in Fit", () => {
    const t = setup({ frameWidth: 1280, columnWidth: 752 });
    t.sync();
    t.sync();
    Object.defineProperty(t.viewport, "clientWidth", { value: 1000 });
    act(() => resizeCallbacks.forEach((cb) => cb()));
    expect(t.getZoom()).toBe(computeFitZoom(1280, 1000));
  });

  it("an explicit percent is remembered per site and stops re-fitting", () => {
    const t = setup({ frameWidth: 1280, columnWidth: 752 });
    t.sync();
    t.sync();
    t.setZoom(75); // user picked 75%
    t.sync();
    expect(readZoomPreference("site-1")).toBe(75);
    expect(readZoomPreference("site-2")).toBe("fit");
    Object.defineProperty(t.viewport, "clientWidth", { value: 1000 });
    act(() => resizeCallbacks.forEach((cb) => cb()));
    expect(t.getZoom()).toBe(75);
  });

  it("restores the remembered percent on the next open, through a breakpoint switch", () => {
    window.localStorage.setItem("bk-canvas-zoom:site-1", "75");
    const t = setup({ frameWidth: 1280, columnWidth: 752 });
    t.sync();
    expect(t.getZoom()).toBe(75);
    t.sync({ frameWidth: 375 });
    expect(t.getZoom()).toBe(75);
  });

  it("choosing Fit again is remembered and re-fits on a breakpoint switch", () => {
    window.localStorage.setItem("bk-canvas-zoom:site-1", "75");
    const t = setup({ frameWidth: 1280, columnWidth: 752 });
    t.sync();
    act(() => t.hook.result.current());
    expect(readZoomPreference("site-1")).toBe("fit");
    t.sync();
    expect(t.getZoom()).toBe(computeFitZoom(1280, 752));
    t.sync({ frameWidth: 375 });
    expect(t.getZoom()).toBe(100);
  });
});
