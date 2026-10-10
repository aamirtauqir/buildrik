/**
 * L1-033 (owner 2026-10-10): the palette's Add commands are generated from
 * the element catalog (searchable only — the opening list stays the board's
 * curated set), matching is tightened to word starts, duplicates are dropped,
 * zoom rows carry one set of labels, and Add rows appear only where an
 * insert can happen.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const mockViewerChrome = vi.hoisted(() => vi.fn<() => boolean>(() => false));
vi.mock("@/editor/shell/hooks/useEditorRole", () => ({ useViewerChrome: () => mockViewerChrome() }));

import { CommandPalette } from "../CommandPalette";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "@/engine";

type Reg = { id: string; label?: string; group?: string; shortcut?: string; keywords?: string[]; requiresSelection?: boolean };

const REGISTRY: Reg[] = [
  { id: "undo", label: "Undo", shortcut: "ctrl+z" },
  { id: "redo", label: "Redo", shortcut: "ctrl+shift+z" },
  { id: "duplicate", label: "Duplicate", requiresSelection: true },
  { id: "add-text", label: "Add text", keywords: ["paragraph"] },
  { id: "add-heading", label: "Add heading", keywords: ["title"] },
  { id: "add-container", label: "Add container" },
  { id: "delete", label: "Delete element", requiresSelection: true },
  { id: "zoom-reset", label: "Zoom to 100%" },
];

function makeComposer(opts: { page?: boolean; darkMode?: string } = {}) {
  return {
    emit: vi.fn(),
    setZoom: vi.fn(),
    history: { undo: vi.fn(), redo: vi.fn(), clear: vi.fn(), canUndo: () => true, canRedo: () => true },
    selection: { getSelectedIds: () => [], getSelected: () => null },
    elements: { getActivePage: () => (opts.page === false ? null : { name: "Home" }) },
    getProjectSettings: () => ({ darkMode: opts.darkMode ?? "off" }),
    clipboard: null,
    commands: { run: vi.fn(), getAll: () => REGISTRY },
  };
}

function renderPalette(composer = makeComposer()) {
  render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} reviewsEnabled />);
  return composer;
}
const input = () => screen.getByPlaceholderText("Search pages, layers, assets and actions…");
const type = (q: string) => fireEvent.change(input(), { target: { value: q } });
const labels = () => screen.queryAllByTestId(/^cmdk-label-/).map((l) => l.textContent ?? "");

afterEach(() => {
  cleanup();
  mockViewerChrome.mockReturnValue(false);
});
beforeEach(() => localStorage.clear());

describe("CommandPalette — Add commands from the catalog (L1-033)", () => {
  it("are searchable only: the opening list keeps the curated Add rows", () => {
    renderPalette();
    expect(labels()).not.toContain("Add accordion");
    expect(labels()).toContain("Add text");
  });

  it("answers an element by name and inserts it through Add's insert path", () => {
    const composer = renderPalette();
    type("accordion");
    fireEvent.click(screen.getByText("Add accordion"));
    expect(composer.emit).toHaveBeenCalledWith(
      EVENTS.UI_INSERT_BLOCK,
      expect.objectContaining({ block: expect.objectContaining({ id: "accordion", label: "Accordion" }) }),
    );
  });

  it("covers the catalog (Divider, Video, Social icons, SVG)", () => {
    renderPalette();
    for (const [q, label] of [["divider", "Add divider"], ["video", "Add video"], ["social", "Add social icons"], ["svg", "Add SVG"]]) {
      type(q);
      expect(labels(), q).toContain(label);
    }
  });

  it("never prints a command twice: the registry's Add text / heading / container win", () => {
    renderPalette();
    type("add text");
    expect(labels().filter((l) => l === "Add text")).toHaveLength(1);
    type("container");
    expect(labels().filter((l) => l === "Add container")).toHaveLength(1);
  });

  it("only where an insert can happen: none without a page, none for a viewer", () => {
    renderPalette(makeComposer({ page: false }));
    type("accordion");
    expect(labels()).not.toContain("Add accordion");
    cleanup();
    mockViewerChrome.mockReturnValue(true);
    renderPalette();
    type("accordion");
    expect(labels()).not.toContain("Add accordion");
  });

  it("offers the theme toggle only while Dark mode is Auto, like Add", () => {
    renderPalette(makeComposer({ darkMode: "off" }));
    type("theme");
    expect(labels()).not.toContain("Add theme toggle");
    cleanup();
    renderPalette(makeComposer({ darkMode: "auto" }));
    type("theme");
    expect(labels()).toContain("Add theme toggle");
  });
});

describe("CommandPalette — tighter matching (L1-033)", () => {
  it("matches the start of a word, not the middle of one", () => {
    renderPalette();
    type("ext");
    expect(labels()).not.toContain("Add text");
    type("tex");
    expect(labels()).toContain("Add text");
  });

  it("ranks a label hit above a keyword-only hit in the same band", () => {
    renderPalette();
    type("delete");
    const rows = labels();
    expect(rows.indexOf("Delete element · Select an element first")).toBeLessThan(rows.indexOf("Permissions"));
  });
});

describe("CommandPalette — one set of zoom labels (L1-033)", () => {
  it("names the zoom rows like the keyboard sheet, each once", () => {
    renderPalette();
    type("zoom");
    const zoom = labels();
    for (const l of ["Zoom in", "Zoom out", "Zoom to 100%", "Zoom to fit", "Zoom to selection", "Zoom to 50%"]) {
      expect(zoom.filter((x) => x === l), l).toHaveLength(1);
    }
    expect(zoom).not.toContain("Reset zoom");
  });

  it("'reset' still finds Zoom to 100%", () => {
    renderPalette();
    type("reset");
    expect(labels()).toContain("Zoom to 100%");
  });
});
