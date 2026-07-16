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
import { CATALOG } from "../catalog/catalog";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("BuildTab — header + categories", () => {
  it("renders the panel title and the block/category count subtitle", () => {
    render(<BuildTab composer={null} onBlockClick={vi.fn()} />);
    expect(screen.getByText("Insert")).toBeTruthy();
    expect(screen.getByText(new RegExp(`${CATALOG.length} categories`))).toBeTruthy();
  });

  it("renders every catalog category row", () => {
    render(<BuildTab composer={null} onBlockClick={vi.fn()} />);
    for (const cat of CATALOG) {
      expect(screen.getByText(cat.name)).toBeTruthy();
    }
  });

  it("opens 'Basic' by default and mounts only its element grid", () => {
    render(<BuildTab composer={null} onBlockClick={vi.fn()} />);
    // Basic is the first-session default open category.
    expect(screen.getByText("Heading")).toBeTruthy();
    // Layout is collapsed → its elements are not mounted.
    expect(screen.queryByText("Container")).toBeNull();
  });
});

describe("BuildTab — exclusive accordion toggle", () => {
  it("opening Layout closes Basic (single-open invariant)", () => {
    render(<BuildTab composer={null} onBlockClick={vi.fn()} />);
    expect(screen.getByText("Heading")).toBeTruthy();

    fireEvent.click(screen.getByText("Layout"));

    expect(screen.getByText("Container")).toBeTruthy();
    expect(screen.queryByText("Heading")).toBeNull();
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
