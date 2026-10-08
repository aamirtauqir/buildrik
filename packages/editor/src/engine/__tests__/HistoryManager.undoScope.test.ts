/**
 * A-4 / PD-12 — undo scope is the element tree + the design tokens.
 *
 * History snapshotted the whole `exportProject()`, settings and metadata
 * included, so ⌘Z after saving an SEO title put the old title back (and the
 * Site-column mirror then shipped it to the server), and a canvas undo after a
 * rename undid the rename. Real Composer, real HistoryManager — no mocks.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { Composer } from "@/engine/Composer";
import { v6Token } from "@/engine/__tests__/test-utils/v6Token";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { tokensForEmit } from "@/engine/designSystem/projectTokens";

function pageData() {
  return {
    id: "p1",
    name: "Home",
    slug: "home",
    isHome: true,
    root: { id: "root", type: "container", children: [] },
  };
}

let composer: Composer;

beforeAll(() => {
  /* jsdom has no 2D canvas; a Composer manager asks for one at construction.
     Any property read returns a no-op, which is all construction needs. */
  const ctx = new Proxy({}, { get: () => () => ({ data: new Uint8ClampedArray(4) }) });
  HTMLCanvasElement.prototype.getContext = (() => ctx) as never;
});

beforeEach(() => {
  composer = new Composer({} as never);
  composer.importProject({
    version: "1.0",
    pages: [pageData()],
    styles: [],
    assets: [],
    settings: { seo: { metaTitle: "Old title" } },
    metadata: { name: "Old name" },
  } as never);
  composer.history.clear();
});

/** One committed canvas edit: a new child on the page root. */
function canvasEdit(): string {
  const el = composer.elements.createElement("text", { content: "Hi" } as never);
  composer.elements.addElement(el, "root");
  composer.history.flushPending();
  composer.history.record("add text");
  return el.getId();
}

describe("undo scope (A-4 / PD-12)", () => {
  it("undo after a settings save keeps the settings", () => {
    const added = canvasEdit();
    composer.setProjectSettings({
      ...composer.getProjectSettings(),
      seo: { metaTitle: "New title" },
    });
    composer.history.flushPending();

    // A settings-only change is not a history step.
    expect(composer.history.canUndo()).toBe(true);
    composer.history.undo();

    // The canvas edit is what ⌘Z reverted…
    expect(composer.elements.getElement(added)).toBeUndefined();
    // …and the saved SEO title is still the new one.
    expect(composer.getProjectSettings().seo?.metaTitle).toBe("New title");
  });

  it("a rename survives the next canvas undo", () => {
    const added = canvasEdit();
    composer.updateProjectMetadata({ name: "New name" });
    composer.history.undo();

    expect(composer.elements.getElement(added)).toBeUndefined();
    expect(composer.getProjectMetadata().name).toBe("New name");
  });

  it("design tokens stay undoable", () => {
    const token = v6Token({ id: "t1", name: "Brand", cssVar: "--brand", value: "#1A56DB" });
    composer.history.record("baseline");
    composer.setProjectSettings({
      ...composer.getProjectSettings(),
      designTokens: [token],
    });
    composer.history.flushPending();
    composer.history.record("add token");
    expect(composer.getProjectSettings().designTokens).toHaveLength(1);

    composer.history.undo();
    expect(composer.getProjectSettings().designTokens ?? []).toHaveLength(0);
    // Undoing the token did not take the other settings with it.
    expect(composer.getProjectSettings().seo?.metaTitle).toBe("Old title");
  });

  /* Undoing a site's FIRST brand edit restored "no tokens" as an absent key.
     The save payload then carried no designTokens at all, the server kept
     the edited row, and the next load brought the undone edit back. Undo
     writes the seed explicitly instead: [] at the current schema version
     ([] with no version reads as v1). */
  it("undoing the first brand edit persists as an explicit empty v6 token set", () => {
    expect(composer.designSystem.setDesignToken("color-primary", "#FF0000")).toBe("#FF0000");
    expect(composer.exportProject().settings?.designTokens).toBeDefined();

    composer.history.undo();

    const settings = composer.exportProject().settings;
    expect(settings?.designTokens).toEqual([]);
    expect(settings?.designTokensSchemaVersion).toBe(6);
    expect(tokensForEmit(settings)).toEqual(DEFAULT_TOKENS);
    expect(settings?.seo?.metaTitle).toBe("Old title");
  });

  /* Dark mode is token state (the server keeps it beside designTokens), so a
     ⌘Z of a Dark mode change must revert it — the snapshot did not carry it,
     and the undo left the new value standing. */
  it("undoing a Dark mode change restores the previous setting", () => {
    composer.setProjectSettings({ ...composer.getProjectSettings(), darkMode: "off" });
    composer.history.flushPending();
    composer.history.record("baseline");
    composer.setProjectSettings({ ...composer.getProjectSettings(), darkMode: "auto" });
    composer.history.flushPending();
    composer.history.record("dark mode auto");
    expect(composer.getProjectSettings().darkMode).toBe("auto");

    composer.history.undo();
    expect(composer.getProjectSettings().darkMode).toBe("off");
    expect(composer.getProjectSettings().seo?.metaTitle).toBe("Old title");

    composer.history.redo();
    expect(composer.getProjectSettings().darkMode).toBe("auto");
  });

  /* The site's first Dark mode change: the restored state had no darkMode.
     Absent reads as "off" everywhere (DarkModeSchema.catch("off")), and an
     absent key is left out of a save, so undo writes "off" explicitly. */
  it("undoing the first Dark mode change writes an explicit off", () => {
    composer.history.record("baseline");
    composer.setProjectSettings({ ...composer.getProjectSettings(), darkMode: "auto" });
    composer.history.flushPending();
    composer.history.record("dark mode auto");

    composer.history.undo();
    expect(composer.exportProject().settings?.darkMode).toBe("off");
  });

  it("an undo on a site that never set Dark mode does not invent it", () => {
    canvasEdit();
    composer.history.undo();
    expect("darkMode" in (composer.exportProject().settings ?? {})).toBe(false);
  });

  it("an undo on a site that never had tokens does not invent them", () => {
    canvasEdit();
    composer.history.undo();
    expect(composer.exportProject().settings?.designTokens).toBeUndefined();
  });
});
