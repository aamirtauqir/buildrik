/**
 * Menu shortcut hints — shared by the canvas element menu and the
 * Inspector ⋯ (both draw board 4428:43928's hint column).
 *
 * @license BSD-3-Clause
 */

/** "Cmd+Alt+C" → "⌘⌥C" on a Mac, "Ctrl+Alt+C" elsewhere. The "+" is dropped
 *  only on a Mac, where the glyphs separate themselves — Windows read
 *  "CtrlAltC" (G2-050). */
export function formatShortcutHint(shortcut: string, mac: boolean): string {
  const shown = shortcut
    .replace(/Cmd/g, mac ? "⌘" : "Ctrl")
    .replace(/Alt/g, mac ? "⌥" : "Alt")
    .replace(/Shift/g, mac ? "⇧" : "Shift")
    .replace(/Del/g, mac ? "⌫" : "Del")
    .replace(/Up/g, "↑")
    .replace(/Down/g, "↓")
    .replace(/Left/g, "←")
    .replace(/Right/g, "→");
  return mac ? shown.replace(/\+/g, "") : shown;
}

export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}
