/**
 * ItemControls — flex-item and grid-item properties, drawn inside Size while
 * the parent is a flex / grid container (their v4 home; nothing the old
 * FlexItemControls / GridSection item block wrote is lost).
 *
 * @license BSD-3-Clause
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ItemControls } from "../ItemControls";

describe("ItemControls — flex parent", () => {
  it("Grow and Align self on the face; Shrink, Basis, Order behind More settings", () => {
    const onChange = vi.fn();
    const { rerender } = render(<ItemControls parent="flex" styles={{}} onChange={onChange} advanced={false} />);
    expect(screen.queryByLabelText("Shrink")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Grow"), { target: { value: "1" } });
    expect(onChange).toHaveBeenLastCalledWith("flex-grow", "1");
    fireEvent.change(screen.getByLabelText("Align self"), { target: { value: "center" } });
    expect(onChange).toHaveBeenLastCalledWith("align-self", "center");

    rerender(<ItemControls parent="flex" styles={{}} onChange={onChange} advanced />);
    fireEvent.change(screen.getByLabelText("Shrink"), { target: { value: "0" } });
    expect(onChange).toHaveBeenLastCalledWith("flex-shrink", "0");
    fireEvent.change(screen.getByLabelText("Basis"), { target: { value: "200px" } });
    expect(onChange).toHaveBeenLastCalledWith("flex-basis", "200px");
    fireEvent.change(screen.getByLabelText("Order"), { target: { value: "2" } });
    expect(onChange).toHaveBeenLastCalledWith("order", "2");
  });
});

describe("ItemControls — grid parent", () => {
  it("column / row span, and a custom placement stays selectable", () => {
    const onChange = vi.fn();
    render(<ItemControls parent="grid" styles={{ "grid-row": "2 / 4" }} onChange={onChange} advanced />);
    fireEvent.change(screen.getByLabelText("Column span"), { target: { value: "1 / -1" } });
    expect(onChange).toHaveBeenLastCalledWith("grid-column", "1 / -1");
    expect(screen.getByLabelText("Row span")).toHaveValue("2 / 4");
    fireEvent.change(screen.getByLabelText("Justify self"), { target: { value: "end" } });
    expect(onChange).toHaveBeenLastCalledWith("justify-self", "end");
  });
});
