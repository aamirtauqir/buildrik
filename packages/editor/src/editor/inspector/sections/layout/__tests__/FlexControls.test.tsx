/**
 * FlexControls — board 16's Flex block (and Layout when Display is Flex):
 * Direction, the 3×3 align grid + its label, Wrap, Gap; the rest behind
 * More settings.
 *
 * @license BSD-3-Clause
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FlexControls } from "../FlexControls";

function renderFlex(styles: Record<string, string> = {}) {
  const onChange = vi.fn();
  const onBatchChange = vi.fn();
  render(<FlexControls styles={{ display: "flex", ...styles }} onChange={onChange} onBatchChange={onBatchChange} />);
  return { onChange, onBatchChange };
}

describe("FlexControls — board 16's rows", () => {
  it("draws Direction, the align grid with its label, Wrap and Gap without any disclosure", () => {
    renderFlex({ "justify-content": "center", "align-items": "center", gap: "16px" });
    expect(screen.getByRole("button", { name: "Row" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("group", { name: "Align" }).querySelectorAll("button")).toHaveLength(9);
    expect(screen.getByTestId("inspector-flex-align-label")).toHaveTextContent("AlignCenter / Center");
    expect(screen.getByRole("checkbox", { name: "Wrap" })).not.toBeChecked();
    expect(screen.getByLabelText("Gap")).toHaveValue("16");
  });

  it("a grid cell writes justify-content and align-items as one change", () => {
    const { onBatchChange } = renderFlex();
    fireEvent.click(screen.getByTestId("inspector-flex-align-2-1"));
    expect(onBatchChange).toHaveBeenCalledWith({ "justify-content": "center", "align-items": "flex-end" });
  });

  it("in a column the grid's axes swap", () => {
    const { onBatchChange } = renderFlex({ "flex-direction": "column" });
    fireEvent.click(screen.getByTestId("inspector-flex-align-2-1"));
    expect(onBatchChange).toHaveBeenCalledWith({ "justify-content": "flex-end", "align-items": "center" });
  });

  it("Column keeps a reversed order reversed", () => {
    const { onChange } = renderFlex({ "flex-direction": "row-reverse" });
    fireEvent.click(screen.getByRole("button", { name: "Column" }));
    expect(onChange).toHaveBeenCalledWith("flex-direction", "column-reverse");
  });

  it("Wrap writes flex-wrap", () => {
    const { onChange } = renderFlex();
    fireEvent.click(screen.getByRole("checkbox", { name: "Wrap" }));
    expect(onChange).toHaveBeenCalledWith("flex-wrap", "wrap");
  });

  it("Gap writes gap", () => {
    const { onChange } = renderFlex();
    fireEvent.change(screen.getByLabelText("Gap"), { target: { value: "24" } });
    expect(onChange).toHaveBeenCalledWith("gap", "24px");
  });
});

describe("FlexControls — More settings keeps what the grid cannot say", () => {
  it("reverse order, distribute, align lines, row / column gap", () => {
    const { onChange } = renderFlex({ "flex-wrap": "wrap" });
    expect(screen.queryByLabelText("Row gap")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "More settings" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Reverse order" }));
    expect(onChange).toHaveBeenLastCalledWith("flex-direction", "row-reverse");
    fireEvent.change(screen.getByLabelText("Justify"), { target: { value: "space-between" } });
    expect(onChange).toHaveBeenLastCalledWith("justify-content", "space-between");
    fireEvent.change(screen.getByLabelText("Align lines"), { target: { value: "center" } });
    expect(onChange).toHaveBeenLastCalledWith("align-content", "center");
    fireEvent.change(screen.getByLabelText("Row gap"), { target: { value: "8" } });
    expect(onChange).toHaveBeenLastCalledWith("row-gap", "8px");
  });

  it("a distributed justify labels the grid in words, no cell pressed on that axis", () => {
    renderFlex({ "justify-content": "space-between", "align-items": "center" });
    expect(screen.getByTestId("inspector-flex-align-label")).toHaveTextContent("Center / Space between");
  });
});
