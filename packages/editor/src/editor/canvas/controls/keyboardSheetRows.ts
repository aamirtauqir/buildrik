/**
 * keyboardSheetRows — the rows of the ONE keyboard sheet (board 7575:195538
 * "Keyboard shortcuts · full": groups Selection · Edit · View · Panels ·
 * Regions, search on top).
 *
 * Two sources, in this order of trust:
 *
 * 1. The command registry (`engine/commands/defaultCommands.ts`, plus whatever
 *    a panel registers while it is mounted). Every command with a `shortcut`
 *    becomes a row under its own `group`, spelled from the registry's chord
 *    string — so changing a chord there changes the sheet, and a chord
 *    printed here is the chord KeybindingManager binds.
 * 2. `CHROME_CHORDS` — keys bound by chrome hooks the registry does not own
 *    (arrows in useCanvasKeyboard, zoom in CanvasFooterToolbar, ⌘Z/⌘P/F6 in
 *    useEditorShortcuts, the rail letters from tabsConfig). Each row names
 *    its binder; a row here without one is a claim, not a fact
 *    (`feedback_printed_chord_is_a_contract`). The rail letters are derived
 *    from `GROUPED_TABS_CONFIG`, which is also what `useSidebarKeyboard`
 *    binds them from.
 *
 * Until 2026-09-22 two sheets carried two hand-written tables
 * (`panels/KeyboardShortcutsPanel` behind ⌘/ and this one behind `?`), and
 * TODOS.md:512 recorded that they contradicted each other.
 *
 * @license BSD-3-Clause
 */

import type { CommandData } from "@/shared/types";
import { GROUPED_TABS_CONFIG } from "@/editor/rail/tabsConfig";

export interface SheetRow {
  /** Stable anchor for tests and the DOM. */
  id: string;
  /** Chord(s) as stored — "ctrl+shift+z", "F6", "?". Alternates joined by " / ". */
  keys: string;
  /** What the chord does, as the user reads it. */
  description: string;
}

export interface SheetGroup {
  title: string;
  rows: SheetRow[];
}

/** The board's group order. A registry group outside this set (Insert, Tools,
 *  Navigation — none of which carry chords today) lands after these. */
export const SHEET_GROUP_ORDER = ["Selection", "Edit", "View", "Panels", "Regions"];

// =============================================================================
// CHORD SPELLING
// =============================================================================

/** One spelling per key, whatever the source wrote. The palette's hardcoded
 *  rows spell "Ctrl+Z", the registry "ctrl+shift+e" (KeybindingManager's own
 *  form) and "delete"/"escape". */
const KEY_NAMES: Record<string, [mac: string, other: string]> = {
  ctrl: ["⌘", "Ctrl"],
  cmd: ["⌘", "Ctrl"],
  shift: ["⇧", "Shift"],
  alt: ["⌥", "Alt"],
  delete: ["Del", "Del"],
  backspace: ["⌫", "Backspace"],
  escape: ["Esc", "Esc"],
  arrowup: ["↑", "↑"],
  arrowdown: ["↓", "↓"],
  arrowleft: ["←", "←"],
  arrowright: ["→", "→"],
};

export function formatChord(shortcut: string, isMac: boolean): string {
  /* "Ctrl++" and "Ctrl+-": the last "+" / "-" is a key, not a joiner. */
  const literal = /\+\+$/.test(shortcut) ? "+" : /\+-$/.test(shortcut) ? "-" : null;
  const body = literal ? shortcut.slice(0, -2) : shortcut;
  const keys = body.split("+").map((k) => {
    const named = KEY_NAMES[k.toLowerCase()];
    if (named) return isMac ? named[0] : named[1];
    return k.length === 1 ? k.toUpperCase() : k;
  });
  if (literal) keys.push(literal);
  return keys.join("+");
}

/** A row's alternates ("delete / backspace") spelled one by one. */
export function formatKeys(keys: string, isMac: boolean): string {
  return keys
    .split(" / ")
    .map((k) => formatChord(k, isMac))
    .join(" / ");
}

// =============================================================================
// CHROME-BOUND CHORDS (not in the registry)
// =============================================================================

interface ChromeChord extends SheetRow {
  group: string;
}

/** Rail panel letters — bound by `useSidebarKeyboard` from this same config. */
const PANEL_LETTERS: ChromeChord[] = GROUPED_TABS_CONFIG.filter((t) => Boolean(t.shortcut)).map(
  (t) => ({
    id: `panel-${t.id}`,
    group: "Panels",
    keys: t.shortcut as string,
    description: `Open ${t.label} panel`,
  }),
);

