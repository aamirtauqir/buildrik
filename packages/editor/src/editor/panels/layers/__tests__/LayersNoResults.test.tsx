/**
 * v3 board 4418:83498 (Layers · no results), redrawn 2026-10-10 for L2-031:
 * the state glyph, "No matching layers", "Try a different name, or clear the
 * search.", a "Clear search" button, and the outlined hand-off to ⌘K,
 * "Search everywhere for “carousel”". The empty tree ("No layers yet") no
 * longer shares this heading.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LayersNoResults } from "../components/LayersStateBlocks";

describe("LayersNoResults", () => {
  it("names the failed search, clears it, and hands the query to Search everywhere", () => {
    const onSearchEverywhere = vi.fn();
    const onClear = vi.fn();
    render(<LayersNoResults search="carousel" onSearchEverywhere={onSearchEverywhere} onClear={onClear} />);
    expect(screen.getByTestId("layers-no-results-title")).toHaveTextContent("No matching layers");
    expect(screen.getByTestId("layers-no-results")).not.toHaveTextContent("Nothing here yet");
    expect(screen.getByTestId("layers-no-results-text")).toHaveTextContent("Try a different name, or clear the search.");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onClear).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Search everywhere for “carousel”" }));
    expect(onSearchEverywhere).toHaveBeenCalledWith("carousel");
  });
});
