/**
 * GridControls — board 17's grid rows (Columns + Gap) and the More settings
 * that keep the rest of the old Grid section.
 *
 * @license BSD-3-Clause
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GridControls, columnCount } from "../GridControls";

function renderGrid(styles: Record<string, string> = {}) {
  const onChange = vi.fn();
  render(<GridControls styles={{ display: "grid", ...styles }} onChange={onChange} />);
  return { onChange };
}

describe("columnCount", () => {
  it("reads repeat(N), explicit tracks, and nothing for auto-fit", () => {
    expect(columnCount("repeat(3, 1fr)")).toBe("3");
    expect(columnCount("200px 1fr 200px")).toBe("3");
    expect(columnCount("minmax(0, 1fr) 2fr")).toBe("2");
    expect(columnCount("repeat(auto-fit, minmax(200px, 1fr))")).toBe("");
    expect(columnCount("")).toBe("");
  });
});

describe("GridControls — board 17", () => {
  it("Columns shows the count and writes repeat(N, 1fr)", () => {
    const { onChange } = renderGrid({ "grid-template-columns": "1fr 1fr 1fr", gap: "24px" });
    expect(screen.getByLabelText("Columns")).toHaveValue(3);
    expect(screen.getByLabelText("Gap")).toHaveValue("24");
    fireEvent.change(screen.getByLabelText("Columns"), { target: { value: "4" } });
    expect(onChange).toHaveBeenCalledWith("grid-template-columns", "repeat(4, 1fr)");
  });

  it("More settings: custom tracks, rows, flow, alignment, row / column gap", () => {
    const { onChange } = renderGrid();
    fireEvent.click(screen.getByRole("button", { name: "More settings" }));
    fireEvent.change(screen.getByLabelText("Column tracks"), { target: { value: "250px 1fr" } });
    expect(onChange).toHaveBeenLastCalledWith("grid-template-columns", "250px 1fr");
    fireEvent.change(screen.getByLabelText("Rows"), { target: { value: "auto 1fr" } });
    expect(onChange).toHaveBeenLastCalledWith("grid-template-rows", "auto 1fr");
    fireEvent.change(screen.getByLabelText("Flow"), { target: { value: "column" } });
    expect(onChange).toHaveBeenLastCalledWith("grid-auto-flow", "column");
    fireEvent.change(screen.getByLabelText("Column gap"), { target: { value: "12" } });
    expect(onChange).toHaveBeenLastCalledWith("column-gap", "12px");
    fireEvent.click(screen.getByRole("button", { name: "justify: center, align: center" }));
    expect(onChange).toHaveBeenCalledWith("justify-items", "center");
  });
});
