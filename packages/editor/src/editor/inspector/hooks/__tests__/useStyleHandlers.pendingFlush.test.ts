/**
 * A debounced single write must never land AFTER a later write.
 *
 * `handleStyleChange` holds its engine write for 300ms. A batch that arrived
 * inside that window (the Fill type switch Gradient → Color clears
 * `background` and sets `background-color`) ran first, and then the pending
 * gradient write fired on top of it and undid the switch. A second single
 * write for a DIFFERENT property inside the window used to cancel the first
 * one outright.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Composer } from "@/engine";
import { useStyleHandlers } from "../useStyleHandlers";

/* Hoisted: a fresh selection object per render re-runs the load effect forever. */
const SELECTED = { id: "e1", type: "box" } as never;

function setup() {
  const store: Record<string, string> = {};
  const el = {
    getId: () => "e1",
    getStyles: () => ({ ...store }),
    setStyle: vi.fn((k: string, v: string) => {
      store[k] = v;
    }),
    removeStyle: vi.fn((k: string) => {
      delete store[k];
    }),
  };
  const composer = {
    emit: vi.fn(),
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    elements: { getElement: vi.fn(() => el) },
    styles: { getBreakpointStyle: vi.fn(() => ({})) },
  };
  const { result } = renderHook(() =>
    useStyleHandlers(SELECTED, composer as unknown as Composer, "desktop", "normal"),
  );
  return { store, result };
}

describe("useStyleHandlers — a pending single write is flushed, never dropped or late", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("a batch inside the debounce window ends with the batch's result", () => {
    vi.useFakeTimers();
    const { store, result } = setup();
    act(() => {
      result.current.handleStyleChange("background", "linear-gradient(90deg, #000, #fff)");
    });
    act(() => {
      vi.advanceTimersByTime(100);
      result.current.handleBatchStyleChange({ background: "", "background-color": "#ffffff" });
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(store.background).toBeUndefined();
    expect(store["background-color"]).toBe("#ffffff");
  });

  it("a second single write for a different property does not drop the first", () => {
    vi.useFakeTimers();
    const { store, result } = setup();
    act(() => {
      result.current.handleStyleChange("color", "#111111");
      result.current.handleStyleChange("font-size", "12px");
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(store.color).toBe("#111111");
    expect(store["font-size"]).toBe("12px");
  });

  it("repeated writes to the SAME property still coalesce into one engine write", () => {
    vi.useFakeTimers();
    const { store, result } = setup();
    const el = result.current;
    act(() => {
      el.handleStyleChange("width", "1");
      el.handleStyleChange("width", "12");
      el.handleStyleChange("width", "120px");
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(store.width).toBe("120px");
  });
});
