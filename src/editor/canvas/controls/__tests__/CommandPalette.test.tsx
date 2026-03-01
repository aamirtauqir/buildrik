/**
 * Tests for CommandPalette — context-awareness (D9)
 *
 * Verifies that commands with requiresSelection=true are rendered as
 * visually disabled (with hint text) when selectedId is null, and
 * are enabled when an element is selected. Commands without
 * requiresSelection are always enabled regardless of selectedId.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommandPalette } from "../CommandPalette";
import type { CommandAction } from "../CommandPalette";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const deleteCommand: CommandAction = {
  id: "delete",
  label: "Delete",
  category: "Edit",
  shortcut: "Del",
  icon: "🗑",
  requiresSelection: true,
  handler: vi.fn(),
};

const undoCommand: CommandAction = {
  id: "undo",
  label: "Undo",
  category: "Edit",
  shortcut: "Cmd+Z",
  icon: "↩",
  handler: vi.fn(),
};

const duplicateCommand: CommandAction = {
  id: "duplicate",
  label: "Duplicate",
  category: "Edit",
  shortcut: "Cmd+D",
  icon: "⊞",
  requiresSelection: true,
  handler: vi.fn(),
};

function renderPalette(commands: CommandAction[], selectedId: string | null) {
  return render(
    <CommandPalette isOpen={true} onClose={vi.fn()} commands={commands} selectedId={selectedId} />
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CommandPalette — requiresSelection context awareness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // localStorage is available in jsdom; clear between tests
    localStorage.clear();
  });

  // ── Disabled state (no selection) ─────────────────────────────────────────

  it("shows hint text for a requiresSelection command when selectedId is null", () => {
    renderPalette([deleteCommand], null);

    expect(screen.getByTestId("selection-hint")).toBeDefined();
    expect(screen.getByTestId("selection-hint").textContent).toBe("(Select an element first)");
  });

  it("marks requiresSelection button as disabled when selectedId is null", () => {
    renderPalette([deleteCommand], null);

    const btn = screen.getByRole("button", { name: /delete/i });
    expect(btn).toHaveAttribute("disabled");
    expect(btn).toHaveAttribute("aria-disabled", "true");
  });

  it("does NOT fire the handler when a disabled requiresSelection command is clicked", async () => {
    const handler = vi.fn();
    const cmd: CommandAction = { ...deleteCommand, handler };
    renderPalette([cmd], null);

    const btn = screen.getByRole("button", { name: /delete/i });
    // disabled buttons don't fire click handlers natively in jsdom, but
    // we also guard in executeCommand — verify the handler is not called.
    await userEvent.click(btn);
    expect(handler).not.toHaveBeenCalled();
  });

  // ── Enabled state (element selected) ──────────────────────────────────────

  it("does NOT show hint text for a requiresSelection command when selectedId is set", () => {
    renderPalette([deleteCommand], "el-1");

    expect(screen.queryByTestId("selection-hint")).toBeNull();
  });

  it("does NOT mark requiresSelection button as disabled when selectedId is set", () => {
    renderPalette([deleteCommand], "el-1");

    const btn = screen.getByRole("button", { name: /delete/i });
    expect(btn).not.toHaveAttribute("disabled");
  });

  // ── Non-scoped commands always enabled ────────────────────────────────────

  it("never shows hint text for a command without requiresSelection, regardless of selectedId", () => {
    const { unmount } = renderPalette([undoCommand], null);
    expect(screen.queryByTestId("selection-hint")).toBeNull();
    unmount();

    renderPalette([undoCommand], "el-1");
    expect(screen.queryByTestId("selection-hint")).toBeNull();
  });

  it("never disables a command without requiresSelection", () => {
    renderPalette([undoCommand], null);

    const btn = screen.getByRole("button", { name: /undo/i });
    expect(btn).not.toHaveAttribute("disabled");
  });

  // ── Mixed command list ─────────────────────────────────────────────────────

  it("disables only requiresSelection commands in a mixed list when selectedId is null", () => {
    renderPalette([undoCommand, deleteCommand, duplicateCommand], null);

    const undoBtn = screen.getByRole("button", { name: /undo/i });
    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    const duplicateBtn = screen.getByRole("button", { name: /duplicate/i });

    expect(undoBtn).not.toHaveAttribute("disabled");
    expect(deleteBtn).toHaveAttribute("disabled");
    expect(duplicateBtn).toHaveAttribute("disabled");
  });

  it("enables all commands in a mixed list when selectedId is set", () => {
    renderPalette([undoCommand, deleteCommand, duplicateCommand], "el-1");

    const undoBtn = screen.getByRole("button", { name: /undo/i });
    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    const duplicateBtn = screen.getByRole("button", { name: /duplicate/i });

    expect(undoBtn).not.toHaveAttribute("disabled");
    expect(deleteBtn).not.toHaveAttribute("disabled");
    expect(duplicateBtn).not.toHaveAttribute("disabled");
  });
});
