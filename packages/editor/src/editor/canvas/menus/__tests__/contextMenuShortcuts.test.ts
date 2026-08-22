// @vitest-environment jsdom
/**
 * The shortcut column of the right-click menu, against what the keyboard
 * actually does.
 *
 * A shortcut printed next to a menu row is a promise: press this, get this.
 * Nothing checked that promise, and eleven of the twenty-three printed chords
 * were wrong — nine bound to nothing at all, and two ("Cmd+Shift+C" for Copy
 * Styles, "Cmd+Shift+Up" for Insert Before) bound to a DIFFERENT action, so
 * following the menu toggled component view or nudged the element a pixel.
 *
 * Two sources of truth, both real rather than transcribed:
 *   - the command registry a live Composer builds, indexed through the same
 *     KeybindingManager the app dispatches with, so "is this chord taken, and
 *     by what" is answered by the thing that answers it at runtime;
 *   - CANVAS_CHORDS, the chords `useCanvasKeyboard` handles itself. Those live
 *     in a switch, not a registry, so they are listed here with the case they
 *     come from and re-checked against that file below.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
/* `@/` alias — `../../` and deeper is banned (CLAUDE.md §Imports). */
import {
  createTestComposer,
  installEngineBrowserStubs,
  removeEngineBrowserStubs,
} from "@/engine/__tests__/test-utils/realComposer";
import { KeybindingManager } from "@/engine/commands";
import {
  editSubmenu,
  insertSubmenu,
  layoutSubmenu,
  quickStyleSubmenu,
  standaloneActions,
} from "../actions";
import type { ContextAction } from "../contextMenuRegistry";

const HERE = dirname(fileURLToPath(import.meta.url));
const CANVAS = join(HERE, "..", "..");
const canvasKeyboardSrc = readFileSync(join(CANVAS, "hooks", "useCanvasKeyboard.ts"), "utf8");

/* Every chrome tooltip that prints a chord after the "·" separator. Same
   promise as the menu column, made on hover instead. */
const TOOLTIP_FILES = [
  "controls/toolbar/ToolbarActionsSection.tsx",
  "controls/toolbar/ToolbarNavSection.tsx",
  "CanvasFooterToolbar.tsx",
];
const GLYPHS: Record<string, string> = {
  "\u2318": "ctrl", "\u2325": "alt", "\u21e7": "shift",
  "\u232b": "backspace", "\u2190": "arrowleft", "\u2192": "arrowright",
  "\u2191": "arrowup", "\u2193": "arrowdown",
};
const chordFromGlyphs = (raw: string) => {
  const parts: string[] = [];
  let key = "";
  for (const ch of raw) {
    const mod = GLYPHS[ch.toLowerCase()];
    if (mod && mod.length <= 5 && ["ctrl", "alt", "shift"].includes(mod)) parts.push(mod);
    else if (mod) key = mod;
    else key = ch.toLowerCase();
  }
  return [...parts, key].filter(Boolean).join("+");
};
const tooltipChords = TOOLTIP_FILES.flatMap((f) =>
  [...readFileSync(join(CANVAS, f), "utf8").matchAll(/content="([^"]+?) \u00b7 ([^"]+?)"/g)].map(
    (m) => ({ label: m[1], raw: m[2], file: f })
  )
);

/** Chords `useCanvasKeyboard` implements directly, with the branch that proves it. */
const CANVAS_CHORDS: Record<string, RegExp> = {
  "ctrl+alt+c": /Cmd\/Ctrl\+Option\+C: Copy styles only/,
  "ctrl+alt+v": /Cmd\/Ctrl\+Option\+V: Paste styles only/,
  arrowleft: /case "ArrowLeft":/,
  arrowright: /case "ArrowRight":/,
  arrowup: /case "ArrowUp":/,
  arrowdown: /case "ArrowDown":/,
};

/* Chords the SHELL owns (useEditorShortcuts) or a surface binds for itself,
   neither of which is in the command registry. */
