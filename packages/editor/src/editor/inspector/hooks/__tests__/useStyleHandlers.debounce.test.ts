import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStyleHandlers } from "../useStyleHandlers";

describe("useStyleHandlers flushes pending edit on element change", () => {
  afterEach(() => { vi.useRealTimers(); });

  it("commits pending debounced edit when selection changes before 300ms, exactly once", () => {
    vi.useFakeTimers();
    const el = { getStyles: () => ({}), setStyle: vi.fn(), removeStyle: vi.fn() };
    const composer = {
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
      elements: { getElement: vi.fn(() => el) },
      styles: { getBreakpointStyle: vi.fn(() => ({})) },
    } as any;

    const { result, rerender } = renderHook(
      ({ sel }) => useStyleHandlers(sel, composer, "desktop", "normal"),
      { initialProps: { sel: { id: "e1", type: "box" } } }
    );

    act(() => { result.current.handleStyleChange("color", "#abc"); });
    rerender({ sel: { id: "e2", type: "box" } });

    // Flush fired on cleanup — exactly once, with correct args, inside a transaction.
    expect(el.setStyle).toHaveBeenCalledWith("color", "#abc");
    expect(el.setStyle).toHaveBeenCalledTimes(1);
    expect(composer.beginTransaction).toHaveBeenCalledWith("style-change");

    // Advance the timer past the debounce window — proves the cleared timer does NOT re-fire.
    act(() => { vi.advanceTimersByTime(1000); });
    expect(el.setStyle).toHaveBeenCalledTimes(1);
  });
});
