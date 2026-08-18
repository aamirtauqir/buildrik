/**
 * Board 815:4518 opens the shortcuts overlay with a search field.
 *
 * Six groups of chords ship (Selection · Navigation · Positioning · Editing ·
 * View · Context Menu) and there was no way to look through them but to read
 * them. The board puts "Search shortcuts…" above the groups.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KeyboardCheatSheet } from "../KeyboardCheatSheet";

afterEach(cleanup);

const open = () => render(<KeyboardCheatSheet isOpen onClose={vi.fn()} />);

describe("KeyboardCheatSheet — the board's search", () => {
  it("offers the field", () => {
    open();
    expect(screen.getByRole("textbox", { name: "Search shortcuts" })).toBeInTheDocument();
  });

  it("narrows to what matches the description", () => {
    open();
    const before = screen.getAllByText(/./).length;
    fireEvent.change(screen.getByRole("textbox", { name: "Search shortcuts" }), {
      target: { value: "duplicate" },
    });
    expect(screen.getAllByText(/Duplicate/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/./).length).toBeLessThan(before);
  });

  it("says so when nothing matches", () => {
    open();
    fireEvent.change(screen.getByRole("textbox", { name: "Search shortcuts" }), {
      target: { value: "zzqqxx" },
    });
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
  });

  it("shows every group again when the field is cleared", () => {
    open();
    const field = screen.getByRole("textbox", { name: "Search shortcuts" });
    fireEvent.change(field, { target: { value: "zzqqxx" } });
    fireEvent.change(field, { target: { value: "" } });
    expect(screen.queryByText(/Nothing matches/)).not.toBeInTheDocument();
    // The heading is uppercased by CSS; the DOM still says "Selection".
    expect(screen.getByText("Selection")).toBeInTheDocument();
  });
});
