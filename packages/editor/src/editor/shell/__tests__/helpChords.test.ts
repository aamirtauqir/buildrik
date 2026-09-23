/**
 * Every printed help chord opens the screen it names — and there is ONE of
 * each screen.
 *
 * Until 2026-09-22 the editor shipped two help surfaces (the shell's ⌘/
 * panel and the canvas `?` cheat sheet, with two hand-written tables that
 * contradicted each other — TODOS.md:512) and two command palettes (shell
 * ⌘K and canvas ⌘⇧P — audit G1-093). Decisions #37/#38 folded both pairs:
 * one sheet (`canvas/controls/KeyboardCheatSheet`, board 7575:195538) whose
 * rows derive from `defaultCommands`, one palette (`shell/modals/CommandPalette`)
 * that reads the same registry, ⌘⇧P an alias of ⌘K.
 *
 * @license BSD-3-Clause
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const editor = (p: string) => join(__dirname, "..", "..", p);
const read = (p: string) => readFileSync(editor(p), "utf8");
const siteMenu = readFileSync(join(__dirname, "../SiteMenu.tsx"), "utf8");
const shortcuts = readFileSync(join(__dirname, "../hooks/useEditorShortcuts.ts"), "utf8");
const palette = readFileSync(join(__dirname, "../modals/CommandPalette.tsx"), "utf8");
const sheetRows = read("canvas/controls/keyboardSheetRows.ts");

describe("help chords", () => {
  it("the site-menu row prints the chord that opens IT", () => {
    expect(siteMenu).toMatch(/const SHORTCUTS_KBD = IS_MAC \? "⌘\/"/);
    expect(siteMenu).toMatch(/kbd=\{SHORTCUTS_KBD\} onClick=\{run\(onOpenShortcuts\)\}/);
  });

  it("⌘/ and ? both flip the one sheet state, from the one hook", () => {
    expect(shortcuts).toMatch(/e\.key === "\/"\) \{\s*e\.preventDefault\(\);\s*modals\.setShowShortcuts\(true\)/);
    expect(shortcuts).toMatch(/isQuestionMark\(e\)\) \{\s*e\.preventDefault\(\);\s*modals\.setShowShortcuts\(true\)/);
  });

  it("the sheet's zoom rows match the keys the flyout binds", () => {
    expect(sheetRows).toMatch(/keys: "ctrl\+0", description: "Zoom to 100%"/);
    expect(sheetRows).toMatch(/keys: "ctrl\+1", description: "Zoom to fit"/);
    expect(sheetRows).toMatch(/keys: "ctrl\+2", description: "Zoom to selection"/);
  });

  it("names ONE palette, on ⌘K with ⌘⇧P as its alias", () => {
    expect(sheetRows).toMatch(/keys: "ctrl\+k \/ ctrl\+shift\+p", description: "Command palette"/);
    expect(shortcuts).toMatch(/e\.shiftKey && e\.key\.toLowerCase\(\) === "p"\) \{\s*e\.preventDefault\(\);\s*composer\?\.emit\(EVENTS\.UI_TOGGLE_COMMAND_PALETTE/);
  });

  it("the ⌘K palette's fit row prints the chord that fits (G1-093 / SH-90)", () => {
    expect(palette).toMatch(/label: "Zoom to fit",\s*group: "View",\s*shortcut: "Ctrl\+1"/);
    expect(palette).not.toMatch(/label: "Fit to view"/);
  });

  it("the second sheet and the second and third palettes are gone", () => {
    for (const gone of [
      "panels/KeyboardShortcutsPanel.tsx",
      "canvas/controls/CommandPalette.tsx",
      "canvas/hooks/useCanvasCommandPalette.ts",
      "sidebar/tabs/pages/components/PageCommandPalette.tsx",
    ]) {
      expect(existsSync(editor(gone)), gone).toBe(false);
    }
  });
});
