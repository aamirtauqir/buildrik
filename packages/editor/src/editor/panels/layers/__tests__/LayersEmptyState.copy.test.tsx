/**
 * v3 board 4418:83911 (S·Layers · empty): the state glyph, "Nothing here
 * yet" and "No layers yet. Add an element to start building this page." —
 * no button; Add is the rail item beside the drawer.
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
    expect(screen.getByTestId("layers-empty")).toHaveTextContent("Nothing here yet");
    expect(screen.getByTestId("layers-empty-text")).toHaveTextContent("No layers yet. Add an element to start building this page.");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
