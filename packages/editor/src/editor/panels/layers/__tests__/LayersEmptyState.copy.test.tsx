/**
 * design-2l9 board 101:42581: an empty page's Layers is its page row and one
 * muted line — "Empty page · Add elements to begin" — no button; Add is the
 * rail item beside the drawer. re-baseline: Layers empty (was v3 4418:83911's
 * "No layers yet" block).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LayersEmptyState } from "../components/LayersEmptyState";

describe("LayersEmptyState", () => {
  it("reads as the board draws it, with no button", () => {
    render(<LayersEmptyState />);
    expect(screen.getByTestId("layers-empty")).toHaveTextContent("Empty page · Add elements to begin");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
