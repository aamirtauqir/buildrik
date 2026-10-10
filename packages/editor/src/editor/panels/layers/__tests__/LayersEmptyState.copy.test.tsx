/**
 * v3 board 4418:83911 (S·Layers · empty), redrawn 2026-10-10 for L2-031: the
 * state glyph, "No layers yet" and "Add an element to start building this
 * page." — no button; Add is the rail item beside the drawer.
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
    expect(screen.getByTestId("layers-empty-title")).toHaveTextContent("No layers yet");
    expect(screen.getByTestId("layers-empty-text")).toHaveTextContent("Add an element to start building this page.");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
