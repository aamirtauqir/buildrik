/**
 * useEditorShortcuts.helpConflict.test.ts — PIN §2-B5: the double
 * help-surface conflict on bare "?".
 *
 * Two independent window keydown listeners both claim the "?" key:
 *
 *   1. useEditorShortcuts (shell)  → modals.setShowShortcuts(true)
 *      (src/editor/shell/hooks/useEditorShortcuts.ts:88)
 *   2. useKeyboardCheatSheet (canvas) → toggles the canvas cheat sheet
 *      (src/editor/canvas/controls/KeyboardCheatSheet.tsx:369)
 *
 * Both call e.preventDefault(), but preventDefault does not stop other
 * keydown listeners — so a single "?" press opens BOTH the shell
 * KeyboardShortcutsPanel and the canvas KeyboardCheatSheet on top of
 * each other. These tests pin the current (conflicting) behavior; when
 * the conflict is resolved (one owner for "?"), the double-open pin
 * below MUST be updated.
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

function dispatchQuestionMark() {
  const event = new KeyboardEvent("keydown", {
    key: "?",
    shiftKey: true,
    cancelable: true,
    bubbles: true,
  });
  window.dispatchEvent(event);
  return event;
}

describe("PIN §2-B5 — '?' double help-surface conflict", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("one '?' press opens BOTH the shell shortcuts modal AND the canvas cheat sheet", () => {
    const setShowShortcuts = vi.fn();
    const modals = { setShowShortcuts, setShowAI: vi.fn() };
    const composer = { history: { undo: vi.fn(), redo: vi.fn() } };

    const { result } = renderHook(() => {
      useEditorShortcuts({
        composer: composer as unknown as UseEditorShortcutsOptions["composer"],
        modals,
        saveProject: vi.fn(),
      });
      return useKeyboardCheatSheet();
    });

    expect(result.current.isOpen).toBe(false);
    act(() => {
      dispatchQuestionMark();
    });

    // PIN §2-B5: both help surfaces respond to the same keypress today.
    expect(setShowShortcuts).toHaveBeenCalledWith(true); // shell modal opens
    expect(result.current.isOpen).toBe(true); // canvas cheat sheet ALSO opens
  });

  it("preventDefault from the shell handler does not shield later listeners", () => {
    const setShowShortcuts = vi.fn();
    renderHook(() =>
      useEditorShortcuts({
        composer: { history: { undo: vi.fn(), redo: vi.fn() } } as unknown as
          UseEditorShortcutsOptions["composer"],
        modals: { setShowShortcuts, setShowAI: vi.fn() },
        saveProject: vi.fn(),
      }),
    );

    // A stand-in for any second '?' listener registered after the hook —
    // it still receives the event, and defaultPrevented is already true,
    // but neither handler checks it.
    const secondListener = vi.fn();
    window.addEventListener("keydown", secondListener);
    const ev = dispatchQuestionMark();
    window.removeEventListener("keydown", secondListener);

    expect(setShowShortcuts).toHaveBeenCalledWith(true);
    expect(ev.defaultPrevented).toBe(true);
    expect(secondListener).toHaveBeenCalledTimes(1); // propagation NOT stopped
  });

  it("a second '?' press toggles the cheat sheet closed while the shell modal is told to open AGAIN", () => {
    const setShowShortcuts = vi.fn();
    const { result } = renderHook(() => {
      useEditorShortcuts({
        composer: { history: { undo: vi.fn(), redo: vi.fn() } } as unknown as
          UseEditorShortcutsOptions["composer"],
        modals: { setShowShortcuts, setShowAI: vi.fn() },
        saveProject: vi.fn(),
      });
      return useKeyboardCheatSheet();
    });

    act(() => {
      dispatchQuestionMark();
    });
    act(() => {
      dispatchQuestionMark();
    });

    // PIN §2-B5 detail: the two surfaces even disagree on semantics —
    // the cheat sheet TOGGLES (open → closed) while the shell modal is
    // set to true both times (it never toggles).
    expect(result.current.isOpen).toBe(false);
    expect(setShowShortcuts).toHaveBeenCalledTimes(2);
    expect(setShowShortcuts).toHaveBeenNthCalledWith(1, true);
    expect(setShowShortcuts).toHaveBeenNthCalledWith(2, true);
  });
});
