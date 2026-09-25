/**
 * v3 board 4418:83498 (Layers · no results): the state glyph, "Nothing here
 * yet", "No layers match your search." and one outlined hand-off to ⌘K,
 * "Search everywhere for “carousel”". The board draws no Clear search — the
 * topbar field's ✕ / Escape clears the query.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LayersNoResults } from "../components/LayersStateBlocks";

describe("LayersNoResults", () => {
  it("says nothing matches and hands the query to Search everywhere", () => {
    const onSearchEverywhere = vi.fn();
    render(<LayersNoResults search="carousel" onSearchEverywhere={onSearchEverywhere} />);
    expect(screen.getByTestId("layers-no-results")).toHaveTextContent("Nothing here yet");
    expect(screen.getByTestId("layers-no-results-text")).toHaveTextContent("No layers match your search.");
    fireEvent.click(screen.getByRole("button", { name: "Search everywhere for “carousel”" }));
    expect(onSearchEverywhere).toHaveBeenCalledWith("carousel");
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });
});
