/**
 * Every printed help chord opens the screen it names.
 *
 * The editor ships two help surfaces on purpose — the canvas cheat sheet
 * (board 815:4518, gestures and selection) and the shell's shortcuts panel
 * (app-wide chords) — but the printed chords crossed over. Measured in the
 * running editor: "?" drew "⌨️ Keyboard Shortcuts · SELECTION · Select
 * element" (the cheat sheet), while ⌘/ and the site-menu row drew "Keyboard
 * Shortcuts · PANELS · Open Insert panel" (the shell panel) — and the menu row
 * printed "?" next to itself. The cheat sheet also advertised ⌘0 as "Zoom to
 * fit" (it is 100%; ⌘1 fits, ⌘2 zooms to the selection) and named ⌘⇧P plainly
 * "Command palette" when ⌘K opens the shell's.
 *
 * @license BSD-3-Clause
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(join(__dirname, "..", "..", p), "utf8");
const siteMenu = readFileSync(join(__dirname, "../SiteMenu.tsx"), "utf8");
const shellPanel = read("panels/KeyboardShortcutsPanel.tsx");
const cheatSheet = read("canvas/controls/KeyboardCheatSheet.tsx");

describe("help chords", () => {
  it("the site-menu row prints the chord that opens IT", () => {
    expect(siteMenu).toMatch(/const SHORTCUTS_KBD = IS_MAC \? "⌘\/"/);
    expect(siteMenu).toMatch(/kbd=\{SHORTCUTS_KBD\} onClick=\{run\(onOpenShortcuts\)\}/);
    expect(siteMenu).not.toMatch(/kbd="\?" onClick=\{run\(onOpenShortcuts\)\}/);
  });

  it("the shell panel distinguishes the two surfaces", () => {
    expect(shellPanel).toMatch(/\{ key: "Ctrl\+\/", desc: "This shortcuts panel" \}/);
    expect(shellPanel).toMatch(/\{ key: "\?", desc: "Canvas gestures & selection" \}/);
  });

  it("the cheat sheet's zoom rows match the keys the flyout binds", () => {
    expect(cheatSheet).toMatch(/keys: \["⌘", "0"\], description: "Zoom to 100%"/);
    expect(cheatSheet).toMatch(/keys: \["⌘", "1"\], description: "Zoom to fit"/);
    expect(cheatSheet).toMatch(/keys: \["⌘", "2"\], description: "Zoom to selection"/);
  });

  it("names both palettes", () => {
    expect(cheatSheet).toMatch(/"⌘", "⇧", "P"\], description: "Canvas command palette"/);
    expect(cheatSheet).toMatch(/"⌘", "K"\], description: "Command palette"/);
  });
});
