/**
 * useStyleHandlers — the "All like this" reach (board 160:412).
 *
 * This mode replaced a one-shot that copied the selected element's ENTIRE
 * style map onto every same-type peer the moment it was picked. The two are
 * easy to confuse from the outside — both end with peers changed — so the
 * difference is what these tests hold: only the property being edited moves,
 * it moves to the same breakpoint and pseudo-state as the source, and the
 * whole fan-out is one transaction so a single undo takes it back.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStyleHandlers } from "../useStyleHandlers";
import { getBreakpointQuery } from "../../../../shared/constants/breakpoints";

function makeComposer() {
  const setStyle = vi.fn();
  const removeStyle = vi.fn();
  return {
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    elements: {
      getElement: vi.fn((id: string) => ({
        getId: () => id,
        getStyles: () => ({}),
        setStyle: (prop: string, val: string) => setStyle(id, prop, val),
        removeStyle: (prop: string) => removeStyle(id, prop),
      })),
    },
    styles: {
      getRule: vi.fn(() => undefined),
      setRule: vi.fn(),
      getBreakpointStyle: vi.fn(() => ({})),
      setBreakpointStyle: vi.fn(),
      removeBreakpointStyleProperty: vi.fn(),
    },
    _setStyle: setStyle,
    _removeStyle: removeStyle,
  };
}

/** The hook takes a Composer; this double implements the slice it uses. */
const asComposer = (c: ReturnType<typeof makeComposer>) =>
  c as unknown as Parameters<typeof useStyleHandlers>[1];

const SEL = { id: "el1", type: "button" };

function flush(fn: () => void) {
  vi.useFakeTimers();
  fn();
  act(() => {
    vi.advanceTimersByTime(310);
  });
  vi.useRealTimers();
}

describe("useStyleHandlers — All like this", () => {
  it("with no reach, an edit touches only the selected element", () => {
    const composer = makeComposer();
    const { result } = renderHook(() => useStyleHandlers(SEL, asComposer(composer), "desktop", "normal"));
    flush(() => {
      act(() => result.current.handleStyleChange("color", "#f00"));
    });
    const calls = composer._setStyle.mock.calls;
    expect(calls).toEqual([["el1", "color", "#f00"]]);
  });

  it("with a reach, the SAME property lands on every peer", () => {
    const composer = makeComposer();
    const { result } = renderHook(() =>
      useStyleHandlers(SEL, asComposer(composer), "desktop", "normal", ["el2", "el3"])
    );
    flush(() => {
      act(() => result.current.handleStyleChange("color", "#f00"));
    });
    const calls = composer._setStyle.mock.calls;
    expect(calls).toEqual([
      ["el1", "color", "#f00"],
      ["el2", "color", "#f00"],
      ["el3", "color", "#f00"],
    ]);
  });

  it("carries ONLY the edited property — a peer's other styles are never read or written", () => {
    const composer = makeComposer();
    const { result } = renderHook(() =>
      useStyleHandlers(SEL, asComposer(composer), "desktop", "normal", ["el2"])
    );
    flush(() => {
      act(() => result.current.handleStyleChange("padding", "24px"));
    });
    const calls = composer._setStyle.mock.calls;
    expect(calls.every(([, prop]: string[]) => prop === "padding")).toBe(true);
    expect(calls).toHaveLength(2);
  });

  it("clearing a property clears it on the peers too, rather than leaving them behind", () => {
    const composer = makeComposer();
    const { result } = renderHook(() =>
      useStyleHandlers(SEL, asComposer(composer), "desktop", "normal", ["el2"])
    );
    flush(() => {
      act(() => result.current.handleStyleChange("color", ""));
    });
    const calls = composer._removeStyle.mock.calls;
    expect(calls).toEqual([
      ["el1", "color"],
      ["el2", "color"],
    ]);
  });

  it("the whole fan-out is one transaction, so one undo takes it back", () => {
    const composer = makeComposer();
    const { result } = renderHook(() =>
      useStyleHandlers(SEL, asComposer(composer), "desktop", "normal", ["el2", "el3", "el4"])
    );
    flush(() => {
      act(() => result.current.handleStyleChange("color", "#f00"));
    });
    expect(composer.beginTransaction).toHaveBeenCalledTimes(1);
    expect(composer.endTransaction).toHaveBeenCalledTimes(1);
  });

  it("a tablet edit writes each peer's TABLET override, not its base", () => {
    const composer = makeComposer();
    const { result } = renderHook(() =>
      useStyleHandlers(SEL, asComposer(composer), "tablet", "normal", ["el2"])
    );
    flush(() => {
      act(() => result.current.handleStyleChange("padding", "8px"));
    });
    expect(composer.styles.setBreakpointStyle).toHaveBeenCalledWith("el1", "tablet", {
      padding: "8px",
    });
    expect(composer.styles.setBreakpointStyle).toHaveBeenCalledWith("el2", "tablet", {
      padding: "8px",
    });
    expect(composer._setStyle).not.toHaveBeenCalled();
  });

  it("a :hover edit writes each peer's OWN hover rule, not one shared selector", () => {
    const composer = makeComposer();
    const { result } = renderHook(() =>
      useStyleHandlers(SEL, asComposer(composer), "mobile", "hover", ["el2"])
    );
    flush(() => {
      act(() => result.current.handleStyleChange("color", "#0f0"));
    });
    const mq = getBreakpointQuery("mobile");
    expect(composer.styles.setRule).toHaveBeenCalledWith(
      '[data-buildrick-id="el1"]',
      { color: "#0f0" },
      { pseudo: ":hover", mediaQuery: mq }
    );
    expect(composer.styles.setRule).toHaveBeenCalledWith(
      '[data-buildrick-id="el2"]',
      { color: "#0f0" },
      { pseudo: ":hover", mediaQuery: mq }
    );
  });
});
