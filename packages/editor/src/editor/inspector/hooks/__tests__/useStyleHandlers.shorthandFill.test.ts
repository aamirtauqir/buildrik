/**
 * L2-011 (editor audit 2026-10-08): a button coloured through the
 * `background` shorthand showed the TYPE default blue in Fill — the default
 * `background-color` stayed in the panel's styles and BackgroundSection
 * prefers it over the shorthand's colour.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useStyleHandlers } from "../useStyleHandlers";
import { getDefaultStyles } from "@/shared/constants/defaultStyles";

function composerWith(styles: Record<string, string>) {
  const element = { getId: () => "b1", getStyles: vi.fn(() => styles), setStyle: vi.fn(), removeStyle: vi.fn() };
  return {
    elements: { getElement: vi.fn(() => element) },
    styles: { getBreakpointStyle: vi.fn(() => ({})), getRule: vi.fn(() => undefined) },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
  };
}

describe("useStyleHandlers — background shorthand", () => {
  it("the type-default background-color does not mask an authored background", () => {
    expect(getDefaultStyles("button")["background-color"]).toBeTruthy();
    const composer = composerWith({ background: "rgba(255, 255, 255, 0.06)" });
    const sel = { id: "b1", type: "button" };
    const { result } = renderHook(() => useStyleHandlers(sel as never, composer as never, "desktop", "normal"));
    expect(result.current.styles["background-color"]).toBeUndefined();
    expect(result.current.styles.background).toBe("rgba(255, 255, 255, 0.06)");
  });

  it("an authored background-color still wins", () => {
    const composer = composerWith({ "background-color": "#15803D" });
    const sel = { id: "b1", type: "button" };
    const { result } = renderHook(() => useStyleHandlers(sel as never, composer as never, "desktop", "normal"));
    expect(result.current.styles["background-color"]).toBe("#15803D");
  });
});
