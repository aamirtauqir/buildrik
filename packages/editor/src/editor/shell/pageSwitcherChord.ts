/**
 * The page switcher's chord — ⇧⌘O on macOS, Ctrl+Alt+O elsewhere.
 *
 * The chord strings live with the keyboard sheet row that prints them
 * (`PAGE_SWITCHER_KEYS`), so the sheet, the bottom bar's hint and the handler
 * read one spelling.
 *
 * @license BSD-3-Clause
 */

import { formatChord, PAGE_SWITCHER_KEYS } from "@/editor/canvas/controls/keyboardSheetRows";

/** True for the switcher chord on this platform. AltGr reports Ctrl+Alt on
 *  Windows, and AltGr+O types "ó" on several layouts — that is typing. */
export function isPageSwitcherChord(e: KeyboardEvent, mac: boolean): boolean {
  if (e.code !== "KeyO" && e.key.toLowerCase() !== "o") return false;
  if (e.getModifierState?.("AltGraph")) return false;
  return mac
    ? e.metaKey && e.shiftKey && !e.ctrlKey && !e.altKey
    : e.ctrlKey && e.altKey && !e.shiftKey && !e.metaKey;
}

/** The chord as inline copy: "⇧⌘O" (Mac glyphs set themselves apart, so the
 *  sheet's "+" joiners are dropped) or "Ctrl+Alt+O". */
export function pageSwitcherHint(mac: boolean): string {
  const chord = formatChord(mac ? PAGE_SWITCHER_KEYS.mac : PAGE_SWITCHER_KEYS.other, mac);
  return mac ? chord.replace(/\+/g, "") : chord;
}
