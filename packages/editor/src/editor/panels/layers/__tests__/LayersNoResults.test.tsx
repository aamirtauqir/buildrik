/**
 * design-2l9 board 147:79328 (Layers · no search matches): "No layers match
 * “q”", "Search by name, type, tag or ID." and a Clear search link — no
 * glyph, no "Nothing here yet", no ⌘K hand-off.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LayersNoResults } from "../components/LayersStateBlocks";

describe("LayersNoResults", () => {
  it("names the failed search and clears it", () => {
    const onClear = vi.fn();
    render(<LayersNoResults search="carousel" onClear={onClear} />);
    expect(screen.getByTestId("layers-no-results-title")).toHaveTextContent("No layers match “carousel”");
    expect(screen.getByTestId("layers-no-results-text")).toHaveTextContent("Search by name, type, tag or ID.");
    expect(screen.getByTestId("layers-no-results")).not.toHaveTextContent("Nothing here yet");
    expect(screen.queryByRole("button", { name: /Search everywhere/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
