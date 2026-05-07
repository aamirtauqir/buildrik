/**
 * useEditorShortcuts.test.ts — covers all 8 keyboard branches + the
 * editable-surface guard + cleanup-on-unmount.
 *
 * @license BSD-3-Clause
 */

import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useEditorShortcuts,
  type ShortcutModals,
  type UseEditorShortcutsOptions,
} from "../useEditorShortcuts";

// Mock surfaces ----------------------------------------------------------------
function makeComposer() {
  return {
    history: {
      undo: vi.fn(),
      redo: vi.fn(),
    },
  };
}

function makeModals(): ShortcutModals & {
  showAI: boolean;
} {
  return {
    showAI: false,
    setShowShortcuts: vi.fn(),
    setShowAI: vi.fn(),
  };
}

function makeCanvasRef() {
  return {
    current: {
      openCommandPalette: vi.fn(),
    },
  } as unknown as UseEditorShortcutsOptions["canvasRef"];
}

function dispatchKey(opts: {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  target?: EventTarget;
}) {
  const event = new KeyboardEvent("keydown", {
    key: opts.key,
    ctrlKey: opts.ctrlKey ?? false,
    metaKey: opts.metaKey ?? false,
    shiftKey: opts.shiftKey ?? false,
    cancelable: true,
    bubbles: true,
  });
  if (opts.target) {
    Object.defineProperty(event, "target", { value: opts.target, writable: false });
  }
  window.dispatchEvent(event);
  return event;
}

