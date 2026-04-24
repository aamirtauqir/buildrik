import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStyleHandlers } from "../useStyleHandlers";
import { getBreakpointQuery } from "../../../../shared/constants/breakpoints";

function makeMockComposer() {
  const rules = new Map<string, { properties: Record<string, string>; mediaQuery?: string; pseudo?: string }>();
  const key = (sel: string, mq?: string) => `${mq ?? ""}::${sel}`;
  return {
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    elements: {
      getElement: vi.fn(() => ({ getId: () => "el1", getStyles: () => ({}), setStyle: vi.fn(), removeStyle: vi.fn() })),
    },
    styles: {
      getRule: vi.fn((sel: string, mq?: string) => rules.get(key(sel, mq))),
      setRule: vi.fn((sel: string, props: Record<string, string>, opts?: { mediaQuery?: string; pseudo?: string }) => {
        const full = opts?.pseudo ? `${sel}${opts.pseudo}` : sel;
        rules.set(key(full, opts?.mediaQuery), { properties: props, mediaQuery: opts?.mediaQuery, pseudo: opts?.pseudo });
        return rules.get(key(full, opts?.mediaQuery));
      }),
      getBreakpointStyle: vi.fn(() => ({})),
      setBreakpointStyle: vi.fn(),
      removeBreakpointStyleProperty: vi.fn(),
    },
    _rules: rules,
  } as any;
}

describe("useStyleHandlers responsive pseudo integrity", () => {
  const selEl = { id: "el1", type: "box" };

  it("writes mobile :hover under mobile mediaQuery, not desktop", () => {
    vi.useFakeTimers();
    const composer = makeMockComposer();
    const { result } = renderHook(() =>
      useStyleHandlers(selEl, composer, "mobile", "hover")
    );
    act(() => { result.current.handleStyleChange("color", "#f00"); });
    act(() => { vi.advanceTimersByTime(310); });
    vi.useRealTimers();

    const mobileQ = getBreakpointQuery("mobile");
    const call = composer.styles.setRule.mock.calls.find(
      (args: any[]) => args[2]?.mediaQuery === mobileQ && args[2]?.pseudo === ":hover"
    );
    expect(call).toBeTruthy();
  });

  it("reads mobile :hover with mobile mediaQuery", () => {
    const composer = makeMockComposer();
    const mobileQ = getBreakpointQuery("mobile");
    composer.styles.setRule('[data-buildrick-id="el1"]', { color: "#0f0" }, { mediaQuery: mobileQ, pseudo: ":hover" });
    renderHook(() => useStyleHandlers(selEl, composer, "mobile", "hover"));
    expect(composer.styles.getRule).toHaveBeenCalledWith('[data-buildrick-id="el1"]:hover', mobileQ);
  });
});
