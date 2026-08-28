/**
 * Board 815:4518 puts "Search shortcuts…" at the top of the overlay; the
 * shipped panel had sixty-one shortcuts and no way to find one but reading.
 */
import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { KeyboardShortcutsPanel, displayKey } from "../KeyboardShortcutsPanel";

const open = () => render(<KeyboardShortcutsPanel isOpen onClose={() => {}} />);

describe("KeyboardShortcutsPanel — search (board 815:4518)", () => {
  it("filters on the description", () => {
    open();
    fireEvent.change(screen.getByLabelText("Search shortcuts"), { target: { value: "undo" } });
    expect(screen.getByText("Undo")).toBeInTheDocument();
    expect(screen.queryByText(/Open Insert panel/)).not.toBeInTheDocument();
  });

  it("filters on the KEY too — a chord is how people remember shortcuts", () => {
    /* jsdom is not a Mac, so the stored spelling is also the displayed one
       here. The Mac half — searching "⌘+z" against a badge that shows ⌘ — is
       the displayKey test below; the filter feeds the query through the same
       function the badge renders with. */
    open();
    fireEvent.change(screen.getByLabelText("Search shortcuts"), { target: { value: "ctrl+z" } });
    expect(screen.getByText("Undo")).toBeInTheDocument();
  });

  it("the filter matches the DISPLAYED spelling, not just the stored one", () => {
    // On a Mac the badge reads "⌘+Z" while the data holds "Ctrl+Z". A search
    // has to match what is on the screen.
    const plat = Object.getOwnPropertyDescriptor(Navigator.prototype, "platform");
    Object.defineProperty(window.navigator, "platform", { value: "MacIntel", configurable: true });
    try {
      expect(displayKey("Ctrl+Shift+Z")).toBe("⌘+⇧+Z");
      open();
      fireEvent.change(screen.getByLabelText("Search shortcuts"), { target: { value: "⌘+z" } });
      expect(screen.getByText("Undo")).toBeInTheDocument();
    } finally {
      if (plat) Object.defineProperty(Navigator.prototype, "platform", plat);
      else delete (window.navigator as { platform?: string }).platform;
    }
  });

  it("a group whose every row is filtered out takes its heading with it", () => {
    // A heading over nothing is furniture.
    open();
    fireEvent.change(screen.getByLabelText("Search shortcuts"), { target: { value: "undo" } });
    expect(screen.queryByText("PANELS")).not.toBeInTheDocument();
  });

  it("no match says so instead of showing an empty grid", () => {
    open();
    fireEvent.change(screen.getByLabelText("Search shortcuts"), { target: { value: "zzz" } });
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
  });
});
