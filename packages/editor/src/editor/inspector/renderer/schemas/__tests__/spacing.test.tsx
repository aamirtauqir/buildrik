/**
 * Spacing essentials schema — render fidelity + side-write routing.
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { InspectorRenderer } from "../../InspectorRenderer";
import { spacingEssentialsSchema } from "../spacing";

describe("spacingEssentialsSchema", () => {
  const styles = {
    "margin-top": "8px",
    "margin-right": "8px",
    "margin-bottom": "8px",
    "margin-left": "8px",
    "padding-top": "4px",
    "padding-right": "4px",
    "padding-bottom": "4px",
    "padding-left": "4px",
  };

  it("renders Margin + Padding compounds with four sides each", () => {
    render(
      <InspectorRenderer
        schema={spacingEssentialsSchema}
        styles={styles}
        onChange={vi.fn()}
        onBatchChange={vi.fn()}
      />,
    );
    // Labels for the two compound groups.
    expect(screen.getByText("Margin")).toBeInTheDocument();
    expect(screen.getByText("Padding")).toBeInTheDocument();
    // Two sets of four sides → 8 side inputs total (2x top, 2x right, ...).
    expect(screen.getAllByLabelText("top")).toHaveLength(2);
    expect(screen.getAllByLabelText("right")).toHaveLength(2);
    expect(screen.getAllByLabelText("bottom")).toHaveLength(2);
    expect(screen.getAllByLabelText("left")).toHaveLength(2);
  });

  it("unlinked margin-top edit writes only margin-top", () => {
    const onBatchChange = vi.fn();
    render(
      <InspectorRenderer
        schema={spacingEssentialsSchema}
        styles={styles}
        onChange={vi.fn()}
        onBatchChange={onBatchChange}
      />,
    );
    const [marginTop] = screen.getAllByLabelText("top");
    fireEvent.change(marginTop, { target: { value: "12px" } });
    expect(onBatchChange).toHaveBeenLastCalledWith({ "margin-top": "12px" });
  });

  it("linked padding fans one edit out to all four padding sides", () => {
    const onBatchChange = vi.fn();
    render(
      <InspectorRenderer
        schema={spacingEssentialsSchema}
        styles={styles}
        onChange={vi.fn()}
        onBatchChange={onBatchChange}
      />,
    );
    // Second link button = Padding. First = Margin.
    const linkButtons = screen.getAllByRole("button", { name: /Link sides/i });
    fireEvent.click(linkButtons[1]);

    const [, paddingTop] = screen.getAllByLabelText("top");
    fireEvent.change(paddingTop, { target: { value: "16px" } });
    expect(onBatchChange).toHaveBeenLastCalledWith({
      "padding-top": "16px",
      "padding-right": "16px",
      "padding-bottom": "16px",
      "padding-left": "16px",
    });
  });
});
