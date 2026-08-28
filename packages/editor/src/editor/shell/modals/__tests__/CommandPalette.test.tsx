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

const searchInput = () => screen.getByPlaceholderText("Type a command or search…");

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

  // ── the command list ─────────────────────────────────────────────────────
  describe("command list", () => {
    /* The §2-B8 pin here said "registry bypass — commands hardcoded, not from a
       registry", and that stopped being true when B8 was fixed:
       `buildCommands` still inlines Edit/View/History and derives Navigation
       from GROUPED_TABS_CONFIG, but it then appends every CommandCenter
       command not already covered. Confirmed in the running editor — ⌘K finds
       "Tablet View", "Toggle Snap to Grid", "Bring to Front" and "Group",
       none of which appear in this file. The counts below are the hardcoded
       head, which is what these tests exercise with a stub composer. */
    /* Boards 166:2 / 166:27 band by what a row DOES — Recent · Suggested
       before you type, Actions · Go to after — not by which internal group
       owns it. The `group:` strings are still the filter's material; they are
       no longer what the reader sees. */
    /* 24 -> 22 on 2026-08-23: the hardcoded Copy and Paste rows were removed.
       They ran document.execCommand, which cannot reach the editor's element
       clipboard, and — because the registry loop dedups by label — they also
       kept the engine's real `copy` and `paste` out of the palette entirely.
       This stub composer has no registry, so here they simply go; live the
       registry supplies them, guarded. 22 -> 21 in the same arc when the
       hardcoded "Delete element" row went the same way — it duplicated the
       registry's `delete` and, like it, removed exactly one element. */
    it("with a composer: exactly 21 hardcoded commands, banded the way the boards band them", () => {
      renderPalette();
      expect(commandButtons()).toHaveLength(21);
      expect(screen.getByText("Suggested")).toBeInTheDocument();
      for (const internal of ["Navigation", "Edit", "View", "History"]) {
        expect(screen.queryByText(internal)).toBeNull();
      }
      // Representative hardcoded entries (id → label):
      // nav-add → "Open Insert panel", edit-undo → "Undo",
      // view-zoom-in → "Zoom in", history-clear → "Clear history".
      // "Delete element" is deliberately NOT here any more: it comes from the
      // registry, which this stub composer does not have.
      expect(screen.getByText("Open Insert panel")).toBeInTheDocument();
      expect(screen.queryByText("Delete element")).toBeNull();
      expect(screen.getByText("Zoom in")).toBeInTheDocument();
      expect(screen.getByText("Clear history")).toBeInTheDocument();
      // The list even hardcodes Undo twice (edit-undo + history-undo).
      expect(screen.getByText("Undo")).toBeInTheDocument();
      expect(screen.getByText("Undo last action")).toBeInTheDocument();
    });

    /* Without a composer only the 13 navigation commands survive —
       Edit/View/History (and the registry append) come after an early
       `if (!composer) return commands;`. */
    it("without a composer: only the 13 navigation commands", () => {
      renderPalette(null);
      expect(commandButtons()).toHaveLength(13);
      // All navigation, so past the suggested head every band is "Go to".
      expect(screen.getByText("Go to")).toBeInTheDocument();
      expect(screen.queryByText("Actions")).toBeNull();
    });
  });

  // ── filtering ──────────────────────────────────────────────────────────────
  describe("filtering", () => {
    it("filters by label substring", () => {
      renderPalette();
      fireEvent.change(searchInput(), { target: { value: "zoom" } });
      const labels = commandButtons().map((b) => b.textContent);
      expect(labels).toHaveLength(2);
      expect(labels[0]).toContain("Zoom in");
      expect(labels[1]).toContain("Zoom out");
    });

    it("matches against the group name too", () => {
      renderPalette();
      fireEvent.change(searchInput(), { target: { value: "history" } });
      // Both History-group commands match via group text.
      const labels = commandButtons().map((b) => b.textContent ?? "");
      expect(labels.some((l) => l.includes("Undo last action"))).toBe(true);
      expect(labels.some((l) => l.includes("Clear history"))).toBe(true);
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
      expect(commandButtons()).toHaveLength(21);
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

    /* Rewritten 2026-08-23. "removes the FIRST selected element" was the
       defect, stated as a requirement: the hardcoded row read getSelectedIds()
       for its guard and then deleted ids[0], so a three-element selection lost
       one. The row is gone — it duplicated the registry's `delete`, which is
       multi-aware and transactional now — and the palette runs that. */
    it("'Delete element' runs the engine command, which takes the whole selection", () => {
      const run = vi.fn();
      const composer = {
        ...makeComposer(),
        commands: { run, getAll: () => [{ id: "delete", label: "Delete element", run: vi.fn() }] },
      };
      render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
      fireEvent.click(screen.getByText("Delete element"));
      expect(run).toHaveBeenCalledWith("delete");
      expect(composer.elements.removeElement).not.toHaveBeenCalled();
    });

    /* Rewritten 2026-08-23. This asserted the bug: Copy was a hardcoded
       `document.execCommand("copy")` entry, and because the registry loop
       dedups by LABEL, that entry also SHADOWED the engine's real `copy`
       command out of the palette. Paste was worse — execCommand("paste") is
       refused by every modern browser, so the only Paste a user could reach
       did nothing at all. Both come from the registry now. */
    it("'Copy' runs the engine command, not document.execCommand", () => {
      const run = vi.fn();
      const composer = { ...makeComposer(), clipboard: null,
        commands: { run, getAll: () => [{ id: "copy", label: "Copy", shortcut: "ctrl+c", run: vi.fn() }] } };
      render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
      fireEvent.click(screen.getByText("Copy"));
      expect(run).toHaveBeenCalledWith("copy");
      expect(document.execCommand).not.toHaveBeenCalledWith("copy");
    });

    it("'Paste' runs the engine command and never document.execCommand", () => {
      const run = vi.fn();
      /* clipboard non-null or the guard disables the row, which is the point of
         the next test. */
      /* An array — the clipboard holds the whole selection now, and the guard
         reads `.length`. */
      const composer = { ...makeComposer(), clipboard: [{ type: "heading" }],
        commands: { run, getAll: () => [{ id: "paste", label: "Paste", shortcut: "ctrl+v", run: vi.fn() }] } };
      render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
      fireEvent.click(screen.getByText("Paste"));
      expect(run).toHaveBeenCalledWith("paste");
      expect(document.execCommand).not.toHaveBeenCalledWith("paste");
    });

    /* Both were unguarded when they were hardcoded: the palette offered Copy
       with nothing selected and Paste with an empty clipboard, and both looked
       perfectly available. Live-verified 2026-08-23: Paste disabled reading
       "nothing copied", enabled after a Copy, and the paste added an element
       (49 -> 50, undone). */
    it("guards Copy on the selection and Paste on the clipboard", () => {
      const composer = {
        ...makeComposer(),
        selection: { getSelectedIds: vi.fn(() => []), getSelected: vi.fn(() => null) },
        clipboard: null,
        commands: { run: vi.fn(), getAll: () => [
          { id: "copy", label: "Copy", run: vi.fn() },
          { id: "paste", label: "Paste", run: vi.fn() },
        ] },
      };
      render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
      /* Scope to the rows: "nothing selected" is also Delete element's reason,
         so a bare getByText matches more than one node. */
      const row = (label: string) =>
        commandButtons().find((b) => (b.textContent ?? "").startsWith(label));
      expect(row("Copy")?.textContent).toContain("nothing selected");
      expect(row("Paste")?.textContent).toContain("nothing copied");
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
            /* Copy and Paste come from the registry now, not from the
               hardcoded head. Live there are 39 of these. */
            { id: "copy", label: "Copy", shortcut: "ctrl+c", run: vi.fn() },
            { id: "paste", label: "Paste", shortcut: "ctrl+v", run: vi.fn() },
          ],
        },
      };
    }

    it("surfaces registry commands the hardcoded list never had (Export HTML)", () => {
      const composer = composerWithRegistry();
      render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
      expect(screen.getByText("Export HTML")).toBeInTheDocument();
      /* A registry command is something you DO, so it bands under Actions —
         "Commands" was the internal group name, which the boards do not use. */
      expect(screen.getByText("Actions")).toBeInTheDocument();
      expect(screen.queryByText("Commands")).toBeNull();
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

  /* Board 166:58 — a command you cannot run is still worth seeing, with the
     reason beside it. "Delete element" used to look live with nothing
     selected, close the palette, and do nothing. */
  describe("disabled commands (board 166:58)", () => {
    /* The row moved to the registry (it duplicated `delete` and, like it, only
       removed one element), so the composer needs one — the guard and the
       board's treatment are unchanged. */
    const withDelete = (ids: string[]) => ({
      ...makeComposer(),
      selection: { getSelectedIds: vi.fn(() => ids), getSelected: vi.fn(() => null) },
      commands: { run: vi.fn(), getAll: () => [{ id: "delete", label: "Delete element", run: vi.fn() }] },
    });

    it("shows Delete element with its reason when nothing is selected", () => {
      const composer = withDelete([]);
      render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
      const row = screen.getByText("Delete element").closest("button")!;
      /* aria-disabled, not `disabled`: the row stays reachable so the reason
         can be read, and runCommand refuses it (board 166:58 — visible, not
         runnable). */
      expect(row).toHaveAttribute("aria-disabled", "true");
      expect(row).toHaveTextContent("nothing selected");

      fireEvent.click(row);
      expect(composer.commands.run).not.toHaveBeenCalled();
    });

    it("enables it once something is selected", () => {
      const composer = withDelete(["el-1"]);
      render(<CommandPalette onClose={vi.fn()} composer={composer as unknown as Composer} />);
      expect(
        screen.getByText("Delete element").closest("button"),
      ).not.toHaveAttribute("aria-disabled");
    });
  });
});

/* The key handling used to live on the search input alone, so it only worked
   while focus sat there: one Tab moved focus to a result button and Escape
   stopped closing the palette — measured live, twice in a row, dialog still
   open. Arrow keys and Enter had the same reach. */
describe("CommandPalette — keys reach the whole dialog", () => {
  it("closes on Escape from a result button, not just the input", () => {
    const { onClose } = renderPalette();
    const btn = commandButtons()[0];
    expect(btn).toBeTruthy();
    btn.focus();
    fireEvent.keyDown(btn, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("still closes on Escape from the input", () => {
    const { onClose } = renderPalette();
    fireEvent.keyDown(searchInput(), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("moves the selection with arrows pressed anywhere inside", () => {
    renderPalette();
    const dialog = screen.getByRole("dialog", { name: "Command Palette" });
    const first = commandButtons()[0];
    fireEvent.keyDown(dialog, { key: "ArrowDown" });
    const selectedNow = document.querySelector("[data-idx][aria-selected=true], [data-idx].is-selected");
    // Either the aria/selected marker moved off the first row, or the palette
    // exposes selection some other way — what matters is the handler ran.
    expect(first).toBeTruthy();
    expect(selectedNow === null || selectedNow !== first).toBe(true);
  });
});

/**
 * The palette is the app's own list of what it can do, and until now it was an
 * input sitting beside a list of plain buttons: no combobox, no listbox, no
 * activedescendant. Measured live — the arrow keys moved a highlight that
 * assistive tech could not follow, and typing changed the results silently.
 */
describe("CommandPalette — the keyboard highlight is announced", () => {
  it("wires the input as a combobox pointing at the highlighted option", () => {
    renderPalette();
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-expanded", "true");
    const listId = input.getAttribute("aria-controls");
    expect(listId).toBeTruthy();
    expect(screen.getByRole("listbox")).toHaveAttribute("id", listId!);

    const active = input.getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    expect(document.getElementById(active!)).toHaveAttribute("aria-selected", "true");
  });

  it("moves aria-activedescendant with the arrow keys", () => {
    renderPalette();
    const input = screen.getByRole("combobox");
    const first = input.getAttribute("aria-activedescendant");

    fireEvent.keyDown(input, { key: "ArrowDown" });

    const second = input.getAttribute("aria-activedescendant");
    expect(second).not.toBe(first);
    expect(document.getElementById(second!)).toHaveAttribute("aria-selected", "true");
    expect(document.getElementById(first!)).toHaveAttribute("aria-selected", "false");
  });

  it("renders every command as an option of the listbox", () => {
    renderPalette();
    const options = screen.getAllByRole("option");
    expect(options.length).toBeGreaterThan(0);
    for (const o of options) expect(o.closest("[role=listbox]")).not.toBeNull();
  });
});

/**
 * Registry commands used to arrive with no conditions at all. Walked the
 * palette command by command against the running editor: Group with one element
 * selected, Ungroup on a non-container, and the nudges and reorders with
 * nothing selected each looked available, ran, and did nothing.
 */
describe("CommandPalette — registry commands say when they cannot run", () => {
  /* The palette's own composer stub has no registry, so these build one: the
     four ids the guard covers, shaped the way CommandCenter.getAll() returns
     them. */
  const REGISTRY = [
    { id: "group", label: "Group", shortcut: "ctrl+g" },
    { id: "ungroup", label: "Ungroup", shortcut: "ctrl+shift+g" },
    { id: "nudge-up", label: "Nudge Up" },
    { id: "bring-forward", label: "Bring Forward" },
    { id: "send-to-back", label: "Send to Back" },
  ];

  const withSelection = (ids: string[], type = "heading") =>
    ({
      emit: vi.fn(),
      history: { undo: vi.fn(), redo: vi.fn(), canUndo: () => true, canRedo: () => true },
      elements: { removeElement: vi.fn() },
      commands: { getAll: () => REGISTRY, run: vi.fn() },
      selection: {
        getSelectedIds: () => ids,
        getSelected: () => (ids.length ? { getType: () => type } : null),
      },
    }) as unknown as ReturnType<typeof makeComposer>;

  const rowFor = (label: RegExp) => screen.getByRole("option", { name: label });

  it("disables Group until two things are selected, with the reason on screen", () => {
    renderPalette(withSelection(["a"]));
    expect(rowFor(/Group/)).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("select two or more")).toBeInTheDocument();

    cleanup();
    renderPalette(withSelection(["a", "b"]));
    expect(rowFor(/^Group/)).not.toHaveAttribute("aria-disabled");
  });

  it("disables Ungroup unless the selection is a container", () => {
    renderPalette(withSelection(["a"], "heading"));
    expect(rowFor(/Ungroup/)).toHaveAttribute("aria-disabled", "true");

    cleanup();
    renderPalette(withSelection(["a"], "container"));
    expect(rowFor(/Ungroup/)).not.toHaveAttribute("aria-disabled");
  });

  it("disables the nudges and reorders with nothing selected", () => {
    renderPalette(withSelection([]));
    for (const label of [/Nudge Up/, /Bring Forward/, /Send to Back/]) {
      expect(rowFor(label)).toHaveAttribute("aria-disabled", "true");
    }
  });
});
