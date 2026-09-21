/**
 * Board 7575:195538 "Keyboard shortcuts · full" opens the ONE keyboard sheet
 * with a search field over the groups. Filters on the description AND the
 * chord — stored ("ctrl+z") and displayed ("⌘+Z") — and a group whose every
 * row is filtered out takes its heading with it.
 *
 * Ported from `panels/__tests__/KeyboardShortcutsPanel.search.test.tsx`
 * (deleted 2026-09-22 with the panel, decision #37).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KeyboardCheatSheet } from "../KeyboardCheatSheet";
import { formatChord } from "../keyboardSheetRows";
import { buildDefaultCommands } from "@/engine/commands/defaultCommands";
import type { Composer } from "@/engine";

afterEach(cleanup);

/** A registry-shaped composer: the sheet reads `commands.getAll()` only. */
function composerWithRegistry(): Composer {
  const stub = { emit: vi.fn() } as unknown as Composer;
  const all = buildDefaultCommands(stub);
  return { commands: { getAll: () => all } } as unknown as Composer;
}

const open = () =>
  render(<KeyboardCheatSheet isOpen onClose={vi.fn()} composer={composerWithRegistry()} />);

const search = () => screen.getByRole("searchbox", { name: "Search shortcuts" });

describe("KeyboardCheatSheet — the board's search", () => {
  it("offers the field", () => {
    open();
    expect(search()).toBeInTheDocument();
  });

  it("filters on the description", () => {
    open();
    fireEvent.change(search(), { target: { value: "undo" } });
    expect(screen.getByText("Undo")).toBeInTheDocument();
    expect(screen.queryByText(/Open Add panel/)).not.toBeInTheDocument();
  });

  it("filters on the KEY too — a chord is how people remember shortcuts", () => {
    /* jsdom is not a Mac, so the stored spelling is also the displayed one
       here; the Mac half is the next test. */
    open();
    fireEvent.change(search(), { target: { value: "ctrl+z" } });
    expect(screen.getByText("Undo")).toBeInTheDocument();
  });

  it("the filter matches the DISPLAYED spelling, not just the stored one", () => {
    // On a Mac the chip reads "⌘+Z" while the data holds "ctrl+z". A search
    // has to match what is on the screen.
    const plat = Object.getOwnPropertyDescriptor(Navigator.prototype, "platform");
    Object.defineProperty(window.navigator, "platform", { value: "MacIntel", configurable: true });
    try {
      expect(formatChord("ctrl+shift+z", true)).toBe("⌘+⇧+Z");
      open();
      fireEvent.change(search(), { target: { value: "⌘+z" } });
      expect(screen.getByText("Undo")).toBeInTheDocument();
    } finally {
      if (plat) Object.defineProperty(Navigator.prototype, "platform", plat);
      else delete (window.navigator as { platform?: string }).platform;
    }
  });

  it("a group whose every row is filtered out takes its heading with it", () => {
    // A heading over nothing is furniture.
    open();
    fireEvent.change(search(), { target: { value: "undo" } });
    expect(screen.queryByTestId("kb-group-panels")).not.toBeInTheDocument();
    expect(screen.getByTestId("kb-group-edit")).toBeInTheDocument();
  });

  it("no match says so instead of showing an empty list", () => {
    open();
    fireEvent.change(search(), { target: { value: "zzqqxx" } });
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
  });

  it("shows every group again when the field is cleared", () => {
    open();
    fireEvent.change(search(), { target: { value: "zzqqxx" } });
    fireEvent.change(search(), { target: { value: "" } });
    expect(screen.queryByText(/Nothing matches/)).not.toBeInTheDocument();
    for (const g of ["selection", "edit", "view", "panels", "regions"]) {
      expect(screen.getByTestId(`kb-group-${g}`)).toBeInTheDocument();
    }
  });

  it("a second '?' closes it; '?' typed into the search field does not", () => {
    const onClose = vi.fn();
    render(<KeyboardCheatSheet isOpen onClose={onClose} composer={composerWithRegistry()} />);
    fireEvent.keyDown(search(), { key: "?" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "?" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
