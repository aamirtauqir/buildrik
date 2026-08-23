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
  getParent: () => MockElement | null;
  getChildren: () => MockElement[];
}

function makeElement(id: string, type = "container"): MockElement {
  return {
    getId: () => id,
    getType: () => type,
    getParent: () => null,
    getChildren: () => [],
  };
}

function makeComposer() {
  return {
    emit: vi.fn(),
    history: { undo: vi.fn(), redo: vi.fn() },
    selection: {
      getSelected: vi.fn(() => null as MockElement | null),
      /* copy and cut read the WHOLE selection now; select() keeps the single
         case in multiSelected, so this is the one they both go through. */
      getAllSelected: vi.fn(() => [] as MockElement[]),
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
    clipboard: null as { type: string }[] | null,
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

  /* These three used to carry key bindings that the shell also binds
     (`useEditorShortcuts`), and both handlers ran: measured in the editor, one
     ⌘Z fired two `history:undo` events — throwing away the text edit AND the
     element that was edited — ⇧⌘Z redid two, and ⌘P opened a popup window of
     the export on top of toggling the in-editor preview. */
  it("leaves the undo/redo/preview chords to the shell", () => {
    for (const id of ["undo", "redo", "preview"]) {
      const command = byId.get(id);
      expect(command, id).toBeTruthy();
      expect(command?.shortcut, id).toBeUndefined();
      expect(command?.shortcuts, id).toBeUndefined();
    }
  });

  it("keeps them runnable by name for the palette", () => {
    run("undo");
    run("redo");
    expect(composer.history.undo).toHaveBeenCalled();
    expect(composer.history.redo).toHaveBeenCalled();
  });
});

describe("clipboard", () => {
  it("copy serializes the selection into composer.clipboard and emits clipboard:copy", () => {
    composer.selection.getAllSelected.mockReturnValue([makeElement("el-1")]);
    run("copy");

    expect(composer.elements.serializeElement).toHaveBeenCalledWith("el-1");
    expect(composer.clipboard).toEqual(["serialized-el"]);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.CLIPBOARD_COPY, { elementIds: ["el-1"] });
  });

  /* Measured live before the fix: three elements selected, Copy put ONE on the
     clipboard and Cut removed ONE and left two (49 -> 48). Cut is the bad half
     — a destructive command silently doing a third of what it was asked. */
  it("copy takes every selected element, not just the primary", () => {
    composer.selection.getAllSelected.mockReturnValue([
      makeElement("el-1"), makeElement("el-2"), makeElement("el-3"),
    ]);
    run("copy");
    expect(composer.clipboard).toHaveLength(3);
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.CLIPBOARD_COPY, {
      elementIds: ["el-1", "el-2", "el-3"],
    });
  });

  it("cut removes every selected element inside ONE transaction", () => {
    composer.selection.getAllSelected.mockReturnValue([
      makeElement("el-1"), makeElement("el-2"), makeElement("el-3"),
    ]);
    run("cut");
    expect(composer.elements.removeElement).toHaveBeenCalledTimes(3);
    expect(composer.beginTransaction).toHaveBeenCalledTimes(1);
    expect(composer.endTransaction).toHaveBeenCalledTimes(1);
  });

  it("copy without a selection is a no-op", () => {
    run("copy");
    expect(composer.clipboard).toBeNull();
    expect(composer.emit).not.toHaveBeenCalled();
  });

  it("cut serializes, removes the element in a transaction, and emits clipboard:cut", () => {
    composer.selection.getAllSelected.mockReturnValue([makeElement("el-2")]);
    run("cut");

    expect(composer.clipboard).toEqual(["serialized-el"]);
    expect(composer.beginTransaction).toHaveBeenCalledWith("cut");
    expect(composer.elements.removeElement).toHaveBeenCalledWith("el-2");
    expect(composer.endTransaction).toHaveBeenCalled();
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.CLIPBOARD_CUT, { elementIds: ["el-2"] });
  });

  /* Paste used to target whatever was selected, with no nesting check, and to
     emit CLIPBOARD_PASTE a second time on top of the one `pasteElement`
     already sends. Live: copying a heading and pasting with that heading still
     selected put the copy INSIDE the heading — which `rules.ts` forbids
     outright — and raised two "Element pasted" toasts for one paste. */
  it("pastes into the selection when the selection can hold it", () => {
    composer.clipboard = [{ type: "heading" }];
    const target = makeElement("el-3", "container");
    composer.selection.getSelected.mockReturnValue(target);

    run("paste");

    expect(composer.elements.pasteElement).toHaveBeenCalledWith(
      composer.clipboard![0],
      target,
      undefined,
    );
  });

  it("pastes AFTER a leaf that cannot hold it, not inside it", () => {
    composer.clipboard = [{ type: "heading" }];
    const sibling = makeElement("el-sib", "heading");
    const heading = makeElement("el-h", "heading");
    const parent = makeElement("el-parent", "container");
    heading.getParent = () => parent;
    parent.getChildren = () => [sibling, heading];
    composer.selection.getSelected.mockReturnValue(heading);

    run("paste");

    expect(composer.elements.pasteElement).toHaveBeenCalledWith(composer.clipboard![0], parent, 2);
  });

  it("falls back to the page root when the parent cannot hold it either", () => {
    composer.clipboard = [{ type: "section" }];
    const root = makeElement("root-1", "container");
    const heading = makeElement("el-h", "heading");
    const parent = makeElement("el-parent", "heading");
    heading.getParent = () => parent;
    parent.getChildren = () => [heading];
    composer.selection.getSelected.mockReturnValue(heading);
    composer.elements.getActivePage.mockReturnValue({ root: { id: "root-1" } });
    composer.elements.getElement.mockReturnValue(root);

    run("paste");

    expect(composer.elements.pasteElement).toHaveBeenCalledWith(composer.clipboard![0], root, undefined);
  });

  it("announces the paste once — pasteElement already emits it", () => {
    composer.clipboard = [{ type: "heading" }];
    composer.selection.getSelected.mockReturnValue(makeElement("el-3", "container"));

    run("paste");

    expect(composer.emit).not.toHaveBeenCalledWith(
      EVENTS.CLIPBOARD_PASTE,
      expect.anything(),
    );
  });

  it("paste falls back to the active page root when nothing is selected", () => {
    composer.clipboard = [{ type: "heading" }];
    const root = makeElement("root-1", "container");
    composer.elements.getActivePage.mockReturnValue({ root: { id: "root-1" } });
    composer.elements.getElement.mockReturnValue(root);

    run("paste");

    expect(composer.elements.getElement).toHaveBeenCalledWith("root-1");
    expect(composer.elements.pasteElement).toHaveBeenCalledWith(composer.clipboard![0], root, undefined);
  });

  it("paste with an empty clipboard is a no-op", () => {
    run("paste");
    expect(composer.elements.pasteElement).not.toHaveBeenCalled();
  });
});

