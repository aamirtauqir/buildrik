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
    history: { undo: vi.fn(), redo: vi.fn(), canUndo: vi.fn(() => true), canRedo: vi.fn(() => true) },
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
    // Recents are localStorage-backed (S3.14); clear so a command run in one
    // test doesn't add a "Recent" group to the next (which would break the
    // exact-count pins).
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    delete (document as unknown as Record<string, unknown>).execCommand;
  });

  // ── §2-B8 pin: hardcoded command list ────────────────────────────────────
  describe("command list", () => {
    // PIN §2-B8: registry bypass — commands hardcoded here, not from a registry.
    // buildCommands() inlines the Edit (5) / View (4) / History (2) commands in
    // this file; only Navigation (13) derives from GROUPED_TABS_CONFIG (every
    // tab with a shortcut — the `review` tab (P0) added one, so nav is 13).
    // Total with a composer: 24. If a command registry ever lands, this pin
    // should break and be replaced.
    it("with a composer: exactly 24 commands in 4 hardcoded groups", () => {
      renderPalette();
      expect(commandButtons()).toHaveLength(24);
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

    // PIN §2-B8 (continued): without a composer only the 13 navigation
    // commands survive — Edit/View/History are appended after an early
    // `if (!composer) return commands;`.
    it("without a composer: only the 13 navigation commands", () => {
      renderPalette(null);
      expect(commandButtons()).toHaveLength(13);
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

    it("offers Ask AI (not a dead end) when nothing matches a non-empty query", () => {
      renderPalette();
      fireEvent.change(searchInput(), { target: { value: "xyzzy" } });
      // No command rows, but the ai-offer replaces the old "No commands found".
      expect(screen.queryByText("No commands found")).toBeNull();
      expect(screen.getByText(/Ask AI instead/)).toBeInTheDocument();
    });

    it("clearing the query restores the full list", () => {
      renderPalette();
      fireEvent.change(searchInput(), { target: { value: "zoom" } });
      fireEvent.change(searchInput(), { target: { value: "" } });
      expect(commandButtons()).toHaveLength(24);
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

  // ── S3.14: ai-offer + recents ────────────────────────────────────────────
  describe("ai-offer (no results)", () => {
    it("offers Ask AI on a query that matches nothing, and opens the AI panel", () => {
      const { composer, onClose } = renderPalette();
      fireEvent.change(searchInput(), { target: { value: "zzzznotacommand" } });
      const askAI = screen.getByRole("button", { name: /Ask AI instead/ });
      expect(askAI).toBeInTheDocument();
      fireEvent.click(askAI);
      /* Was UI_PANEL_OPEN {panel:"ai"} — allow-listed to real LEFT tabs, which
         "ai" is not, so the offer had been a no-op since it shipped. AI opens
         over the inspector (boards 170:*), which ui:switch-tab routes. */
      expect(composer!.emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "ai" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("Enter triggers Ask AI when the query matches nothing", () => {
      const { composer } = renderPalette();
      fireEvent.change(searchInput(), { target: { value: "zzzznope" } });
      fireEvent.keyDown(searchInput(), { key: "Enter" });
      /* Was UI_PANEL_OPEN {panel:"ai"} — allow-listed to real LEFT tabs, which
         "ai" is not, so the offer had been a no-op since it shipped. AI opens
         over the inspector (boards 170:*), which ui:switch-tab routes. */
      expect(composer!.emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "ai" });
    });
  });

  // ── S3.14 B8: registry-backed commands reachable via ⌘K ──────────────────
  describe("registry merge (B8)", () => {
    function composerWithRegistry() {
      const run = vi.fn();
      return {
        ...makeComposer(),
        commands: {
          run,
          getAll: () => [
            { id: "export-html", label: "Export HTML", run: vi.fn() },
            { id: "undo", label: "Undo", run: vi.fn() }, // dup label — must be skipped
          ],
        },
      };
    }

    it("surfaces registry commands the hardcoded list never had (Export HTML)", () => {
      const composer = composerWithRegistry();
      render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
      expect(screen.getByText("Export HTML")).toBeInTheDocument();
      expect(screen.getByText("Commands")).toBeInTheDocument(); // the registry group
    });

    it("runs a registry command through the CommandCenter", () => {
      const composer = composerWithRegistry();
      render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
      fireEvent.click(screen.getByText("Export HTML"));
      expect(composer.commands.run).toHaveBeenCalledWith("export-html");
    });

    it("dedupes by label — an already-hardcoded command (Undo) is not doubled by the registry", () => {
      const composer = composerWithRegistry();
      render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
      // The hardcoded Edit group has one exact "Undo"; the registry's dup "Undo"
      // is skipped, so it stays 1 (would be 2 without dedup).
      expect(screen.getAllByText("Undo")).toHaveLength(1);
    });
  });

  describe("recents (S3.14)", () => {
    it("shows a Recent group on open after a command has been run", () => {
      // First mount: run Undo (records it to localStorage).
      const first = renderPalette();
      fireEvent.click(screen.getByText("Undo"));
      first.unmount();
      // Second mount reads recents → a Recent group with Undo, before the rest.
      renderPalette();
      expect(screen.getByText("Recent")).toBeInTheDocument();
      // Undo now appears twice: once under Recent, once under its real group.
      expect(screen.getAllByText("Undo").length).toBeGreaterThanOrEqual(2);
    });

    it("no Recent group when nothing has run yet", () => {
      renderPalette();
      expect(screen.queryByText("Recent")).not.toBeInTheDocument();
    });
  });

  // ── P4 board states ─────────────────────────────────────────────────────────
  describe("no-results / ai-offer / disabled (boards 166:45/51/58)", () => {
    it("single-token garbage → 'Nothing matches' + Ask AI instead", () => {
      const composer = makeComposer();
      renderPalette(composer);
      fireEvent.change(searchInput(), { target: { value: "qqp" } });
      expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /Ask AI instead/ }));
      expect(composer.emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "ai" });
    });

    it("natural-language query → AI hand-off with the diff explainer", () => {
      renderPalette();
      fireEvent.change(searchInput(), { target: { value: "make the hero warmer" } });
      expect(screen.getByText(/That isn’t a command — send it to AI\?/)).toBeInTheDocument();
      expect(screen.getByText(/AI proposes a diff and never writes directly/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Ask AI ›/ })).toBeInTheDocument();
    });

    it("disabled command stays visible with its reason and doesn't run", () => {
      const composer = makeComposer();
      composer.history.canUndo.mockReturnValue(false);
      renderPalette(composer);
      fireEvent.change(searchInput(), { target: { value: "undo" } });
      const rows = screen.getAllByText("Undo");
      expect(rows.length).toBeGreaterThan(0);
      expect(screen.getAllByText("nothing to undo").length).toBeGreaterThan(0);
      const row = rows[0].closest("button") as HTMLElement;
      expect(row).toHaveAttribute("aria-disabled", "true");
      fireEvent.click(row);
      expect(composer.history.undo).not.toHaveBeenCalled();
    });
  });
});
