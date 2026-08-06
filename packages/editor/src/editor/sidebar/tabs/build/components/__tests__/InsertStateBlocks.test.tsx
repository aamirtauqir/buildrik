// @vitest-environment jsdom
/**
 * InsertStateBlocks — boards 775:4053 (loading) / 781:4154 (load-error).
 * Copy is the board's, exact — under the visual→board precedence the strings
 * are contract, not placeholder.
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { InsertLoadingSkeleton, InsertLoadError } from "../InsertStateBlocks";

describe("InsertLoadingSkeleton (775:4053)", () => {
  it("renders six h-8 rows with icon + bar, announced busy", () => {
    render(<InsertLoadingSkeleton />);
    const root = screen.getByTestId("insert-loading");
    expect(root).toHaveAttribute("aria-busy", "true");
    // 6 rows: 1 literal + 5 mapped, each carrying the 12px icon square.
    expect(root.children).toHaveLength(6);
    expect(screen.getByTestId("insert-sk-row")).toBeTruthy();
    expect(screen.getByTestId("insert-sk-icon")).toBeTruthy();
    expect(screen.getByTestId("insert-sk-bar")).toBeTruthy();
  });
});

describe("InsertLoadError (781:4154)", () => {
  it("renders the board's exact copy: fact, harm scope, retry", () => {
    render(<InsertLoadError onRetry={vi.fn()} />);
    expect(screen.getByText("Couldn’t load the element library.")).toBeTruthy();
    expect(screen.getByText("You can still edit what’s already on the canvas.")).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("Try again fires the retry", () => {
    const onRetry = vi.fn();
    render(<InsertLoadError onRetry={onRetry} />);
    fireEvent.click(screen.getByTestId("insert-load-retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
