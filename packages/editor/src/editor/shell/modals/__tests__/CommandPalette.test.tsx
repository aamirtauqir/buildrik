/**
 * CommandPalette — the ONE ⌘K palette, to board 4418:141220 (v3 "Commands ·
 * navigation and page actions"). Rewritten 2026-09-24 with the parity pass:
 * the V1 boards (166:*) this suite used to pin drew RECENT / SUGGESTED / GO
 * TO / ACTIONS strips, 40px rows and a chord on every row; v3 draws the
 * curated NAVIGATE · EDIT · VIEW · ADD · TOOLS list at 32px, chords only on
 * actions, a scope chip and a legend foot. Behaviour contracts that survive
 * (engine commands, guards, keys, a11y, Pages band, no-results) are kept.
 * (CommandPalette.pages.test.tsx is folded in here.)
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { CommandPalette } from "../CommandPalette";
import { EVENTS } from "../../../../shared/constants/events";
import type { Composer } from "../../../../engine";

type Reg = {
  id: string;
  label?: string;
  group?: string;
  shortcut?: string;
  keywords?: string[];
  requiresSelection?: boolean;
};

function makeComposer(
  opts: { registry?: Reg[]; selected?: string[]; type?: string; clipboard?: unknown[] | null; canUndo?: boolean } = {},
) {
  const selected = opts.selected ?? [];
  return {
    emit: vi.fn(),
    setZoom: vi.fn(),
    history: { undo: vi.fn(), redo: vi.fn(), canUndo: vi.fn(() => opts.canUndo ?? true), canRedo: vi.fn(() => true) },
    selection: {
      getSelectedIds: vi.fn(() => selected),
      getSelected: vi.fn(() => (selected.length ? { getType: () => opts.type ?? "heading" } : null)),
    },
    elements: { removeElement: vi.fn(), getActivePage: () => ({ name: "Home" }) },
    clipboard: opts.clipboard ?? null,
    commands: { run: vi.fn(), getAll: () => opts.registry ?? [] },
  };
}

const BOARD_REGISTRY: Reg[] = [
  { id: "undo", label: "Undo", shortcut: "ctrl+z" },
  { id: "redo", label: "Redo", shortcut: "ctrl+shift+z" },
  { id: "duplicate", label: "Duplicate", shortcut: "ctrl+d", requiresSelection: true },
  { id: "replace-media", label: "Replace selected media", requiresSelection: true },
  { id: "add-text", label: "Add text" },
  { id: "add-container", label: "Add container" },
  { id: "cms-records", label: "Manage CMS records" },
  { id: "save-template", label: "Save page as template" },
  { id: "export-html", label: "Export HTML" },
  { id: "delete", label: "Delete element", requiresSelection: true },
  { id: "copy", label: "Copy", requiresSelection: true },
  { id: "paste", label: "Paste" },
  { id: "group", label: "Group", shortcut: "ctrl+g" },
  { id: "ungroup", label: "Ungroup", shortcut: "ctrl+shift+g" },
  { id: "add-image", label: "Add image", keywords: ["photo", "picture"] },
];

function renderPalette(
  composer: ReturnType<typeof makeComposer> | null = makeComposer({ registry: BOARD_REGISTRY }),
  initialQuery?: string,
) {
  const onClose = vi.fn();
  render(
    <CommandPalette onClose={onClose} composer={composer as unknown as Composer | null} initialQuery={initialQuery} />,
  );
  return { onClose, composer };
}

const input = () => screen.getByPlaceholderText("Search pages, layers, assets and actions…");
const type = (q: string) => fireEvent.change(input(), { target: { value: q } });
const bands = () => screen.queryAllByTestId(/^cmdk-band-/).map((b) => b.textContent);
const labels = () => screen.queryAllByTestId(/^cmdk-label-/).map((l) => l.textContent ?? "");

afterEach(cleanup);

describe("CommandPalette — board 4418:141220 structure", () => {
  it("draws the board's input, scope chip, bands and legend", () => {
    renderPalette();
    expect(input()).toBeInTheDocument();
    expect(screen.getByTestId("cmdk-scope")).toHaveTextContent("Scope: everything");
    expect(bands()).toEqual(["Navigate", "Edit", "View", "Add", "Tools"]);
    expect(screen.getByTestId("cmdk-legend")).toHaveTextContent(/Click a command\s*Esc Close\s*Current editor/);
  });

  it("lists the board's rows in its order, and nothing else before you type", () => {
    renderPalette();
    expect(labels()).toEqual([
      "Open Pages", "Open Add", "Open Layers", "Open Assets", "Open Asset library", "Open CMS", "Open Brand",
      "Open Publish", "Open AI assistant", "Browse Templates", "Open Review", "Open Activity", "Open Issues",
      "Open Site settings", "Open Components", "Keyboard shortcuts",
      "Undo", "Duplicate · Select an element first", "Replace selected media · Select an element first",
      "Zoom to 50%", "Preview Home page",
      "Add text", "Add container", "Generate a block with AI…",
      "Manage CMS records", "Save page as template", "Replace layout with template…", "Open History",
      "Search stock photos",
    ]);
  });

  it("disabled rows are aria-disabled; actions print a chord, doors do not", () => {
    renderPalette();
    expect(screen.getByTestId("cmdk-row-cmd-duplicate")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByTestId("cmdk-kbd-cmd-duplicate")).toBeInTheDocument();
    expect(screen.queryByTestId("cmdk-kbd-nav-pages")).toBeNull();
  });

  it("Undo says 'No changes to undo' when there is nothing to undo", () => {
    renderPalette(makeComposer({ registry: BOARD_REGISTRY, canUndo: false }));
    expect(screen.getByTestId("cmdk-label-edit-undo")).toHaveTextContent("Undo · No changes to undo");
  });

  it("without a composer: only the navigation rows, which close cleanly", () => {
    const { onClose } = renderPalette(null);
    expect(bands()).toEqual(["Navigate"]);
    fireEvent.click(screen.getByText("Open Pages"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("CommandPalette — doors", () => {
  const doors: Array<[string, string, unknown]> = [
    ["Open Pages", EVENTS.UI_PANEL_OPEN, { panel: "pages" }],
    ["Open Asset library", EVENTS.UI_SWITCH_TAB, { tab: "assets", fullPage: true }],
    ["Open AI assistant", EVENTS.UI_SWITCH_TAB, { tab: "ai" }],
    ["Browse Templates", EVENTS.UI_PANEL_OPEN, { panel: "templates" }],
    ["Open Activity", EVENTS.UI_PANEL_OPEN, { panel: "activity" }],
    ["Open Issues", EVENTS.UI_OPEN_ISSUES, undefined],
    ["Keyboard shortcuts", EVENTS.UI_TOGGLE_CHEAT_SHEET, {}],
    ["Generate a block with AI…", EVENTS.UI_SWITCH_TAB, { tab: "ai" }],
    ["Replace layout with template…", EVENTS.UI_BROWSE_TEMPLATES, {}],
    ["Open History", EVENTS.UI_PANEL_OPEN, { panel: "history" }],
    ["Search stock photos", EVENTS.UI_PANEL_OPEN, { panel: "assets", screen: "stock" }],
  ];
  for (const [label, event, payload] of doors) {
    it(`${label} emits its door and closes`, () => {
      const { composer, onClose } = renderPalette();
      fireEvent.click(screen.getByText(label));
      expect(composer!.emit).toHaveBeenCalledWith(event, payload);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  }

  it("Zoom to 50% sets the zoom", () => {
    const { composer } = renderPalette();
    fireEvent.click(screen.getByText("Zoom to 50%"));
    expect(composer!.setZoom).toHaveBeenCalledWith(50);
  });

  it("Undo runs the history", () => {
    const { composer } = renderPalette();
    fireEvent.click(screen.getByTestId("cmdk-row-edit-undo"));
    expect(composer!.history.undo).toHaveBeenCalledTimes(1);
  });

  it("a disabled row runs nothing and stays open", () => {
    const { composer, onClose } = renderPalette();
    fireEvent.click(screen.getByTestId("cmdk-row-cmd-duplicate"));
    expect(composer!.commands.run).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("CommandPalette — search", () => {
  it("filters every command by label, case-insensitively and trimmed", () => {
    renderPalette();
    type("  EXPORT ");
    expect(labels()).toEqual(["Export HTML"]);
    expect(bands()).toEqual(["More"]);
  });

  it("registry keywords are searchable — 'photo' finds Add image", () => {
    renderPalette();
    type("photo");
    expect(labels()).toContain("Add image");
  });

  it("clearing the query restores the opening list", () => {
    renderPalette();
    type("export");
    type("");
    expect(bands()).toEqual(["Navigate", "Edit", "View", "Add", "Tools"]);
  });

  it("C4 #19: \"New page\" answers from anywhere (no Pages rows registered) and asks for the New-page modal", () => {
    const { composer } = renderPalette(makeComposer({ registry: BOARD_REGISTRY }));
    expect(labels()).not.toContain("New page");
    type("new page");
    fireEvent.click(screen.getByTestId("cmdk-row-add-new-page"));
    expect(composer!.emit).toHaveBeenCalledWith(EVENTS.UI_NEW_PAGE_REQUESTED, {});
  });

  it("runs a registry command through the CommandCenter — Delete element takes the selection", () => {
    const { composer } = renderPalette(makeComposer({ registry: BOARD_REGISTRY, selected: ["a"] }));
    type("delete");
    fireEvent.click(screen.getByText("Delete element"));
    expect(composer!.commands.run).toHaveBeenCalledWith("delete");
    expect(composer!.elements.removeElement).not.toHaveBeenCalled();
  });

  it("guards Copy on the selection and Paste on the clipboard", () => {
    renderPalette(makeComposer({ registry: BOARD_REGISTRY, clipboard: null }));
    type("copy");
    expect(screen.getByTestId("cmdk-label-cmd-copy")).toHaveTextContent("Copy · Select an element first");
    type("paste");
    expect(screen.getByTestId("cmdk-label-cmd-paste")).toHaveTextContent("Paste · nothing copied");
  });

  it("guards Group until two are selected and Ungroup unless it is a container", () => {
    renderPalette(makeComposer({ registry: BOARD_REGISTRY, selected: ["a"], type: "heading" }));
    type("group");
    expect(screen.getByTestId("cmdk-row-cmd-group")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByTestId("cmdk-label-cmd-ungroup")).toHaveTextContent("select a group");
  });

  it("Zoom to fit prints ⌘1 / Ctrl+1, not Ctrl+0", () => {
    renderPalette();
    type("fit");
    expect(screen.getByTestId("cmdk-kbd-view-fit").textContent).toMatch(/1$/);
  });

  it("a query that matches nothing offers stock photos for it, and AI", () => {
    const { composer, onClose } = renderPalette();
    type("zzqq");
    expect(screen.getByTestId("cmdk-no-results-line")).toHaveTextContent("Nothing matches ‘zzqq’.");
    fireEvent.click(screen.getByTestId("cmdk-no-results-stock"));
    expect(composer!.emit).toHaveBeenCalledWith(EVENTS.UI_PANEL_OPEN, { panel: "assets", screen: "stock:zzqq" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Enter on no results asks AI", () => {
    const { composer } = renderPalette();
    type("zzqq");
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(composer!.emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "ai" });
  });

  it("starts with a handed query (G2-059)", () => {
    renderPalette(undefined, "pages");
    expect(input()).toHaveValue("pages");
  });
});

describe("CommandPalette — Pages band", () => {
  const PAGE_ROWS: Reg[] = [
    { id: "page-new", label: "New page", group: "Pages" },
    { id: "page-go-about", label: "Go to About", group: "Pages" },
  ];

  it("no PAGES band when the Pages panel registered nothing", () => {
    renderPalette();
    expect(screen.queryByTestId("cmdk-band-pages")).toBeNull();
  });

  it("the panel's rows band under PAGES, first, and run their registry command", () => {
    const { composer } = renderPalette(makeComposer({ registry: [...BOARD_REGISTRY, ...PAGE_ROWS] }));
    expect(bands()[0]).toBe("Pages");
    fireEvent.click(screen.getByText("Go to About"));
    expect(composer!.commands.run).toHaveBeenCalledWith("page-go-about");
  });

  it("a page row is found by its name", () => {
    renderPalette(makeComposer({ registry: [...BOARD_REGISTRY, ...PAGE_ROWS] }));
    type("about");
    expect(labels()).toEqual(["Go to About"]);
  });
});

describe("CommandPalette — keys and a11y", () => {
  it("Enter runs the highlighted row; ArrowUp clamps; ArrowDown moves", () => {
    const { composer } = renderPalette();
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(composer!.emit).toHaveBeenCalledWith(EVENTS.UI_PANEL_OPEN, { panel: "add" });
  });

  it("Escape closes from the input and from a row; Esc Close and the click-catcher close too", () => {
    const { onClose } = renderPalette();
    fireEvent.keyDown(input(), { key: "Escape" });
    fireEvent.keyDown(screen.getAllByRole("option")[2], { key: "Escape" });
    fireEvent.click(screen.getByText("Esc Close"));
    fireEvent.click(screen.getByRole("dialog", { name: "Command Palette" }).previousElementSibling as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(4);
  });

  it("the input is a combobox pointing at the highlighted option of the listbox", () => {
    renderPalette();
    const box = input();
    expect(box).toHaveAttribute("role", "combobox");
    const list = screen.getByRole("listbox", { name: "Commands" });
    expect(box.getAttribute("aria-activedescendant")).toBe(within(list).getAllByRole("option")[0].id);
    fireEvent.keyDown(box, { key: "ArrowDown" });
    expect(box.getAttribute("aria-activedescendant")).toBe(within(list).getAllByRole("option")[1].id);
  });
});
