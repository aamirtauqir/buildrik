/**
 * useEditorShortcuts.helpConflict.test.ts — PIN §2-B5, resolved: bare "?" has
 * ONE owner.
 *
 * The editor ships two help surfaces on purpose — the shell's
 * KeyboardShortcutsPanel (app-wide chords) and the canvas cheat sheet
 * (gestures and selection) — and the shell panel prints the split itself:
 * "Ctrl+/ · This shortcuts panel", "? · Canvas gestures & selection".
 *
 * Both used to claim "?" from their own window keydown listener, and
 * preventDefault does not stop a sibling listener, so a single press opened
 * both overlays on top of each other. useEditorShortcuts no longer binds "?";
 * useKeyboardCheatSheet is its only owner, and Cmd/Ctrl+/ is the panel's.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useEditorShortcuts,
  type UseEditorShortcutsOptions,
} from "../useEditorShortcuts";
import { useKeyboardCheatSheet } from "../../../canvas/controls/KeyboardCheatSheet";

function dispatch(key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    cancelable: true,
    bubbles: true,
    ...init,
  });
  window.dispatchEvent(event);
  return event;
}

const composer = () =>
  ({ history: { undo: vi.fn(), redo: vi.fn() } }) as unknown as
    UseEditorShortcutsOptions["composer"];

describe("PIN §2-B5 — one owner per help chord", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("'?' opens the canvas cheat sheet and ONLY the canvas cheat sheet", () => {
    const setShowShortcuts = vi.fn();

    const { result } = renderHook(() => {
      useEditorShortcuts({
        composer: composer(),
        modals: { setShowShortcuts },
        saveProject: vi.fn(),
      });
      return useKeyboardCheatSheet();
    });

    expect(result.current.isOpen).toBe(false);
    act(() => {
      dispatch("?", { shiftKey: true });
    });

    expect(result.current.isOpen).toBe(true);
    expect(setShowShortcuts).not.toHaveBeenCalled();
  });

  it("Cmd+/ opens the shell panel and leaves the cheat sheet shut", () => {
    const setShowShortcuts = vi.fn();

    const { result } = renderHook(() => {
      useEditorShortcuts({
        composer: composer(),
        modals: { setShowShortcuts },
        saveProject: vi.fn(),
      });
      return useKeyboardCheatSheet();
    });

    act(() => {
      dispatch("/", { metaKey: true });
    });

    expect(setShowShortcuts).toHaveBeenCalledWith(true);
    expect(result.current.isOpen).toBe(false);
  });

  it("preventDefault does not shield later listeners — which is why one hook may claim a chord", () => {
    const setShowShortcuts = vi.fn();
    renderHook(() =>
      useEditorShortcuts({
        composer: composer(),
        modals: { setShowShortcuts },
        saveProject: vi.fn(),
      }),
    );

    // A stand-in for any second listener registered after the hook — it still
    // receives the event, and defaultPrevented is already true, but nothing
    // reads that flag. Propagation is not stopped, so two handlers on one key
    // means two surfaces.
    const secondListener = vi.fn();
    window.addEventListener("keydown", secondListener);
    const ev = dispatch("/", { metaKey: true });
    window.removeEventListener("keydown", secondListener);

    expect(setShowShortcuts).toHaveBeenCalledWith(true);
    expect(ev.defaultPrevented).toBe(true);
    expect(secondListener).toHaveBeenCalledTimes(1);
  });

  it("repeated '?' toggles the cheat sheet without ever reaching the shell panel", () => {
    const setShowShortcuts = vi.fn();
    const { result } = renderHook(() => {
      useEditorShortcuts({
        composer: composer(),
        modals: { setShowShortcuts },
        saveProject: vi.fn(),
      });
      return useKeyboardCheatSheet();
    });

    act(() => {
      dispatch("?", { shiftKey: true });
    });
    act(() => {
      dispatch("?", { shiftKey: true });
    });

    expect(result.current.isOpen).toBe(false);
    expect(setShowShortcuts).not.toHaveBeenCalled();
  });
});
