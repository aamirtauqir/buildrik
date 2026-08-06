// @vitest-environment jsdom
/**
 * BuildTab — render/interaction tests.
 *
 * Verifies the catalog accordion renders (default-open "Basic"), the
 * exclusive-accordion toggle swaps the open category, and typing in the
 * search box swaps the accordion view for grouped SearchResults.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { BuildTab } from "../BuildTab";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// The previous suite here asserted the PRE-board design — the "N blocks ·
// N categories" subtitle, the BASIC/LAYOUT category rows, and a single-open
// accordion. Board 137:2 carries none of them, and a test protecting removed
// design is how "No pages yet" survived (PageList.test.tsx:55). Rewritten to
// the board contract in the same commit as the rebuild.
describe("BuildTab — board 137:2 taxonomy", () => {
  it("renders the title with no count subtitle", () => {
    render(<BuildTab composer={null} onBlockClick={vi.fn()} />);
    expect(screen.getByText("Insert")).toBeTruthy();
    expect(screen.queryByText(/categories/)).toBeNull();
  });

  it("renders the five source groups: ELEMENTS BLOCKS COMPONENTS TEMPLATES MINE", () => {
    render(<BuildTab composer={null} onBlockClick={vi.fn()} />);
    for (const label of ["ELEMENTS", "BLOCKS", "COMPONENTS", "TEMPLATES", "MINE"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("ELEMENTS is open by default (▾) with its rows mounted; BLOCKS is closed", () => {
    render(<BuildTab composer={null} onBlockClick={vi.fn()} />);
    expect(screen.getByTestId("insert-group-elements")).toHaveAttribute("aria-expanded", "true");
    // A known element row is mounted…
    expect(screen.getByText("Heading")).toBeTruthy();
    // …and the closed BLOCKS group has no rows mounted.
    expect(screen.getByTestId("insert-group-blocks")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId(/^insert-block-/)).toBeNull();
  });

  it("groups toggle independently — opening BLOCKS keeps ELEMENTS open", () => {
    render(<BuildTab composer={null} onBlockClick={vi.fn()} />);
    fireEvent.click(screen.getByTestId("insert-group-blocks"));
    expect(screen.getByTestId("insert-group-blocks")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("insert-group-elements")).toHaveAttribute("aria-expanded", "true");
    // Scoped by testid: a BLOCK named "Heading" exists too once BLOCKS is open.
    expect(screen.getByTestId("insert-el-Heading")).toBeTruthy();
  });

  it("clicking a BLOCKS row inserts through the same onBlockClick path elements use", () => {
    const onBlockClick = vi.fn();
    render(<BuildTab composer={null} onBlockClick={onBlockClick} />);
    fireEvent.click(screen.getByTestId("insert-group-blocks"));
    const first = document.querySelector('[data-testid^="insert-block-"]') as HTMLElement;
    expect(first).toBeTruthy();
    fireEvent.click(first);
    expect(onBlockClick).toHaveBeenCalledTimes(1);
    expect(onBlockClick.mock.calls[0][0]).toHaveProperty("id");
    expect(onBlockClick.mock.calls[0][0]).toHaveProperty("label");
  });
});

describe("BuildTab — search", () => {
  it("swaps the accordion view for grouped SearchResults", async () => {
    const { container } = render(<BuildTab composer={null} onBlockClick={vi.fn()} />);
    const input = container.querySelector("#bld-search-input") as HTMLInputElement;
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { value: "button" } });

    // SearchBar debounces (150ms) before pushing the query up to the hook.
    await waitFor(() => expect(screen.getByText(/results? for/i)).toBeTruthy());
    // The matching element card renders inside the results, not the accordion.
    expect(screen.getByText("Button")).toBeTruthy();
  });

  it("shows the no-results state for an unmatched query", async () => {
    const { container } = render(<BuildTab composer={null} onBlockClick={vi.fn()} />);
    const input = container.querySelector("#bld-search-input") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "zzznotablock" } });

    await waitFor(() =>
      expect(screen.getByText('Nothing matches "zzznotablock"')).toBeTruthy()
    );
  });
});
