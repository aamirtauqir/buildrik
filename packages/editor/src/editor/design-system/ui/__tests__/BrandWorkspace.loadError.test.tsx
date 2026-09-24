/**
 * Board 781:4311 — what failed, and that nothing was lost.
 *
 * The panel rendered `PanelErrorState` with the raw exception text under a
 * generic "Something went wrong". The board writes both lines itself:
 * "Couldn't load your brand system." over "Your tokens are safe — only this
 * list failed to load." The second sentence is the one a person needs.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PanelErrorState } from "../../../sidebar/shared/PanelErrorState";

afterEach(cleanup);

describe("PanelErrorState — the headline is the caller's to write", () => {
  it("uses the title it is given", () => {
    render(<PanelErrorState title="Couldn't load your brand system." message="Your tokens are safe — only this list failed to load." onRetry={vi.fn()} />);
    expect(screen.getByText("Couldn't load your brand system.")).toBeInTheDocument();
    expect(screen.getByText(/Your tokens are safe/)).toBeInTheDocument();
  });

  it("still falls back for panels that have not written one", () => {
    render(<PanelErrorState message="boom" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("offers Try again only when a retry exists", () => {
    const { rerender } = render(<PanelErrorState message="boom" />);
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    rerender(<PanelErrorState message="boom" onRetry={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
