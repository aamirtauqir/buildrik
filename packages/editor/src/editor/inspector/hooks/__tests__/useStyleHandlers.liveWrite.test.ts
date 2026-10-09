/**
 * L2-019: an Inspector edit reaches the canvas at once. The engine write used
 * to wait out a 300 ms debounce — live, font size 16→28 still read 16px on the
 * canvas at 60 ms. The first write of a burst now lands immediately, and the
 * rest at most one short interval apart; history still coalesces the burst
 * into one undo step (HistoryManager's window), so this is about latency only.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Composer } from "@/engine";
import { useStyleHandlers } from "../useStyleHandlers";

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
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    elements: { getElement: vi.fn(() => el) },
    styles: { getBreakpointStyle: vi.fn(() => ({})) },
  };
  const { result } = renderHook(() =>
    useStyleHandlers(SELECTED, composer as unknown as Composer, "desktop", "normal"),
  );
  return { store, el, result };
}

describe("useStyleHandlers — the canvas follows the field (L2-019)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes the first change of a burst immediately", () => {
    vi.useFakeTimers();
    const { store, result } = setup();
    act(() => {
      result.current.handleStyleChange("font-size", "28px");
    });
    expect(store["font-size"]).toBe("28px");
  });

  it("a rapid follow-up lands within one short interval, not 300 ms later", () => {
    vi.useFakeTimers();
    const { store, result } = setup();
    act(() => {
      result.current.handleStyleChange("font-size", "2px");
      result.current.handleStyleChange("font-size", "28px");
    });
    expect(store["font-size"]).toBe("2px");
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(store["font-size"]).toBe("28px");
  });

  it("a slider drag writes at a bounded rate, ending on the last value", () => {
    vi.useFakeTimers();
    const { store, el, result } = setup();
    act(() => {
      for (let i = 1; i <= 20; i++) {
        result.current.handleStyleChange("opacity", String(i / 20));
        vi.advanceTimersByTime(5);
      }
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(store.opacity).toBe("1");
    expect(el.setStyle.mock.calls.length).toBeLessThan(20);
  });
});
