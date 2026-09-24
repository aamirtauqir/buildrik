/**
 * The ONE keyboard sheet derives from the command registry (decision #37):
 * every `defaultCommands` entry with a chord appears exactly once, under a
 * group the board draws, spelled from the registry's own chord string — so a
 * chord change in the registry cannot drift the sheet.
 *
 * Also carries the asserts of the two deleted panel test files:
 *  - `KeyboardShortcutsPanel.zoom.test.ts` — the zoom rows name the chords
 *    CanvasFooterToolbar binds (⌘0 100% · ⌘1 fit · ⌘2 selection).
 *  - `helpChords.test.ts`'s "names both palettes" — there is ONE palette now,
 *    reached by ⌘K and ⌘⇧P.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, cleanup, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KeyboardCheatSheet } from "../KeyboardCheatSheet";
import { buildSheetGroups, CHROME_CHORDS, SHEET_GROUP_ORDER, formatChord } from "../keyboardSheetRows";
import { buildDefaultCommands } from "@/engine/commands/defaultCommands";
import type { Composer } from "@/engine";

afterEach(cleanup);

const stub = { emit: vi.fn() } as unknown as Composer;
const registry = buildDefaultCommands(stub);
const chorded = registry.filter((c) => Boolean(c.shortcut));

function open() {
  const composer = { commands: { getAll: () => registry } } as unknown as Composer;
  return render(<KeyboardCheatSheet isOpen onClose={vi.fn()} composer={composer} />);
}

describe("KeyboardCheatSheet — rows derive from defaultCommands", () => {
  it("the registry has chords to list, and every one of them declares a board group", () => {
    expect(chorded.length).toBeGreaterThan(10);
    for (const cmd of chorded) {
      expect(cmd.group, `${cmd.id} carries a chord but no group`).toBeDefined();
      expect(SHEET_GROUP_ORDER, `${cmd.id} group "${cmd.group}" is not on the board`).toContain(cmd.group);
    }
  });

  it("every defaultCommands entry with a chord appears exactly once", () => {
    open();
    for (const cmd of chorded) {
      const rows = screen.getAllByTestId(`kb-row-cmd-${cmd.id}`);
      expect(rows, cmd.id).toHaveLength(1);
      const row = within(rows[0]);
      expect(row.getByText(cmd.label ?? cmd.id)).toBeInTheDocument();
      // The chip spells the registry's chord — the one KeybindingManager binds.
      const expected = (cmd.shortcuts && cmd.shortcuts.length > 1 ? cmd.shortcuts : [cmd.shortcut as string])
        .map((k) => formatChord(k, false))
        .join(" / ");
      expect(row.getByTestId(/^kb-badge-/)).toHaveTextContent(expected);
    }
  });

  it("a chord change in the registry changes the sheet (no hand-written copy of it)", () => {
    const changed = registry.map((c) => (c.id === "save" ? { ...c, shortcut: "ctrl+shift+s" } : c));
    const groups = buildSheetGroups(changed);
    const save = groups.flatMap((g) => g.rows).find((r) => r.id === "cmd-save");
    expect(save?.keys).toBe("ctrl+shift+s");
  });

  it("no chrome-bound row duplicates a registry chord", () => {
    const registryChords = new Set(chorded.flatMap((c) => c.shortcuts ?? [c.shortcut as string]));
    for (const row of CHROME_CHORDS) {
      for (const k of row.keys.split(" / ")) {
        expect(registryChords.has(k), `${row.id} re-lists registry chord ${k}`).toBe(false);
      }
    }
  });

  it("groups render in the board's order: Selection · Edit · View · Panels · Regions", () => {
    open();
    const headings = screen
      .getAllByTestId(/^kb-group-/)
      .map((el) => el.textContent);
    expect(headings).toEqual(["Selection", "Edit", "View", "Panels", "Regions"]);
  });

  it("registry rows sit under their own group — Save under Edit, Select all under Selection", () => {
    const groups = buildSheetGroups(registry);
    const titleOf = (id: string) => groups.find((g) => g.rows.some((r) => r.id === id))?.title;
    expect(titleOf("cmd-save")).toBe("Edit");
    expect(titleOf("cmd-select-all")).toBe("Selection");
    expect(titleOf("cmd-ui-open-exporter")).toBe("Panels");
  });
});

describe("KeyboardCheatSheet — the chords chrome binds", () => {
  const toolbar = readFileSync(join(__dirname, "..", "..", "CanvasFooterToolbar.tsx"), "utf8");
  const rowKeys = (id: string) => CHROME_CHORDS.find((r) => r.id === id)?.keys;

  it("gives ⌘0 its real job", () => {
    expect(rowKeys("view-zoom-100")).toBe("ctrl+0");
    expect(toolbar).toMatch(/key === "0"[\s\S]{0,80}onZoomChange\(100\)/);
  });

  it("advertises fit under the chord that fits", () => {
    expect(rowKeys("view-zoom-fit")).toBe("ctrl+1");
    expect(toolbar).toMatch(/key === "1" && onFitToScreen/);
  });

  it("advertises zoom-to-selection", () => {
    expect(rowKeys("view-zoom-selection")).toBe("ctrl+2");
    expect(toolbar).toMatch(/key === "2" && onZoomToSelection/);
  });

  it("lists ONE palette, reached by ⌘K and its ⌘⇧P alias", () => {
    open();
    expect(screen.getAllByText("Command palette")).toHaveLength(1);
    expect(screen.getByTestId("kb-badge-command-palette")).toHaveTextContent("Ctrl+K / Ctrl+Shift+P");
  });

  it("lists Save ⌘S — the bound chord the old sheet never advertised", () => {
    open();
    expect(screen.getByTestId("kb-badge-save")).toHaveTextContent("Ctrl+S");
  });

  it("lists the rail letters from tabsConfig, the file useSidebarKeyboard binds them from", () => {
    open();
    expect(screen.getByTestId("kb-badge-open-pages-panel")).toHaveTextContent("P");
    expect(screen.getByTestId("kb-badge-open-layers-panel")).toHaveTextContent("L");
  });
});

describe("KeyboardCheatSheet — the second sheet is gone", () => {
  it("panels/KeyboardShortcutsPanel.tsx no longer exists", () => {
    expect(existsSync(join(__dirname, "..", "..", "..", "panels", "KeyboardShortcutsPanel.tsx"))).toBe(false);
  });
});
