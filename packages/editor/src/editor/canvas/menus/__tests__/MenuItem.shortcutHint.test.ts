/**
 * G2-050 — menu shortcut hints: the "+" is dropped only on a Mac, where the
 * glyphs separate themselves; Windows read "CtrlAltC".
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { formatShortcutHint } from "../MenuItem";

describe("formatShortcutHint", () => {
  it("keeps the + on Windows and drops it on a Mac", () => {
    expect(formatShortcutHint("Cmd+Alt+C", false)).toBe("Ctrl+Alt+C");
    expect(formatShortcutHint("Cmd+Alt+C", true)).toBe("⌘⌥C");
    expect(formatShortcutHint("Shift+Del", false)).toBe("Shift+Del");
  });
});
