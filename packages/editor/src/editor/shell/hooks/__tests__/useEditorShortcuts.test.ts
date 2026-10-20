/**
 * useEditorShortcuts.test.ts — covers every keyboard branch + the
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
    emit: vi.fn(),
  };
}

function makeModals(): ShortcutModals {
  return {
    setShowShortcuts: vi.fn(),
  };
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

  function mount(overrides: Partial<UseEditorShortcutsOptions> = {}) {
    return renderHook(() =>
      useEditorShortcuts({
        composer: (composer as unknown) as UseEditorShortcutsOptions["composer"],
        modals,
        ...overrides,
      } as UseEditorShortcutsOptions),
    );
  }

  beforeEach(() => {
    composer = makeComposer();
    modals = makeModals();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // SAVE -----------------------------------------------------------------------
  /* BK-11: ⌘S belongs to the command registry's `save` alone (it reaches the
     shell's save through composer.saveProject). This hook handling it as well
     sent two saves per press. */
  it("Cmd+S is not handled here — the registry owns it", () => {
    mount();
    const ev = dispatchKey({ key: "s", metaKey: true });
    expect(ev.defaultPrevented).toBe(false);
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

  it("history shortcuts are no-ops without composer", () => {
    mount({ composer: null });
    dispatchKey({ key: "z", metaKey: true });
    dispatchKey({ key: "y", metaKey: true });
    expect(composer.history.undo).not.toHaveBeenCalled();
    expect(composer.history.redo).not.toHaveBeenCalled();
  });

  // SITE-MENU CHORDS -----------------------------------------------------------
  // T9: the site menu prints these on its rows, so a row and its chord have to
  // land on the same handler. ⌃, exists because macOS browsers eat ⌘,.
  it("Ctrl+, opens site settings — the same door as the menu row", () => {
    const openSiteSettings = vi.fn();
    const openLeftPanelToTab = vi.fn();
    mount({ openSiteSettings, openLeftPanelToTab });
    const ev = dispatchKey({ key: ",", ctrlKey: true });
    expect(openSiteSettings).toHaveBeenCalledTimes(1);
    expect(ev.defaultPrevented).toBe(true);
    // Regression: it used to open the left panel's settings tab instead.
    expect(openLeftPanelToTab).not.toHaveBeenCalled();
  });

  it("Cmd+, does the same, for platforms whose browser lets it through", () => {
    const openSiteSettings = vi.fn();
    mount({ openSiteSettings });
    dispatchKey({ key: ",", metaKey: true });
    expect(openSiteSettings).toHaveBeenCalledTimes(1);
  });

  it("a bare comma types a comma — no modifier, no navigation", () => {
    const openSiteSettings = vi.fn();
    mount({ openSiteSettings });
    dispatchKey({ key: "," });
    expect(openSiteSettings).not.toHaveBeenCalled();
  });

  it("Ctrl+H opens version history", () => {
    const openLeftPanelToTab = vi.fn();
    mount({ openLeftPanelToTab });
    dispatchKey({ key: "h", ctrlKey: true });
    expect(openLeftPanelToTab).toHaveBeenCalledWith("history");
  });

  // FB-1: Shift+A used to be bound here too, racing GROUPED_TABS_CONFIG's own
  // "⇧A" binding in useSidebarKeyboard.ts for the same "components"
  // destination — two listeners, one chord. useSidebarKeyboard.ts is the one
  // table now (useSidebarKeyboard.ai.test.ts covers ⇧A there); this hook
  // must stay silent on it.
  it("Shift+A is not bound here — useSidebarKeyboard.ts owns it", () => {
    const openLeftPanelToTab = vi.fn();
    mount({ openLeftPanelToTab });
    dispatchKey({ key: "A", shiftKey: true });
    expect(openLeftPanelToTab).not.toHaveBeenCalled();
  });

  // MODALS ---------------------------------------------------------------------
  it("Cmd+/ opens shortcuts modal", () => {
    mount();
    dispatchKey({ key: "/", metaKey: true });
    expect(modals.setShowShortcuts).toHaveBeenCalledWith(true);
  });

  it("'?' opens the one keyboard sheet — bare only, never with a modifier", () => {
    mount();
    dispatchKey({ key: "?", metaKey: true });
    dispatchKey({ key: "?", ctrlKey: true });
    expect(modals.setShowShortcuts).not.toHaveBeenCalled();
    dispatchKey({ key: "?" });
    expect(modals.setShowShortcuts).toHaveBeenCalledWith(true);
  });

  it("Cmd+K is NOT handled here (Topbar owns it — avoids double palette)", () => {
    mount();
    const ev = dispatchKey({ key: "k", metaKey: true });
    // This hook must not consume Cmd+K; Topbar's listener does.
    expect(ev.defaultPrevented).toBe(false);
  });

  it("Escape closes the shortcuts modal", () => {
    mount();
    dispatchKey({ key: "Escape" });
    expect(modals.setShowShortcuts).toHaveBeenCalledWith(false);
  });

  // EDITABLE-SURFACE GUARD -----------------------------------------------------
  it("does not fire when target is an <input>", () => {
    mount();
    const input = document.createElement("input");
    document.body.appendChild(input);
    dispatchKey({ key: "s", metaKey: true, target: input });
    dispatchKey({ key: "z", metaKey: true, target: input });
    dispatchKey({ key: "/", metaKey: true, target: input });
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

  // MODAL GUARD (investigate 2026-07-30) ---------------------------------------
  // Live-reproduced: with the shortcuts modal open, plain C mounted the comment
  // layer BEHIND the dialog. An open aria-modal dialog owns the keyboard — every
  // global shortcut stands down, including ⌘S and undo.
  it("an open modal silences every shortcut", () => {
    mount();
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    document.body.appendChild(dialog);
    try {
      dispatchKey({ key: "c" });
      dispatchKey({ key: "s", metaKey: true });
      dispatchKey({ key: "z", metaKey: true });
      expect(composer.emit).not.toHaveBeenCalled();
      expect(composer.history.undo).not.toHaveBeenCalled();
    } finally {
      dialog.remove();
    }
  });

  // CLEANUP --------------------------------------------------------------------
  it("removes the keydown listener on unmount", () => {
    const { unmount } = mount();
    unmount();
    dispatchKey({ key: "s", metaKey: true });
    dispatchKey({ key: "z", metaKey: true });
    expect(composer.history.undo).not.toHaveBeenCalled();
  });

  /* ⌘P was printed as "Preview" in the ⌘K palette AND in the keyboard
     shortcuts panel, and bound nowhere — so it reached the browser and opened
     the PRINT dialog over the editor. Measured live before the fix: no
     preview event, no preview surface. */
  describe("Cmd+P — preview", () => {
    it("asks the shell to toggle preview", () => {
      mount();
      dispatchKey({ key: "p", metaKey: true });
      expect(composer.emit).toHaveBeenCalledWith("ui:toggle:preview", {});
    });

    it("takes the chord away from the browser's print dialog", () => {
      mount();
      const event = dispatchKey({ key: "p", metaKey: true });
      expect(event.defaultPrevented).toBe(true);
    });

    it("leaves ⌘⇧P alone — that is the command palette", () => {
      mount();
      dispatchKey({ key: "p", metaKey: true, shiftKey: true });
      expect(composer.emit).not.toHaveBeenCalledWith("ui:toggle:preview", {});
    });

    it("does not fire while typing", () => {
      mount();
      const input = document.createElement("input");
      document.body.appendChild(input);
      dispatchKey({ key: "p", metaKey: true, target: input });
      expect(composer.emit).not.toHaveBeenCalledWith("ui:toggle:preview", {});
      input.remove();
    });
  });

  describe("C — comment mode (A-8/PD-7/PD-8: gated on reviewsEnabled)", () => {
    it("toggles comment mode when reviewsEnabled is unset (default true)", () => {
      mount();
      dispatchKey({ key: "c" });
      expect(composer.emit).toHaveBeenCalledWith("ui:comment-mode", {});
    });

    it("toggles comment mode when reviewsEnabled is explicitly true", () => {
      mount({ reviewsEnabled: true });
      dispatchKey({ key: "c" });
      expect(composer.emit).toHaveBeenCalledWith("ui:comment-mode", {});
    });

    it("does nothing when reviewsEnabled is false — comment mode is a review-flow tool with nowhere to review from", () => {
      mount({ reviewsEnabled: false });
      const ev = dispatchKey({ key: "c" });
      expect(composer.emit).not.toHaveBeenCalledWith("ui:comment-mode", {});
      expect(ev.defaultPrevented).toBe(false);
    });
  });
});

/* BK-05 / D36: ⌘Z and ⌘⇧Z obey the mutating-command gates. */
describe("useEditorShortcuts — undo gates (BK-05, D36)", () => {
  const surfaceHost = (attrs: Record<string, string>) => {
    const el = document.createElement("div");
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    document.body.appendChild(el);
    return el;
  };
  const make = (extra: Record<string, unknown> = {}) => ({
    history: { undo: vi.fn(), redo: vi.fn(), nextUndoTouchesOnly: vi.fn(() => false) },
    emit: vi.fn(),
    ...extra,
  });
  const mountWith = (c: ReturnType<typeof make>) =>
    renderHook(() =>
      useEditorShortcuts({
        composer: c as unknown as UseEditorShortcutsOptions["composer"],
        modals: { setShowShortcuts: vi.fn() },
      } as UseEditorShortcutsOptions),
    );

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("does nothing while read-only (view mode, time-travel)", () => {
    const c = make({ readOnly: true });
    const { unmount } = mountWith(c);
    dispatchKey({ key: "z", metaKey: true });
    dispatchKey({ key: "z", metaKey: true, shiftKey: true });
    expect(c.history.undo).not.toHaveBeenCalled();
    expect(c.history.redo).not.toHaveBeenCalled();
    unmount();
  });

  it("does nothing behind a full-page surface (Settings, Templates, Assets)", () => {
    surfaceHost({ "data-bk-surface": "fullpage" });
    const c = make();
    const { unmount } = mountWith(c);
    dispatchKey({ key: "z", metaKey: true });
    expect(c.history.undo).not.toHaveBeenCalled();
    unmount();
  });

  it("in Brand, undoes a token edit", () => {
    surfaceHost({ "data-bk-surface": "fullpage", "data-bk-history": "tokens" });
    const c = make();
    c.history.nextUndoTouchesOnly.mockReturnValue(true);
    const { unmount } = mountWith(c);
    dispatchKey({ key: "z", metaKey: true });
    expect(c.history.undo).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("in Brand, leaves a canvas edit alone and says so", () => {
    surfaceHost({ "data-bk-surface": "fullpage", "data-bk-history": "tokens" });
    const c = make();
    const { unmount } = mountWith(c);
    dispatchKey({ key: "z", metaKey: true });
    expect(c.history.undo).not.toHaveBeenCalled();
    expect(c.emit).toHaveBeenCalledWith("history:undo-out-of-scope", undefined);
    unmount();
  });
});
