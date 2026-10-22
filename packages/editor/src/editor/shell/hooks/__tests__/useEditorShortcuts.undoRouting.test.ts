/**
 * ⌘Z / ⇧⌘Z routing (design-2l9 Task 1.2, the editor's one undo).
 *
 * A keystroke typed into a field belongs to that field: the browser's own
 * undo runs there and the composer is not touched (no preventDefault, no
 * history call). Everywhere else ⌘Z is the composer's undo — the same one the
 * topbar's History group drives. Canvas inline text editing is a
 * contenteditable too, so ⌘Z inside an edit undoes typing; the edit becomes
 * one composer step when it commits (useCanvasInlineEdit's transaction).
 *
 * @license BSD-3-Clause
 */

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEditorShortcuts, type UseEditorShortcutsOptions } from "../useEditorShortcuts";

function makeComposer() {
  return { history: { undo: vi.fn(), redo: vi.fn() }, emit: vi.fn() };
}

function press(target: HTMLElement, key: string, shiftKey = false) {
  const event = new KeyboardEvent("keydown", { key, metaKey: true, shiftKey, cancelable: true, bubbles: true });
  target.dispatchEvent(event);
  return event;
}

describe("useEditorShortcuts › ⌘Z/⇧⌘Z go to native field undo when focus is in an editable field (input, textarea, contenteditable outside the canvas), and to composer undo otherwise", () => {
  let composer: ReturnType<typeof makeComposer>;
  let host: HTMLDivElement;

  beforeEach(() => {
    composer = makeComposer();
    host = document.createElement("div");
    document.body.appendChild(host);
    renderHook(() =>
      useEditorShortcuts({
        composer: composer as unknown as UseEditorShortcutsOptions["composer"],
        modals: { setShowShortcuts: vi.fn() },
        saveProject: vi.fn(),
      }),
    );
  });

  afterEach(() => {
    host.remove();
    vi.clearAllMocks();
  });

  const field = (html: string) => {
    host.innerHTML = html;
    return host.firstElementChild as HTMLElement;
  };

  it.each([
    ["an <input>", '<input type="text" />'],
    ["a <textarea>", "<textarea></textarea>"],
    ["a contenteditable outside the canvas", '<div contenteditable="true">note</div>'],
  ])("%s keeps ⌘Z and ⇧⌘Z for the browser", (_name, html) => {
    const el = field(html);
    const undo = press(el, "z");
    const redo = press(el, "z", true);
    expect(composer.history.undo).not.toHaveBeenCalled();
    expect(composer.history.redo).not.toHaveBeenCalled();
    expect(undo.defaultPrevented).toBe(false);
    expect(redo.defaultPrevented).toBe(false);
  });

  it("anywhere else ⌘Z / ⇧⌘Z drive the composer and take the chord from the browser", () => {
    const el = field('<div tabindex="0">panel</div>');
    const undo = press(el, "z");
    const redo = press(el, "z", true);
    expect(composer.history.undo).toHaveBeenCalledTimes(1);
    expect(composer.history.redo).toHaveBeenCalledTimes(1);
    expect(undo.defaultPrevented).toBe(true);
    expect(redo.defaultPrevented).toBe(true);
  });

  it("while canvas inline text editing is active, ⌘Z goes to native undo inside the edit", () => {
    const canvas = field('<div class="buildrick-canvas"><p data-buildrick-id="el-1" contenteditable="true">Hello</p></div>');
    const p = canvas.querySelector("p") as HTMLElement;
    const event = press(p, "z");
    expect(composer.history.undo).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});
