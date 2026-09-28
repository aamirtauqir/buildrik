/**
 * P-8 — per-device Visibility is written where the canvas and export read it.
 *
 * Toggling "Tablet" in Settings › Visibility while the canvas was on Tablet
 * went through the breakpoint-aware writer and landed `--hide-tablet: true` in
 * the element's TABLET rule. The canvas hides on the element's inline style
 * (Canvas.css `[style*="--hide-tablet: true"]`) and the export reads the base
 * styles (ExportEngine hideRulesFor), so the element stayed visible in both.
 * A device-hide flag names its own device; it belongs on the base styles
 * whatever breakpoint or state is being edited.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { BreakpointId } from "@/shared/types/breakpoints";
import type { PseudoStateId } from "@/shared/types";
import { useStyleHandlers } from "../useStyleHandlers";
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

function setup() {
  const composer = createTestComposer();
  const page = composer.elements.createPage("Home");
  const heading = composer.elements.createElement("heading", { content: "Title" });
  composer.elements.addElement(heading, page.root.id);
  /* One object per test: the hook keys its load effect on selection identity. */
  const sel = { id: heading.getId(), type: "heading" };
  return { composer, id: heading.getId(), sel };
}

function change(bp: BreakpointId, pseudo: PseudoStateId, property: string, value: string) {
  const { composer, id, sel } = setup();
  const { result } = renderHook(() => useStyleHandlers(sel, composer, bp, pseudo));
  vi.useFakeTimers();
  try {
    act(() => result.current.handleStyleChange(property, value));
    act(() => {
      vi.advanceTimersByTime(310);
    });
  } finally {
    vi.useRealTimers();
  }
  return { composer, id, result };
}

describe("P-8 — device-hide flags always land on the base styles", () => {
  it("hiding on Tablet while editing Tablet writes the base style, not the tablet rule", () => {
    const { composer, id } = change("tablet", "normal", "--hide-tablet", "true");
    expect(composer.elements.getElement(id)!.getStyles()["--hide-tablet"]).toBe("true");
    expect(composer.styles.getBreakpointStyle(id, "tablet")["--hide-tablet"]).toBeUndefined();
  });

  it("hiding on Mobile while editing Mobile writes the base style", () => {
    const { composer, id } = change("mobile", "normal", "--hide-mobile", "true");
    expect(composer.elements.getElement(id)!.getStyles()["--hide-mobile"]).toBe("true");
    expect(composer.styles.getBreakpointStyle(id, "mobile")["--hide-mobile"]).toBeUndefined();
  });

  it("hiding while a :hover state is selected still writes the base style", () => {
    const { composer, id } = change("desktop", "hover", "--hide-desktop", "true");
    expect(composer.elements.getElement(id)!.getStyles()["--hide-desktop"]).toBe("true");
    expect(composer.styles.getRule(`[data-buildrick-id="${id}"]:hover`)).toBeUndefined();
  });

  it("showing again on Tablet while editing Tablet clears the base flag", () => {
    const { composer, id, sel } = setup();
    composer.elements.getElement(id)!.setStyle("--hide-tablet", "true");
    const { result } = renderHook(() => useStyleHandlers(sel, composer, "tablet", "normal"));
    vi.useFakeTimers();
    try {
      act(() => result.current.handleStyleChange("--hide-tablet", ""));
      act(() => {
        vi.advanceTimersByTime(310);
      });
    } finally {
      vi.useRealTimers();
    }
    expect(composer.elements.getElement(id)!.getStyles()["--hide-tablet"]).toBeUndefined();
  });
});