describe("useEditorShortcuts", () => {
  let composer: ReturnType<typeof makeComposer>;
  let modals: ReturnType<typeof makeModals>;
  let canvasRef: ReturnType<typeof makeCanvasRef>;
  let saveProject: ReturnType<typeof vi.fn>;

  function mount(overrides: Partial<UseEditorShortcutsOptions> = {}) {
    return renderHook(() =>
      useEditorShortcuts({
        composer: (composer as unknown) as UseEditorShortcutsOptions["composer"],
        canvasRef,
        modals,
        saveProject,
        ...overrides,
      } as UseEditorShortcutsOptions),
    );
  }

  beforeEach(() => {
    composer = makeComposer();
    modals = makeModals();
    canvasRef = makeCanvasRef();
    saveProject = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // SAVE -----------------------------------------------------------------------
  it("Cmd+S triggers saveProject + preventDefault", () => {
    mount();
    const ev = dispatchKey({ key: "s", metaKey: true });
    expect(saveProject).toHaveBeenCalledTimes(1);
    expect(ev.defaultPrevented).toBe(true);
  });

  it("Ctrl+S also triggers saveProject", () => {
    mount();
    dispatchKey({ key: "s", ctrlKey: true });
    expect(saveProject).toHaveBeenCalledTimes(1);
  });

  it("plain 's' does not trigger save", () => {
    mount();
    dispatchKey({ key: "s" });
    expect(saveProject).not.toHaveBeenCalled();
  });

  // UNDO / REDO ----------------------------------------------------------------
  it("Cmd+Z calls composer.history.undo()", () => {
    mount();
    dispatchKey({ key: "z", metaKey: true });
    expect(composer.history.undo).toHaveBeenCalledTimes(1);
    expect(composer.history.redo).not.toHaveBeenCalled();
  });

  it("Cmd+Shift+Z calls redo()", () => {
    mount();
    dispatchKey({ key: "z", metaKey: true, shiftKey: true });
    expect(composer.history.redo).toHaveBeenCalledTimes(1);
    expect(composer.history.undo).not.toHaveBeenCalled();
  });

  it("Cmd+Y also calls redo()", () => {
    mount();
    dispatchKey({ key: "y", metaKey: true });
    expect(composer.history.redo).toHaveBeenCalledTimes(1);
  });

  it("history shortcuts are no-ops without composer (but Cmd+S still fires)", () => {
    mount({ composer: null });
    dispatchKey({ key: "z", metaKey: true });
    dispatchKey({ key: "y", metaKey: true });
    dispatchKey({ key: "s", metaKey: true });
    expect(composer.history.undo).not.toHaveBeenCalled();
    expect(composer.history.redo).not.toHaveBeenCalled();
    expect(saveProject).toHaveBeenCalledTimes(1);
  });

  // MODALS ---------------------------------------------------------------------
  it("Cmd+/ opens shortcuts modal", () => {
    mount();
    dispatchKey({ key: "/", metaKey: true });
    expect(modals.setShowShortcuts).toHaveBeenCalledWith(true);
  });

  it("'?' (no modifier) opens shortcuts modal", () => {
    mount();
    dispatchKey({ key: "?" });
    expect(modals.setShowShortcuts).toHaveBeenCalledWith(true);
  });

  it("'?' WITH ctrl/meta does NOT open shortcuts (avoids browser shortcut conflicts)", () => {
    mount();
    dispatchKey({ key: "?", metaKey: true });
    dispatchKey({ key: "?", ctrlKey: true });
    expect(modals.setShowShortcuts).not.toHaveBeenCalled();
  });

  it("Cmd+K opens command palette via canvasRef", () => {
    mount();
    dispatchKey({ key: "k", metaKey: true });
    const palette = (canvasRef.current as unknown as {
      openCommandPalette: ReturnType<typeof vi.fn>;
    }).openCommandPalette;
    expect(palette).toHaveBeenCalledTimes(1);
  });

  it("Cmd+K is safe when canvasRef.current is null", () => {
    canvasRef = { current: null } as unknown as UseEditorShortcutsOptions["canvasRef"];
    mount();
    expect(() => dispatchKey({ key: "k", metaKey: true })).not.toThrow();
  });

  it("Cmd+J toggles AI modal (setter receives a function)", () => {
    mount();
    dispatchKey({ key: "j", metaKey: true });
    const setShowAI = modals.setShowAI as unknown as ReturnType<typeof vi.fn>;
    expect(setShowAI).toHaveBeenCalledTimes(1);
    const updater = setShowAI.mock.calls[0][0] as (prev: boolean) => boolean;
    // updater is a (prev: boolean) => boolean — verify toggle semantics
    expect(typeof updater).toBe("function");
    expect(updater(false)).toBe(true);
    expect(updater(true)).toBe(false);
  });

  it("Escape closes both shortcuts and AI modals", () => {
    mount();
    dispatchKey({ key: "Escape" });
    expect(modals.setShowShortcuts).toHaveBeenCalledWith(false);
    expect(modals.setShowAI).toHaveBeenCalledWith(false);
  });

  // EDITABLE-SURFACE GUARD -----------------------------------------------------
  it("does not fire when target is an <input>", () => {
    mount();
    const input = document.createElement("input");
    document.body.appendChild(input);
    dispatchKey({ key: "s", metaKey: true, target: input });
    dispatchKey({ key: "z", metaKey: true, target: input });
    dispatchKey({ key: "?", target: input });
    expect(saveProject).not.toHaveBeenCalled();
    expect(composer.history.undo).not.toHaveBeenCalled();
    expect(modals.setShowShortcuts).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("does not fire when target is contenteditable", () => {
    mount();
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    document.body.appendChild(div);
    dispatchKey({ key: "s", metaKey: true, target: div });
    expect(saveProject).not.toHaveBeenCalled();
    document.body.removeChild(div);
  });

  it("does not fire when target is a <textarea>", () => {
    mount();
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    dispatchKey({ key: "z", metaKey: true, target: ta });
    expect(composer.history.undo).not.toHaveBeenCalled();
    document.body.removeChild(ta);
  });

  // CLEANUP --------------------------------------------------------------------
  it("removes the keydown listener on unmount", () => {
    const { unmount } = mount();
    unmount();
    dispatchKey({ key: "s", metaKey: true });
    dispatchKey({ key: "z", metaKey: true });
    expect(saveProject).not.toHaveBeenCalled();
    expect(composer.history.undo).not.toHaveBeenCalled();
  });
});
