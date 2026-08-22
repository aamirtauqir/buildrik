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
const canvasKeyboardSrc = readFileSync(
  join(HERE, "..", "..", "hooks", "useCanvasKeyboard.ts"),
  "utf8"
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

  it("keeps CANVAS_CHORDS honest — each is still handled in useCanvasKeyboard", () => {
    const missing = Object.entries(CANVAS_CHORDS)
      .filter(([, marker]) => !marker.test(canvasKeyboardSrc))
      .map(([chord]) => chord);
    expect(missing).toEqual([]);
  });
});
