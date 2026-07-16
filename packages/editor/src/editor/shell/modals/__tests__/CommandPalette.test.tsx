/**
 * CommandPalette.test.tsx — filtering + executing commands, keyboard
 * navigation, and a pin of the hardcoded command list (§2-B8).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CommandPalette } from "../CommandPalette";
import { EVENTS } from "../../../../shared/constants/events";
import type { Composer } from "../../../../engine";

function makeComposer() {
  return {
    emit: vi.fn(),
    history: { undo: vi.fn(), redo: vi.fn() },
    selection: { getSelectedIds: vi.fn(() => ["el-1"]) },
    elements: { removeElement: vi.fn() },
  };
}

function renderPalette(composer: ReturnType<typeof makeComposer> | null = makeComposer()) {
  const onClose = vi.fn();
  const utils = render(
    <CommandPalette onClose={onClose} composer={composer as unknown as Composer | null} />
  );
  return { onClose, composer, ...utils };
}

const commandButtons = () =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("[data-idx]"));

const searchInput = () => screen.getByPlaceholderText("Search commands...");

describe("CommandPalette", () => {
  beforeEach(() => {
    // jsdom has no execCommand — the Copy/Paste commands call it directly.
    (document as Document & { execCommand: (c: string) => boolean }).execCommand = vi.fn(
      () => true
    );
  });

  afterEach(() => {
    cleanup();
    delete (document as unknown as Record<string, unknown>).execCommand;
  });

  // ── §2-B8 pin: hardcoded command list ────────────────────────────────────
  describe("command list", () => {
    // PIN §2-B8: registry bypass — commands hardcoded here, not from a registry.
    // buildCommands() inlines the Edit (5) / View (4) / History (2) commands in
    // this file; only Navigation (11) derives from GROUPED_TABS_CONFIG (every
    // tab carries a shortcut today). Total with a composer: 22. If a command
    // registry ever lands, this pin should break and be replaced.
    it("with a composer: exactly 22 commands in 4 hardcoded groups", () => {
      renderPalette();
      expect(commandButtons()).toHaveLength(22);
      // Group section headers (hardcoded `group:` strings, not registry data).
      for (const group of ["Navigation", "Edit", "View", "History"]) {
        expect(screen.getByText(group)).toBeInTheDocument();
      }
      // Representative hardcoded entries (id → label):
      // nav-add → "Open Insert panel", edit-undo → "Undo",
      // edit-delete → "Delete element", view-zoom-in → "Zoom In",
      // history-clear → "Clear History".
      expect(screen.getByText("Open Insert panel")).toBeInTheDocument();
      expect(screen.getByText("Delete element")).toBeInTheDocument();
      expect(screen.getByText("Zoom In")).toBeInTheDocument();
      expect(screen.getByText("Clear History")).toBeInTheDocument();
      // The list even hardcodes Undo twice (edit-undo + history-undo).
      expect(screen.getByText("Undo")).toBeInTheDocument();
      expect(screen.getByText("Undo last action")).toBeInTheDocument();
    });

    // PIN §2-B8 (continued): without a composer only the 11 navigation
    // commands survive — Edit/View/History are appended after an early
    // `if (!composer) return commands;`.
    it("without a composer: only the 11 navigation commands", () => {
      renderPalette(null);
      expect(commandButtons()).toHaveLength(11);
      expect(screen.getByText("Navigation")).toBeInTheDocument();
      expect(screen.queryByText("Edit")).toBeNull();
      expect(screen.queryByText("View")).toBeNull();
      expect(screen.queryByText("History")).toBeNull();
    });
  });

  // ── filtering ──────────────────────────────────────────────────────────────
  describe("filtering", () => {
    it("filters by label substring", () => {
      renderPalette();
      fireEvent.change(searchInput(), { target: { value: "zoom" } });
      const labels = commandButtons().map((b) => b.textContent);
      expect(labels).toHaveLength(2);
      expect(labels[0]).toContain("Zoom In");
      expect(labels[1]).toContain("Zoom Out");
    });

    it("matches against the group name too", () => {
      renderPalette();
      fireEvent.change(searchInput(), { target: { value: "history" } });
      // Both History-group commands match via group text.
      const labels = commandButtons().map((b) => b.textContent ?? "");
      expect(labels.some((l) => l.includes("Undo last action"))).toBe(true);
      expect(labels.some((l) => l.includes("Clear History"))).toBe(true);
    });

    it("is case-insensitive and trims", () => {
      renderPalette();
      fireEvent.change(searchInput(), { target: { value: "  ZOOM In " } });
      // "  ZOOM In " trims/lowers to "zoom in" → 1 result.
      expect(commandButtons()).toHaveLength(1);
    });

    it("shows the empty state when nothing matches", () => {
      renderPalette();
      fireEvent.change(searchInput(), { target: { value: "xyzzy" } });
      expect(screen.getByText("No commands found")).toBeInTheDocument();
      expect(commandButtons()).toHaveLength(0);
    });

    it("clearing the query restores the full list", () => {
      renderPalette();
      fireEvent.change(searchInput(), { target: { value: "zoom" } });
      fireEvent.change(searchInput(), { target: { value: "" } });
      expect(commandButtons()).toHaveLength(22);
    });
  });

  // ── executing ──────────────────────────────────────────────────────────────
  describe("executing", () => {
    it("clicking a navigation command emits UI_PANEL_OPEN with the tab id and closes", () => {
      const { composer, onClose } = renderPalette();
      fireEvent.click(screen.getByText("Open Insert panel"));
      expect(composer!.emit).toHaveBeenCalledWith(EVENTS.UI_PANEL_OPEN, { panel: "add" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("clicking Undo runs composer.history.undo and closes", () => {
      const { composer, onClose } = renderPalette();
      fireEvent.click(screen.getByText("Undo"));
      expect(composer!.history.undo).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("'Delete element' removes the first selected element", () => {
      const { composer } = renderPalette();
      fireEvent.click(screen.getByText("Delete element"));
      expect(composer!.selection.getSelectedIds).toHaveBeenCalled();
      expect(composer!.elements.removeElement).toHaveBeenCalledWith("el-1");
    });

    it("'Copy' routes through document.execCommand", () => {
      renderPalette();
      fireEvent.click(screen.getByText("Copy"));
      expect(document.execCommand).toHaveBeenCalledWith("copy");
    });

    it("Enter executes the currently selected command (first by default)", () => {
      const { composer, onClose } = renderPalette();
      fireEvent.keyDown(searchInput(), { key: "Enter" });
      // First command = first GROUPED_TABS_CONFIG tab with a shortcut → "add".
      expect(composer!.emit).toHaveBeenCalledWith(EVENTS.UI_PANEL_OPEN, { panel: "add" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("ArrowDown moves the selection before Enter executes", () => {
      const { composer } = renderPalette();
      fireEvent.change(searchInput(), { target: { value: "zoom" } });
      fireEvent.keyDown(searchInput(), { key: "ArrowDown" });
      fireEvent.keyDown(searchInput(), { key: "Enter" });
      expect(composer!.emit).toHaveBeenCalledWith(EVENTS.ZOOM_OUT, {});
    });

    it("ArrowUp clamps at the top of the list", () => {
      const { composer } = renderPalette();
      fireEvent.change(searchInput(), { target: { value: "zoom" } });
      fireEvent.keyDown(searchInput(), { key: "ArrowUp" });
      fireEvent.keyDown(searchInput(), { key: "Enter" });
      expect(composer!.emit).toHaveBeenCalledWith(EVENTS.ZOOM_IN, {});
    });

    it("Escape closes without executing", () => {
      const { composer, onClose } = renderPalette();
      fireEvent.keyDown(searchInput(), { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(composer!.emit).not.toHaveBeenCalled();
    });

    it("clicking the backdrop closes", () => {
      const { onClose } = renderPalette();
      const backdrop = screen.getByRole("dialog", { name: "Command Palette" })
        .previousElementSibling as HTMLElement;
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("navigation commands close cleanly even without a composer", () => {
      const { onClose } = renderPalette(null);
      fireEvent.click(screen.getByText("Open Pages panel"));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
