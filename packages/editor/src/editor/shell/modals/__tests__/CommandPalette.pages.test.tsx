/**
 * CommandPalette.pages.test.tsx — the ONE palette after the B7 merge
 * (decisions #37/#38, audit G1-093 / G2-038, TODOS.md:393).
 *
 *  - A PAGES band appears only while the Pages panel has registered its rows
 *    (it does so on mount, `usePageCommands`); choosing one runs the registry
 *    command, which is what switches the page.
 *  - The retired canvas palette's rows reach ⌘K through the registry, with
 *    their keywords searchable and their group deciding the band.
 *  - "Zoom to fit" prints ⌘1 (G1-093 / SH-90: it printed "Fit to view ⌘0").
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CommandPalette } from "../CommandPalette";
import type { Composer } from "../../../../engine";
import type { CommandData } from "../../../../shared/types";

function composerWith(registry: Partial<CommandData>[]) {
  return {
    emit: vi.fn(),
    history: { undo: vi.fn(), redo: vi.fn(), canUndo: () => true, canRedo: () => true },
    selection: { getSelectedIds: () => ["el-1"], getSelected: () => ({ getType: () => "image" }) },
    clipboard: null,
    commands: { run: vi.fn(), getAll: () => registry },
  };
}

const PAGE_ROWS: Partial<CommandData>[] = [
  { id: "page-new", label: "New page", group: "Pages", run: vi.fn() },
  { id: "page-go-home", label: "Go to Home (home)", group: "Pages", run: vi.fn() },
  { id: "page-go-about", label: "Go to About", group: "Pages", run: vi.fn() },
];

const searchInput = () => screen.getByPlaceholderText("Type a command or search…");

describe("CommandPalette — Pages section", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("shows no Pages band when the Pages panel has registered nothing", () => {
    const composer = composerWith([{ id: "export-html", label: "Export HTML", run: vi.fn() }]);
    render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
    expect(screen.queryByTestId("cmdk-band-pages")).toBeNull();
    expect(screen.queryByTestId(/^cmdk-row-cmd-page-/)).toBeNull();
  });

  it("bands the registered page rows under PAGES, ahead of Suggested", () => {
    const composer = composerWith(PAGE_ROWS);
    render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
    const bands = screen.getAllByTestId(/^cmdk-band-/).map((el) => el.textContent);
    expect(bands.indexOf("Pages")).toBeGreaterThanOrEqual(0);
    expect(bands.indexOf("Pages")).toBeLessThan(bands.indexOf("Suggested"));
    expect(screen.getByTestId("cmdk-row-cmd-page-go-about")).toBeInTheDocument();
    expect(screen.getByTestId("cmdk-row-cmd-page-new")).toBeInTheDocument();
  });

  it("choosing a page row runs the registry command that switches the page, and closes", () => {
    const composer = composerWith(PAGE_ROWS);
    const onClose = vi.fn();
    render(<CommandPalette onClose={onClose} composer={composer as unknown as Composer} />);
    fireEvent.click(screen.getByTestId("cmdk-row-cmd-page-go-about"));
    expect(composer.commands.run).toHaveBeenCalledWith("page-go-about");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("a page row is found by typing the page name", () => {
    const composer = composerWith(PAGE_ROWS);
    render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
    fireEvent.change(searchInput(), { target: { value: "about" } });
    expect(screen.getByTestId("cmdk-row-cmd-page-go-about")).toBeInTheDocument();
    expect(screen.queryByTestId("cmdk-row-cmd-page-go-home")).toBeNull();
  });
});

describe("CommandPalette — the merged canvas rows", () => {
  beforeEach(() => localStorage.clear());
  afterEach(cleanup);

  it("registry keywords are searchable — 'photo' finds Add image", () => {
    const composer = composerWith([
      { id: "add-image", label: "Add image", group: "Insert", keywords: ["picture", "photo"], run: vi.fn() },
    ]);
    render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
    fireEvent.change(searchInput(), { target: { value: "photo" } });
    expect(screen.getByTestId("cmdk-row-cmd-add-image")).toBeInTheDocument();
  });

  it("a Navigation-group registry row bands under GO TO with the panel rows", () => {
    const composer = composerWith([
      { id: "open-integrations", label: "Open integrations", group: "Navigation", run: vi.fn() },
    ]);
    render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
    fireEvent.change(searchInput(), { target: { value: "integrations" } });
    const bands = screen.getAllByTestId(/^cmdk-band-/).map((el) => el.textContent);
    expect(bands).toEqual(["Go to"]);
  });

  it("a registry row that needs a selection is disabled with the reason when nothing is selected", () => {
    const composer = {
      ...composerWith([
        { id: "replace-media", label: "Replace selected media", group: "Tools", requiresSelection: true, run: vi.fn() },
      ]),
      selection: { getSelectedIds: () => [], getSelected: () => null },
    };
    render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
    const row = screen.getByTestId("cmdk-row-cmd-replace-media");
    expect(row).toHaveAttribute("aria-disabled", "true");
    expect(row).toHaveTextContent("nothing selected");
  });

  it("Zoom to fit prints ⌘1 / Ctrl+1, not Ctrl+0", () => {
    const composer = composerWith([]);
    render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
    expect(screen.getByTestId("cmdk-kbd-view-fit")).toHaveTextContent("Ctrl+1");
    expect(screen.queryByText("Fit to view")).toBeNull();
  });

  it("a registry chord spelled the registry's way prints like the hardcoded ones", () => {
    const composer = composerWith([
      { id: "ui-open-exporter", label: "Open exporter", group: "Panels", shortcut: "ctrl+shift+e", run: vi.fn() },
    ]);
    render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
    expect(screen.getByTestId("cmdk-kbd-cmd-ui-open-exporter")).toHaveTextContent("Ctrl+Shift+E");
  });
});
