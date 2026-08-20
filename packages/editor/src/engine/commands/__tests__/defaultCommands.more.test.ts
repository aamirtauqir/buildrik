/**
 * defaultCommands — branches not covered by defaultCommands.test.ts:
 * the remaining UI-toggle emitters, guard/empty paths for ungroup / duplicate
 * / group / paste / select-all, and the preview window-write path.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildDefaultCommands } from "../defaultCommands";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "../../Composer";
import type { CommandData } from "@/shared/types";

interface MockElement {
  getId: () => string;
  getType: () => string;
  getParent: () => MockElement | null;
  getChildren: () => MockElement[];
}
const el = (id: string, type = "container"): MockElement => ({
  getId: () => id,
  getType: () => type,
  getParent: () => null,
  getChildren: () => [],
});

function makeComposer() {
  return {
    emit: vi.fn(),
    history: { undo: vi.fn(), redo: vi.fn() },
    selection: {
      getSelected: vi.fn(() => null as MockElement | null),
      getSelectedIds: vi.fn(() => [] as string[]),
      select: vi.fn(),
      selectMultiple: vi.fn(),
      clear: vi.fn(),
    },
    elements: {
      removeElement: vi.fn(),
      serializeElement: vi.fn(() => "s"),
      getActivePage: vi.fn(() => null as { root: { id: string } } | null),
      getElement: vi.fn(() => null as MockElement | null),
      pasteElement: vi.fn(),
      duplicateElement: vi.fn(),
      groupElements: vi.fn(() => null as MockElement | null),
      ungroupElement: vi.fn(),
    },
    getState: vi.fn(() => ({ zoom: 100, snapToGrid: false, gridSize: 8 })),
    setZoom: vi.fn(),
    setDevice: vi.fn(),
    setSnapToGrid: vi.fn(),
    saveProject: vi.fn(),
    exportHTML: vi.fn(() => ({ html: "<div/>", css: "", combined: "<html>x</html>" })),
    exportJSON: vi.fn(() => "{}"),
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    clipboard: null as { type: string } | null,
  };
}

let composer: ReturnType<typeof makeComposer>;
let byId: Map<string, CommandData>;
const run = (id: string) => byId.get(id)!.run(composer as unknown as Composer);

beforeEach(() => {
  composer = makeComposer();
  byId = new Map(buildDefaultCommands(composer as unknown as Composer).map((c) => [c.id, c]));
});

describe("remaining UI toggles", () => {
  it("ui-open-exporter and ui-toggle-component-view emit their events", () => {
    run("ui-open-exporter");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_TOGGLE_EXPORTER);
    run("ui-toggle-component-view");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_TOGGLE_COMPONENT_VIEW);
  });
});

describe("guard / empty paths", () => {
  it("ungroup with no selection does nothing", () => {
    run("ungroup");
    expect(composer.beginTransaction).not.toHaveBeenCalled();
    expect(composer.elements.ungroupElement).not.toHaveBeenCalled();
  });

  it("duplicate with no selected ids does nothing", () => {
    run("duplicate");
    expect(composer.beginTransaction).not.toHaveBeenCalled();
    expect(composer.elements.duplicateElement).not.toHaveBeenCalled();
  });

  it("group whose groupElements returns null does not re-select", () => {
    composer.selection.getSelectedIds.mockReturnValue(["a", "b"]);
    composer.elements.groupElements.mockReturnValue(null);
    run("group");
    expect(composer.elements.groupElements).toHaveBeenCalledWith(["a", "b"]);
    expect(composer.selection.select).not.toHaveBeenCalled();
  });

  it("paste with no selection and no active page is a no-op", () => {
    composer.clipboard = { type: "heading" };
    run("paste"); // getActivePage → null → no target at all
    expect(composer.elements.pasteElement).not.toHaveBeenCalled();
  });

  /* The selection IS the target now — `getElement` is only consulted for the
     page-root fallback — so "target cannot be resolved" is the case where the
     selection can't hold the paste, has no parent that can, and there is no
     active page to fall back to. */
  it("paste with nowhere valid to land is a no-op", () => {
    composer.clipboard = { type: "section" };
    composer.selection.getSelected.mockReturnValue(el("sel", "heading"));
    composer.elements.getActivePage.mockReturnValue(null);
    run("paste");
    expect(composer.elements.pasteElement).not.toHaveBeenCalled();
  });

  it("select-all with no active page does nothing", () => {
    run("select-all");
    expect(composer.selection.select).not.toHaveBeenCalled();
  });
});

describe("preview", () => {
  afterEach(() => vi.restoreAllMocks());

  it("no-ops gracefully when window.open is blocked (returns null)", () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    expect(() => run("preview")).not.toThrow();
    expect(composer.exportHTML).toHaveBeenCalled();
  });

  it("writes the combined HTML into the opened window", () => {
    const doc = { open: vi.fn(), write: vi.fn(), close: vi.fn() };
    vi.spyOn(window, "open").mockReturnValue({ document: doc } as unknown as Window);

    run("preview");

    expect(doc.open).toHaveBeenCalled();
    expect(doc.write).toHaveBeenCalledWith("<html>x</html>");
    expect(doc.close).toHaveBeenCalled();
  });
});
