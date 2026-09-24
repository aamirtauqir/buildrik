/**
 * C5 G2-063 — the Layers empty state reads as board 4418:83911 draws it:
 * "No layers yet. Add an element to start building…" with the door named for
 * the rail item it opens ("Open Add"), not the retired "Insert".
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LayersEmptyState } from "../components/LayersEmptyState";

describe("LayersEmptyState", () => {
  it("says No layers yet and offers Open Add", () => {
    const open = vi.fn();
    render(<LayersEmptyState onAddBlockClick={open} />);
    expect(screen.getByTestId("layers-empty")).toHaveTextContent("No layers yet. Add an element to start building.");
    expect(screen.queryByText(/Insert/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Open Add" }));
    expect(open).toHaveBeenCalledTimes(1);
  });
});