describe("delete / duplicate / group", () => {
  it("delete removes the selected element", () => {
    composer.selection.getAllSelected.mockReturnValue([makeElement("el-4")]);
    run("delete");
    expect(composer.elements.removeElement).toHaveBeenCalledWith("el-4");
  });

  /* Measured live at 49 -> 48 with three elements selected: delete read the
     PRIMARY element, exactly as cut did, and wrapped nothing in a transaction —
     so undoing a three-element delete would have taken three presses. */
  it("delete takes the whole selection, in one transaction", () => {
    composer.selection.getAllSelected.mockReturnValue([
      makeElement("el-1"), makeElement("el-2"), makeElement("el-3"),
    ]);
    run("delete");
    expect(composer.elements.removeElement).toHaveBeenCalledTimes(3);
    expect(composer.beginTransaction).toHaveBeenCalledTimes(1);
    expect(composer.endTransaction).toHaveBeenCalledTimes(1);
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

/* ⌘1–⌘4 used to sit on the four device presets while the canvas zoom flyout
   binds ⌘1 (fit), ⌘2 (zoom to selection), ⌘0 (100%) and ⌘= / ⌘- — the chords
   board 817:4723 prints on that flyout. Both handlers fired: measured in the
   running editor, one ⌘2 took the zoom to 104% AND set the device to tablet,
   which is where the inspector would then write styles. */
describe("device presets carry no shortcut", () => {
  it("leaves ⌘1–⌘4 to the zoom flyout that prints them", () => {
    const withShortcut = buildDefaultCommands(composer as unknown as Composer)
      .filter((c) => c.id.startsWith("device-"))
      .filter((c) => c.shortcut);
    expect(withShortcut.map((c) => c.id)).toEqual([]);
  });

  /* This case used to assert the opposite — that zoom-reset/in/out KEPT
     ctrl+0 / ctrl+= / ctrl+-. They are printed, but by the zoom flyout, which
     binds them itself in CanvasFooterToolbar; holding them here meant both
     listeners ran on one press. Measured at 100%: the flyout's + button
     stepped to the next preset, the chord stepped by 10. ⌘' was the same
     collision with a worse symptom — it flipped snapToGrid, which resize
     reads, while the user was toggling the Grid overlay. */
  it("leaves the flyout's and overlay bar's chords to the surfaces that print them", () => {
    const byId = new Map(buildDefaultCommands(composer as unknown as Composer).map((c) => [c.id, c]));
    for (const id of ["zoom-reset", "zoom-in", "zoom-out", "toggle-snap-to-grid"]) {
      expect(byId.get(id)).toBeDefined();
      expect(byId.get(id)?.shortcut).toBeUndefined();
    }
  });

  it("still exposes the presets by name for the palette", () => {
    const ids = buildDefaultCommands(composer as unknown as Composer).map((c) => c.id);
    for (const id of ["device-desktop", "device-tablet", "device-mobile", "device-watch"]) {
      expect(ids).toContain(id);
    }
  });
});
