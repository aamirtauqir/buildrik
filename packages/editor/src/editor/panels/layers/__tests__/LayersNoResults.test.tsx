/**
 * C5 G2-059 — board 4418:83498 (Layers · no results): "No layers match your
 * search." and a hand-off, "Search everywhere for “carousel”", that opens ⌘K
 * with the query. Clear search stays.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LayersNoResults } from "../components/LayersStateBlocks";

describe("LayersNoResults", () => {
  it("says no layers match and hands the query to Search everywhere", () => {
    const onSearchEverywhere = vi.fn();
    const onClear = vi.fn();
    render(<LayersNoResults search="carousel" onClear={onClear} onSearchEverywhere={onSearchEverywhere} />);
    expect(screen.getByTestId("layers-no-results-text")).toHaveTextContent("No layers match your search.");
    fireEvent.click(screen.getByRole("button", { name: "Search everywhere for “carousel”" }));
    expect(onSearchEverywhere).toHaveBeenCalledWith("carousel");
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
