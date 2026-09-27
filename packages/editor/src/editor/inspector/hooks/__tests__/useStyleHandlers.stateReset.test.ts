/**
 * P-9 — resetting a field under a pseudo state (:hover) removes it.
 *
 * The removal paths read the :hover rule, deleted the key from a copy and
 * wrote the copy back through StyleEngine.setRule — which MERGED it into the
 * existing rule, so the key the copy no longer had simply survived. Reset
 * under :hover did nothing, for the single inspector, its batch writer, and
 * the multi-select writer alike.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStyleHandlers } from "../useStyleHandlers";
import { useBatchStyleHandler } from "../useBatchStyleHandler";
import { getBreakpointQuery } from "@/shared/constants/breakpoints";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function setup(mediaQuery?: string) {
  const composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const heading = composer.elements.createElement("heading", { content: "Title" });
  composer.elements.addElement(heading, page.root.id);
  const id = heading.getId();
  composer.styles.setRule(
    `[data-buildrick-id="${id}"]`,
    { color: "rgb(255, 0, 0)", "font-size": "40px" },
    { pseudo: ":hover", mediaQuery },
  );
  /* One object per test: the hook keys its load effect on selection identity. */
  const sel = { id, type: "heading" };
  const ids = [id];
  const hoverRule = () => composer.styles.getRule(`[data-buildrick-id="${id}"]:hover`, mediaQuery)?.properties;
  return { composer, sel, ids, hoverRule };
}

function flushDebounce(fn: () => void) {
  vi.useFakeTimers();
  try {
    fn();
    act(() => {
      vi.advanceTimersByTime(310);
    });
  } finally {
    vi.useRealTimers();
  }
}

describe("P-9a — reset under :hover", () => {
  it("single field reset removes the key from the :hover rule", () => {
    const { composer, sel, hoverRule } = setup();
    const { result } = renderHook(() => useStyleHandlers(sel, composer, "desktop", "hover"));
    flushDebounce(() => act(() => result.current.handleStyleChange("color", "")));
    expect(hoverRule()).toEqual({ "font-size": "40px" });
  });

  it("single field reset under :hover on Tablet removes the key from the tablet :hover rule", () => {
    const { composer, sel, hoverRule } = setup(getBreakpointQuery("tablet") ?? undefined);
    const { result } = renderHook(() => useStyleHandlers(sel, composer, "tablet", "hover"));
    flushDebounce(() => act(() => result.current.handleStyleChange("color", "")));
    expect(hoverRule()).toEqual({ "font-size": "40px" });
  });

  it("batch reset removes the keys from the :hover rule", () => {
    const { composer, sel, hoverRule } = setup();
    const { result } = renderHook(() => useStyleHandlers(sel, composer, "desktop", "hover"));
    act(() => result.current.handleBatchStyleChange({ color: "", "font-size": "12px" }));
    expect(hoverRule()).toEqual({ "font-size": "12px" });
  });

  it("multi-select reset removes the key from each :hover rule", () => {
    const { composer, ids, hoverRule } = setup();
    const { result } = renderHook(() => useBatchStyleHandler(composer, ids, "desktop", "hover"));
    act(() => result.current.handleBatchStyleChange({ color: "" }));
    expect(hoverRule()).toEqual({ "font-size": "40px" });
  });

  it("setting a value under :hover still keeps the rule's other keys", () => {
    const { composer, sel, hoverRule } = setup();
    const { result } = renderHook(() => useStyleHandlers(sel, composer, "desktop", "hover"));
    flushDebounce(() => act(() => result.current.handleStyleChange("color", "rgb(0, 0, 255)")));
    expect(hoverRule()).toEqual({ color: "rgb(0, 0, 255)", "font-size": "40px" });
  });
});