export const CHROME_CHORDS: ChromeChord[] = [
  // ── Selection — useCanvasKeyboard ────────────────────────────────────────
  { id: "sel-click", group: "Selection", keys: "Click", description: "Select element" },
  { id: "sel-dblclick", group: "Selection", keys: "Double-click", description: "Select child / deep select" },
  { id: "sel-shift-click", group: "Selection", keys: "shift+Click", description: "Add to selection" },
  { id: "sel-cmd-click", group: "Selection", keys: "ctrl+Click", description: "Cycle through overlapping" },
  { id: "sel-tab", group: "Selection", keys: "Tab / shift+Tab", description: "Next / previous element" },
  { id: "sel-siblings", group: "Selection", keys: "arrowup / arrowdown", description: "Select previous / next sibling" },
  { id: "sel-parent", group: "Selection", keys: "arrowleft", description: "Select parent" },
  { id: "sel-child", group: "Selection", keys: "arrowright", description: "Select first child" },
  { id: "sel-ends", group: "Selection", keys: "Home / End", description: "Select first / last sibling" },
  { id: "sel-menu", group: "Selection", keys: "Right-click / shift+F10", description: "Open context menu" },

  // ── Edit — useEditorShortcuts (undo/redo), useCanvasKeyboard (the rest) ──
  /* The registry's undo/redo carry no chord on purpose: binding them there as
     well ran both handlers and undid two steps per press
     (defaultCommands.ts, "Clipboard & History"). The shell hook owns ⌘Z. */
  { id: "edit-undo", group: "Edit", keys: "ctrl+z", description: "Undo" },
  { id: "edit-redo", group: "Edit", keys: "ctrl+shift+z / ctrl+y", description: "Redo" },
  { id: "edit-copy-styles", group: "Edit", keys: "ctrl+alt+c", description: "Copy styles only" },
  { id: "edit-paste-styles", group: "Edit", keys: "ctrl+alt+v", description: "Paste styles" },
  { id: "edit-move-10", group: "Edit", keys: "shift+Arrows", description: "Move element 10px" },
  { id: "edit-move-1", group: "Edit", keys: "ctrl+Arrows", description: "Move element 1px" },
  { id: "edit-reorder", group: "Edit", keys: "alt+arrowup / alt+arrowdown", description: "Reorder up / down in DOM" },
  { id: "edit-reorder-ends", group: "Edit", keys: "alt+Home / alt+End", description: "Move to first / last position" },

  // ── View — CanvasFooterToolbar (zoom, overlays), StudioHeader (⌘K),
  //          useEditorShortcuts (⌘P, ⌘⇧P, ⌘/, ⌘J), StudioModals (?) ────────
  { id: "view-palette", group: "View", keys: "ctrl+k / ctrl+shift+p", description: "Command palette" },
  { id: "view-sheet", group: "View", keys: "? / ctrl+/", description: "Keyboard shortcuts" },
  { id: "view-preview", group: "View", keys: "ctrl+p", description: "Preview" },
  { id: "view-ai", group: "View", keys: "ctrl+j", description: "Ask AI" },
  { id: "view-zoom-in", group: "View", keys: "ctrl++", description: "Zoom in" },
  { id: "view-zoom-out", group: "View", keys: "ctrl+-", description: "Zoom out" },
  /* ⌘0 is 100%, ⌘1 fits, ⌘2 zooms to the selection — measured at 1440×900
     and bound in CanvasFooterToolbar. Two sheets printed ⌘0 as "fit". */
  { id: "view-zoom-100", group: "View", keys: "ctrl+0", description: "Zoom to 100%" },
  { id: "view-zoom-fit", group: "View", keys: "ctrl+1", description: "Zoom to fit" },
  { id: "view-zoom-selection", group: "View", keys: "ctrl+2", description: "Zoom to selection" },
  { id: "view-guides", group: "View", keys: "ctrl+;", description: "Toggle snap guides" },
  { id: "view-spacing", group: "View", keys: "ctrl+shift+;", description: "Toggle spacing overlay" },
  { id: "view-grid", group: "View", keys: "ctrl+'", description: "Toggle grid" },
  { id: "view-badges", group: "View", keys: "ctrl+b", description: "Toggle badges" },
  { id: "view-rulers", group: "View", keys: "ctrl+r", description: "Toggle rulers" },
  { id: "view-xray", group: "View", keys: "ctrl+shift+x", description: "Toggle X-ray" },

  // ── Panels — useSidebarKeyboard (letters), useEditorShortcuts (the rest) ─
  ...PANEL_LETTERS,
  { id: "panel-site-settings", group: "Panels", keys: "ctrl+,", description: "Site settings" },
  { id: "panel-version-history", group: "Panels", keys: "ctrl+h", description: "Version history" },
  { id: "panel-comment-mode", group: "Panels", keys: "C", description: "Comment mode" },

  // ── Regions — useEditorShortcuts / regionCycle ───────────────────────────
  { id: "region-cycle", group: "Regions", keys: "F6 / shift+F6", description: "Cycle between regions" },
];

// =============================================================================
// GROUPING
// =============================================================================

/** Registry rows + chrome rows, grouped in the board's order. A registry
 *  command with a chord and no `group` lands under Edit — the test in
 *  `KeyboardCheatSheet.commands.test.tsx` refuses that case so it stays
 *  hypothetical. */
export function buildSheetGroups(registry: readonly CommandData[]): SheetGroup[] {
  const byGroup = new Map<string, SheetRow[]>();
  const push = (group: string, row: SheetRow) => {
    const rows = byGroup.get(group);
    if (rows) rows.push(row);
    else byGroup.set(group, [row]);
  };

  for (const cmd of registry) {
    if (!cmd.shortcut) continue;
    const alternates = cmd.shortcuts && cmd.shortcuts.length > 1 ? cmd.shortcuts : [cmd.shortcut];
    push(cmd.group ?? "Edit", {
      id: `cmd-${cmd.id}`,
      keys: alternates.join(" / "),
      description: cmd.label ?? cmd.id,
    });
  }
  for (const { group, ...row } of CHROME_CHORDS) push(group, row);

  const rank = (g: string) => {
    const i = SHEET_GROUP_ORDER.indexOf(g);
    return i === -1 ? SHEET_GROUP_ORDER.length : i;
  };
  return [...byGroup]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([title, rows]) => ({ title, rows }));
}
