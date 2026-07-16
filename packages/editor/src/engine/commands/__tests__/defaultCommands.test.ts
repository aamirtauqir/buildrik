/**
 * defaultCommands — behavior of the built-in command closures against a
 * mock Composer: clipboard (copy/cut/paste), zoom, device presets,
 * duplicate/group/select, snap toggle.
 *
 * DOM-coupled commands (nudge-* / reorder via commandOperations, preview's
 * window.open) are exercised only for their guard paths here.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildDefaultCommands } from "../defaultCommands";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "../../Composer";
import type { CommandData } from "@/shared/types";

interface MockElement {
  getId: () => string;
  getType: () => string;
}

function makeElement(id: string, type = "container"): MockElement {
  return { getId: () => id, getType: () => type };
}

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
      serializeElement: vi.fn(() => "serialized-el"),
      getActivePage: vi.fn(() => null as { root: { id: string } } | null),
      getElement: vi.fn(() => null as MockElement | null),
      pasteElement: vi.fn(),
      duplicateElement: vi.fn(),
      groupElements: vi.fn(() => makeElement("group-1")),
      ungroupElement: vi.fn(),
    },
    getState: vi.fn(() => ({ zoom: 100, snapToGrid: false, gridSize: 8 })),
    setZoom: vi.fn(),
    setDevice: vi.fn(),
    setSnapToGrid: vi.fn(),
    saveProject: vi.fn(),
    exportHTML: vi.fn(() => ({ html: "<div/>", css: "", combined: "<html/>" })),
    exportJSON: vi.fn(() => "{}"),
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    clipboard: null as string | null,
  };
}

let composer: ReturnType<typeof makeComposer>;
let byId: Map<string, CommandData>;

function run(id: string) {
  const command = byId.get(id);
  if (!command) throw new Error(`command ${id} not in default set`);
  return command.run(composer as unknown as Composer);
}

beforeEach(() => {
  composer = makeComposer();
  byId = new Map(
    buildDefaultCommands(composer as unknown as Composer).map((c) => [c.id, c]),
  );
});

describe("history + save", () => {
  it("undo/redo delegate to composer.history", () => {
    run("undo");
    run("redo");
    expect(composer.history.undo).toHaveBeenCalledTimes(1);
    expect(composer.history.redo).toHaveBeenCalledTimes(1);
  });

  it("save delegates to composer.saveProject", () => {
    run("save");
    expect(composer.saveProject).toHaveBeenCalledTimes(1);
  });

  it("redo carries ctrl+y as a shortcut alias", () => {
    expect(byId.get("redo")?.shortcuts).toContain("ctrl+y");
  });
});

describe("clipboard", () => {
  it("copy serializes the selection into composer.clipboard and emits clipboard:copy", () => {
    composer.selection.getSelected.mockReturnValue(makeElement("el-1"));
    run("copy");

    expect(composer.elements.serializeElement).toHaveBeenCalledWith("el-1");
    expect(composer.clipboard).toBe("serialized-el");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.CLIPBOARD_COPY, { elementId: "el-1" });
  });

  it("copy without a selection is a no-op", () => {
    run("copy");
    expect(composer.clipboard).toBeNull();
    expect(composer.emit).not.toHaveBeenCalled();
  });

  it("cut serializes, removes the element in a transaction, and emits clipboard:cut", () => {
    composer.selection.getSelected.mockReturnValue(makeElement("el-2"));
    run("cut");

    expect(composer.clipboard).toBe("serialized-el");
    expect(composer.beginTransaction).toHaveBeenCalledWith("cut");
    expect(composer.elements.removeElement).toHaveBeenCalledWith("el-2");
    expect(composer.endTransaction).toHaveBeenCalled();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.CLIPBOARD_CUT, { elementId: "el-2" });
  });

  it("paste targets the selection when present", () => {
    composer.clipboard = "payload";
    const target = makeElement("el-3");
    composer.selection.getSelected.mockReturnValue(target);
    composer.elements.getElement.mockReturnValue(target);

    run("paste");

    expect(composer.elements.getElement).toHaveBeenCalledWith("el-3");
    expect(composer.elements.pasteElement).toHaveBeenCalledWith("payload", target);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.CLIPBOARD_PASTE, { targetId: "el-3" });
  });

  it("paste falls back to the active page root when nothing is selected", () => {
    composer.clipboard = "payload";
    const root = makeElement("root-1");
    composer.elements.getActivePage.mockReturnValue({ root: { id: "root-1" } });
    composer.elements.getElement.mockReturnValue(root);

    run("paste");

    expect(composer.elements.getElement).toHaveBeenCalledWith("root-1");
    expect(composer.elements.pasteElement).toHaveBeenCalledWith("payload", root);
  });

  it("paste with an empty clipboard is a no-op", () => {
    run("paste");
    expect(composer.elements.pasteElement).not.toHaveBeenCalled();
  });
});

describe("delete / duplicate / group", () => {
  it("delete removes the selected element", () => {
    composer.selection.getSelected.mockReturnValue(makeElement("el-4"));
    run("delete");
    expect(composer.elements.removeElement).toHaveBeenCalledWith("el-4");
  });

  it("duplicate clones every selected id and re-selects the clones", () => {
    composer.selection.getSelectedIds.mockReturnValue(["a", "b"]);
    const cloneA = makeElement("a2");
    const cloneB = makeElement("b2");
    composer.elements.duplicateElement.mockReturnValueOnce(cloneA).mockReturnValueOnce(cloneB);

    run("duplicate");

    expect(composer.elements.duplicateElement).toHaveBeenCalledWith("a");
    expect(composer.elements.duplicateElement).toHaveBeenCalledWith("b");
    expect(composer.selection.selectMultiple).toHaveBeenCalledWith([cloneA, cloneB]);
  });

  it("duplicate of a single id selects the single clone", () => {
    composer.selection.getSelectedIds.mockReturnValue(["a"]);
    const clone = makeElement("a2");
    composer.elements.duplicateElement.mockReturnValue(clone);

    run("duplicate");

    expect(composer.selection.select).toHaveBeenCalledWith(clone);
  });

  it("group requires at least two selected ids", () => {
    composer.selection.getSelectedIds.mockReturnValue(["only"]);
    run("group");
    expect(composer.elements.groupElements).not.toHaveBeenCalled();

    composer.selection.getSelectedIds.mockReturnValue(["a", "b"]);
    run("group");
    expect(composer.elements.groupElements).toHaveBeenCalledWith(["a", "b"]);
    expect(composer.selection.select).toHaveBeenCalledWith(expect.objectContaining({ getId: expect.any(Function) }));
  });

  it("ungroup only acts on container selections", () => {
    composer.selection.getSelected.mockReturnValue(makeElement("t1", "text"));
    run("ungroup");
    expect(composer.elements.ungroupElement).not.toHaveBeenCalled();

    composer.selection.getSelected.mockReturnValue(makeElement("c1", "container"));
    run("ungroup");
    expect(composer.elements.ungroupElement).toHaveBeenCalledWith("c1");
    expect(composer.selection.clear).toHaveBeenCalled();
  });
});

describe("zoom", () => {
  it("zoom-in adds 10 to the current zoom", () => {
    composer.getState.mockReturnValue({ zoom: 120, snapToGrid: false, gridSize: 8 });
    run("zoom-in");
    expect(composer.setZoom).toHaveBeenCalledWith(130);
  });

  it("zoom-out subtracts 10 from the current zoom", () => {
    composer.getState.mockReturnValue({ zoom: 120, snapToGrid: false, gridSize: 8 });
    run("zoom-out");
    expect(composer.setZoom).toHaveBeenCalledWith(110);
  });

  it("zoom-reset returns to 100", () => {
    run("zoom-reset");
    expect(composer.setZoom).toHaveBeenCalledWith(100);
  });
});

describe("device presets", () => {
  it.each([
    ["device-desktop", "desktop"],
    ["device-tablet", "tablet"],
    ["device-mobile", "mobile"],
    ["device-watch", "watch"],
  ])("%s sets device %s", (commandId, device) => {
    run(commandId);
    expect(composer.setDevice).toHaveBeenCalledWith(device);
  });
});

describe("selection + toggles", () => {
  it("select-all selects the active page root", () => {
    const root = makeElement("root-9");
    composer.elements.getActivePage.mockReturnValue({ root: { id: "root-9" } });
    composer.elements.getElement.mockReturnValue(root);

    run("select-all");

    expect(composer.selection.select).toHaveBeenCalledWith(root);
  });

  it("deselect clears the selection", () => {
    run("deselect");
    expect(composer.selection.clear).toHaveBeenCalled();
  });

  it("toggle-snap-to-grid flips the current state", () => {
    composer.getState.mockReturnValue({ zoom: 100, snapToGrid: false, gridSize: 8 });
    run("toggle-snap-to-grid");
    expect(composer.setSnapToGrid).toHaveBeenCalledWith(true);

    composer.getState.mockReturnValue({ zoom: 100, snapToGrid: true, gridSize: 8 });
    run("toggle-snap-to-grid");
    expect(composer.setSnapToGrid).toHaveBeenCalledWith(false);
  });

  it("ui-open-* commands emit their toggle events on the captured composer", () => {
    run("ui-open-templates");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_TOGGLE_TEMPLATES);
    run("ui-open-ai");
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_TOGGLE_AI);
  });
});

describe("nudge guard", () => {
  it("nudge commands are no-ops without a selection (no transaction opened)", () => {
    run("nudge-up");
    run("nudge-left-large");
    expect(composer.beginTransaction).not.toHaveBeenCalled();
    expect(composer.emit).not.toHaveBeenCalledWith(
      EVENTS.ELEMENT_NUDGED,
      expect.anything(),
    );
  });

  it("reorder commands are no-ops without a selection", () => {
    run("bring-forward");
    run("send-to-back");
    expect(composer.beginTransaction).not.toHaveBeenCalled();
  });
});

describe("export commands", () => {
  it("export-html and export-json delegate to composer exporters", () => {
    run("export-html");
    expect(composer.exportHTML).toHaveBeenCalled();
    run("export-json");
    expect(composer.exportJSON).toHaveBeenCalled();
  });

  it("export-html / export-json carry no shortcut (keyboard-unreachable)", () => {
    // Documented state backing the CommandCenter AUDIT it.todo: without a
    // shortcut AND without any UI caller these registrations are dead.
    expect(byId.get("export-html")?.shortcut).toBeUndefined();
    expect(byId.get("export-json")?.shortcut).toBeUndefined();
  });
});
