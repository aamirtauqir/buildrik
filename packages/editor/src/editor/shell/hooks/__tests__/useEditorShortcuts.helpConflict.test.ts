/**
 * useEditorShortcuts.helpConflict.test.ts — ONE owner per help chord, ONE
 * palette (decisions #37 / #38, 2026-09-22).
 *
 * Before: the shell's ⌘/ panel and the canvas `?` cheat sheet each bound
 * their own window listener, and preventDefault does not stop a sibling
 * listener — so a chord claimed twice opened two overlays. Now `?` and ⌘/
 * both flip the one sheet state from this hook, ⌘⇧P (the retired canvas
 * palette's chord) emits the one palette's toggle event, and ⌘P — which the
 * plan's decision #38 read as "the page palette chord" — is and was the
 * Preview toggle (printed on the ⌘K Preview row and the Figma legend
 * 4418:126882); it opens no palette.
 *
 * @license BSD-3-Clause
 */

import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EVENTS } from "../../../../shared/constants/events";
import {
  useEditorShortcuts,
  type UseEditorShortcutsOptions,
} from "../useEditorShortcuts";

function dispatch(key: string, init: KeyboardEventInit = {}, target: EventTarget = window) {
  const event = new KeyboardEvent("keydown", {
    key,
    cancelable: true,
    bubbles: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

const composer = () =>
  ({ history: { undo: vi.fn(), redo: vi.fn() }, emit: vi.fn() }) as unknown as NonNullable<
    UseEditorShortcutsOptions["composer"]
  >;

function mount(c = composer()) {
  const setShowShortcuts = vi.fn();
  renderHook(() =>
    useEditorShortcuts({
      composer: c,
      modals: { setShowShortcuts },
      saveProject: vi.fn(),
    }),
  );
  return { setShowShortcuts, c };
}

describe("one owner per help chord", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("'?' opens the one sheet", () => {
    const { setShowShortcuts } = mount();
    const ev = dispatch("?", { shiftKey: true });
    expect(setShowShortcuts).toHaveBeenCalledWith(true);
    expect(ev.defaultPrevented).toBe(true);
  });

  it("⌘/ opens the same sheet", () => {
    const { setShowShortcuts } = mount();
    dispatch("/", { metaKey: true });
    expect(setShowShortcuts).toHaveBeenCalledWith(true);
  });

  it("'?' typed into a text field is the user's, not the sheet's", () => {
    const { setShowShortcuts } = mount();
    const input = document.createElement("input");
    document.body.appendChild(input);
    try {
      dispatch("?", { shiftKey: true }, input);
      expect(setShowShortcuts).not.toHaveBeenCalled();
    } finally {
      input.remove();
    }
  });

  it("preventDefault does not shield later listeners — which is why one hook may claim a chord", () => {
    const { setShowShortcuts } = mount();
    const secondListener = vi.fn();
    window.addEventListener("keydown", secondListener);
    const ev = dispatch("/", { metaKey: true });
    window.removeEventListener("keydown", secondListener);

    expect(setShowShortcuts).toHaveBeenCalledWith(true);
    expect(ev.defaultPrevented).toBe(true);
    expect(secondListener).toHaveBeenCalledTimes(1);
  });
});

describe("one palette", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("⌘⇧P is an alias of ⌘K — it emits the palette toggle and nothing else", () => {
    const { c, setShowShortcuts } = mount();
    const ev = dispatch("p", { metaKey: true, shiftKey: true });
    expect(c.emit).toHaveBeenCalledTimes(1);
    expect(c.emit).toHaveBeenCalledWith(EVENTS.UI_TOGGLE_COMMAND_PALETTE, {});
    expect(ev.defaultPrevented).toBe(true);
    expect(setShowShortcuts).not.toHaveBeenCalled();
  });

  it("⌘P opens no palette: it is the Preview toggle, as the ⌘K row and the legend print", () => {
    const { c, setShowShortcuts } = mount();
    const ev = dispatch("p", { metaKey: true });
    expect(c.emit).toHaveBeenCalledTimes(1);
    expect(c.emit).toHaveBeenCalledWith(EVENTS.UI_TOGGLE_PREVIEW, {});
    expect(c.emit).not.toHaveBeenCalledWith(EVENTS.UI_TOGGLE_COMMAND_PALETTE, expect.anything());
    expect(setShowShortcuts).not.toHaveBeenCalled();
    // The browser's print dialog must not open over the editor.
    expect(ev.defaultPrevented).toBe(true);
  });

  it("⌘K is not this hook's — StudioHeader owns it", () => {
    const { c, setShowShortcuts } = mount();
    const ev = dispatch("k", { metaKey: true });
    expect(c.emit).not.toHaveBeenCalled();
    expect(setShowShortcuts).not.toHaveBeenCalled();
    expect(ev.defaultPrevented).toBe(false);
  });
});