const SHELL_CHORDS: Record<string, true> = {
  "ctrl+z": true,
  "ctrl+shift+z": true,
  "?": true,
};

const flatten = (actions: ContextAction[]): ContextAction[] =>
  actions.flatMap((a) => [a, ...(a.submenu ? flatten(a.submenu) : [])]);

const printed = flatten([
  ...editSubmenu,
  ...insertSubmenu,
  ...layoutSubmenu,
  ...quickStyleSubmenu,
  ...standaloneActions,
]).filter((a) => a.shortcut);

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

describe("context menu shortcut column", () => {
  const keys = new KeybindingManager();
  beforeAll(() => {
    createTestComposer().commands.getAll().forEach((c) => keys.indexCommand(c));
  });

  /* The menu prints "←" for Select Parent; the renderer passes glyphs through
     untouched, so normalise it to the key name the switch reads. */
  const normalise = (s: string) =>
    keys.normalizeShortcut(
      s
        .replace(/←/, "ArrowLeft")
        .replace(/→/, "ArrowRight")
        .replace(/\bUp\b/, "ArrowUp")
        .replace(/\bDown\b/, "ArrowDown")
        .replace(/\bDel\b/, "Delete")
    );

  /* "Unclaimed" is the mild reading. The canvas switch matches on modifier
     PRESENCE, not on an exact chord — `case "ArrowUp"` takes the ctrl branch
     whenever meta is down, shift or no shift — so a menu row that printed
     "Cmd+Shift+Up" for Insert Before actually nudged the element a pixel. An
     unclaimed chord here can be dead OR quietly wrong; both fail. */
  it("prints no chord the app does not honour as printed", () => {
    const orphans = printed
      .map((a) => ({ id: a.id, chord: normalise(a.shortcut ?? "") }))
      .filter((x) => !keys.findCommandId(x.chord) && !(x.chord in CANVAS_CHORDS));
    expect(orphans).toEqual([]);
  });

  it("prints no chord that runs a different action", () => {
    /* A menu row and a command may legitimately share a chord when they do the
       same thing (Copy is `copy` in both). The failure is a chord whose command
       is unrelated to the row it sits next to. */
    const stems = (s: string) => s.replace(/^(context-|ui-)/, "").split("-");
    const mismatched = printed
      .map((a) => ({ id: a.id, chord: normalise(a.shortcut ?? "") }))
      .map((x) => ({ ...x, commandId: keys.findCommandId(x.chord) }))
      .filter((x) => x.commandId && !stems(x.commandId).some((s) => stems(x.id).includes(s)));
    expect(mismatched).toEqual([]);
  });

  /* Chords printed on a tooltip instead of a menu row. "Select Parent · ⌥↑"
     sat here: ⌥↑ is Reorder Up in the canvas switch and in the cheat sheet,
     and ← is the one that selects the parent — so following the tooltip moved
     the element in the tree. */
  it("prints no tooltip chord the app does not honour as printed", () => {
    expect(tooltipChords.length).toBeGreaterThan(4);
    const wrong = tooltipChords
      .map((t) => ({ ...t, chord: keys.normalizeShortcut(chordFromGlyphs(t.raw)) }))
      .map((t) => ({ ...t, commandId: keys.findCommandId(t.chord) }))
      .filter((t) => {
        if (t.commandId) {
          const label = t.label.toLowerCase();
          return !t.commandId.split("-").some((w) => label.includes(w));
        }
        return !(t.chord in CANVAS_CHORDS) && !(t.chord in SHELL_CHORDS);
      })
      .map((t) => ({ label: t.label, chord: t.chord, runs: t.commandId ?? null }));
    expect(wrong).toEqual([]);
  });

  it("keeps CANVAS_CHORDS honest — each is still handled in useCanvasKeyboard", () => {
    const missing = Object.entries(CANVAS_CHORDS)
      .filter(([, marker]) => !marker.test(canvasKeyboardSrc))
      .map(([chord]) => chord);
    expect(missing).toEqual([]);
  });
});
