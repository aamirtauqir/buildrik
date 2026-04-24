import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBatchStyleHandler } from "../useBatchStyleHandler";
import { getBreakpointQuery } from "../../../../shared/constants/breakpoints";

function makeComposer() {
  const elements = new Map<string, { getId: () => string; getStyles: () => any; setStyle: any; removeStyle: any }>();
  ["e1", "e2"].forEach((id) => {
    elements.set(id, { getId: () => id, getStyles: () => ({}), setStyle: vi.fn(), removeStyle: vi.fn() });
  });
  return {
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    elements: { getElement: (id: string) => elements.get(id) },
    styles: {
      setRule: vi.fn(),
      getRule: vi.fn(() => undefined),
      setBreakpointStyle: vi.fn(),
      removeBreakpointStyleProperty: vi.fn(),
      getBreakpointStyle: vi.fn(() => ({})),
    },
    _elements: elements,
  } as any;
}

describe("useBatchStyleHandler honors currentBreakpoint + currentPseudoState", () => {
  it("mobile base batch edit uses setBreakpointStyle, not el.setStyle", () => {
    const composer = makeComposer();
    const { result } = renderHook(() =>
      useBatchStyleHandler(composer, ["e1", "e2"], "mobile", "normal")
    );
    act(() => { result.current.handleBatchStyleChange({ color: "#f00" }); });
    expect(composer.styles.setBreakpointStyle).toHaveBeenCalledTimes(2);
    expect(composer.styles.setBreakpointStyle).toHaveBeenCalledWith("e1", "mobile", { color: "#f00" });
    expect(composer.styles.setBreakpointStyle).toHaveBeenCalledWith("e2", "mobile", { color: "#f00" });
    // base el.setStyle should NOT be called on any element
    composer._elements.forEach((el: any) => {
      expect(el.setStyle).not.toHaveBeenCalled();
    });
  });

  it("desktop :hover batch edit uses setRule with pseudo + no mediaQuery", () => {
    const composer = makeComposer();
    const { result } = renderHook(() =>
      useBatchStyleHandler(composer, ["e1"], "desktop", "hover")
    );
    act(() => { result.current.handleBatchStyleChange({ color: "#0f0" }); });
    expect(composer.styles.setRule).toHaveBeenCalledWith(
      '[data-buildrick-id="e1"]',
      expect.objectContaining({ color: "#0f0" }),
      expect.objectContaining({ pseudo: ":hover", mediaQuery: undefined })
    );
  });

  it("mobile :hover batch edit uses setRule with both pseudo + mobile mediaQuery", () => {
    const composer = makeComposer();
    const { result } = renderHook(() =>
      useBatchStyleHandler(composer, ["e1"], "mobile", "hover")
    );
    act(() => { result.current.handleBatchStyleChange({ color: "#00f" }); });
    const mobileQ = getBreakpointQuery("mobile");
    expect(composer.styles.setRule).toHaveBeenCalledWith(
      '[data-buildrick-id="e1"]',
      expect.objectContaining({ color: "#00f" }),
      expect.objectContaining({ pseudo: ":hover", mediaQuery: mobileQ })
    );
  });

  it("desktop base batch edit still uses el.setStyle (backwards compat)", () => {
    const composer = makeComposer();
    const { result } = renderHook(() =>
      useBatchStyleHandler(composer, ["e1", "e2"], "desktop", "normal")
    );
    act(() => { result.current.handleBatchStyleChange({ color: "#fff" }); });
    composer._elements.forEach((el: any) => {
      expect(el.setStyle).toHaveBeenCalledWith("color", "#fff");
    });
    expect(composer.styles.setBreakpointStyle).not.toHaveBeenCalled();
    expect(composer.styles.setRule).not.toHaveBeenCalled();
  });
});
