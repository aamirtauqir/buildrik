/**
 * P-1 — a locked element is read-only in the Inspector's write path.
 *
 * The Locked banner said "Locked" while every control under it still wrote:
 * useStyleHandlers had no lock check, so colour, size, a breakpoint override
 * or a :hover rule all landed on the locked element. Driven against a real
 * Composer so the lock is read where the engine keeps it.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
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
  const peer = composer.elements.createElement("heading", { content: "Peer" });
  composer.elements.addElement(heading, page.root.id);
  composer.elements.addElement(peer, page.root.id);
  heading.setStyle("color", "rgb(1, 1, 1)");
  heading.setLocked(true);
  /* One object per test: the hook keys its load effect on selection identity,
     so a fresh literal per render would re-run it forever. */
  const sel = { id: heading.getId(), type: "heading" };
  return { composer, id: heading.getId(), peerId: peer.getId(), sel };
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

describe("P-1 — useStyleHandlers refuses writes to a locked element", () => {
  it("a single-property change does not reach a locked element (desktop)", () => {
    const { composer, id, sel } = setup();
    const { result } = renderHook(() =>
      useStyleHandlers(sel, composer, "desktop", "normal"),
    );
    flushDebounce(() => act(() => result.current.handleStyleChange("color", "rgb(9, 9, 9)")));
    expect(composer.elements.getElement(id)!.getStyles().color).toBe("rgb(1, 1, 1)");
  });

  it("removing a property does not reach a locked element", () => {
    const { composer, id, sel } = setup();
    const { result } = renderHook(() =>
      useStyleHandlers(sel, composer, "desktop", "normal"),
    );
    flushDebounce(() => act(() => result.current.handleStyleChange("color", "")));
    expect(composer.elements.getElement(id)!.getStyles().color).toBe("rgb(1, 1, 1)");
  });

  it("a breakpoint override does not reach a locked element", () => {
    const { composer, id, sel } = setup();
    const { result } = renderHook(() =>
      useStyleHandlers(sel, composer, "tablet", "normal"),
    );
    flushDebounce(() => act(() => result.current.handleStyleChange("color", "rgb(9, 9, 9)")));
    expect(composer.styles.getBreakpointStyle(id, "tablet")).toEqual({});
  });

  it("a :hover rule does not reach a locked element", () => {
    const { composer, id, sel } = setup();
    const { result } = renderHook(() =>
      useStyleHandlers(sel, composer, "desktop", "hover"),
    );
    flushDebounce(() => act(() => result.current.handleStyleChange("color", "rgb(9, 9, 9)")));
    expect(composer.styles.getRule(`[data-buildrick-id="${id}"]:hover`)).toBeUndefined();
  });

  it("a batch change does not reach a locked element", () => {
    const { composer, id, sel } = setup();
    const { result } = renderHook(() =>
      useStyleHandlers(sel, composer, "desktop", "normal"),
    );
    act(() => result.current.handleBatchStyleChange({ color: "rgb(9, 9, 9)", "font-size": "40px" }));
    const styles = composer.elements.getElement(id)!.getStyles();
    expect(styles.color).toBe("rgb(1, 1, 1)");
    expect(styles["font-size"]).toBeUndefined();
  });

  it("an unlocked element still takes the edit", () => {
    const { composer, id, sel } = setup();
    composer.elements.getElement(id)!.setLocked(false);
    const { result } = renderHook(() =>
      useStyleHandlers(sel, composer, "desktop", "normal"),
    );
    flushDebounce(() => act(() => result.current.handleStyleChange("color", "rgb(9, 9, 9)")));
    expect(composer.elements.getElement(id)!.getStyles().color).toBe("rgb(9, 9, 9)");
  });

  it("an 'All like this' reach skips a locked peer but still edits the selected element", () => {
    const { composer, id, peerId, sel } = setup();
    composer.elements.getElement(id)!.setLocked(false);
    composer.elements.getElement(peerId)!.setLocked(true);
    const { result } = renderHook(() =>
      useStyleHandlers(sel, composer, "desktop", "normal", [peerId]),
    );
    flushDebounce(() => act(() => result.current.handleStyleChange("color", "rgb(9, 9, 9)")));
    expect(composer.elements.getElement(id)!.getStyles().color).toBe("rgb(9, 9, 9)");
    expect(composer.elements.getElement(peerId)!.getStyles().color).toBeUndefined();
  });
});
