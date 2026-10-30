/**
 * Flex item / Grid item — 2L9 247:22853: a flex / grid child's own section
 * (Grow · Shrink · Basis · Order · Align self; Column span · Row span ·
 * Align self · Justify self), every row on the face.
 *
 * @license BSD-3-Clause
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FlexItemSection, GridItemSection } from "../ItemControls";

const NAMES = ["Grow", "Shrink", "Basis", "Order", "Align self"];
/** The rows' names in document order. */
const labels = () => {
  const inputs = NAMES.map((n) => screen.getByLabelText(n));
  return [...inputs].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)).map((el) => NAMES[inputs.indexOf(el)]);
};

describe("Flex item", () => {
  it("Grow · Shrink · Basis · Order · Align self, in board order, each writing its property", () => {
    const onChange = vi.fn();
    render(<FlexItemSection styles={{}} onChange={onChange} isOpen />);
    expect(screen.getByText("Flex item")).toBeInTheDocument();
    expect(labels()).toEqual(NAMES);
    expect(screen.getByLabelText("Align self")).toHaveValue("auto");
    fireEvent.change(screen.getByLabelText("Grow"), { target: { value: "1" } });
    expect(onChange).toHaveBeenLastCalledWith("flex-grow", "1");
    fireEvent.change(screen.getByLabelText("Shrink"), { target: { value: "0" } });
    expect(onChange).toHaveBeenLastCalledWith("flex-shrink", "0");
    fireEvent.change(screen.getByLabelText("Basis"), { target: { value: "200px" } });
    expect(onChange).toHaveBeenLastCalledWith("flex-basis", "200px");
    fireEvent.change(screen.getByLabelText("Order"), { target: { value: "2" } });
    expect(onChange).toHaveBeenLastCalledWith("order", "2");
    fireEvent.change(screen.getByLabelText("Align self"), { target: { value: "center" } });
    expect(onChange).toHaveBeenLastCalledWith("align-self", "center");
  });
});

describe("Grid item", () => {
  it("A02: Column / Row are the written placement, and the self alignments", () => {
    const onChange = vi.fn();
    render(<GridItemSection styles={{ "grid-row": "2 / 4" }} onChange={onChange} isOpen />);
    fireEvent.change(screen.getByLabelText("Column"), { target: { value: "2 / span 2" } });
    expect(onChange).toHaveBeenLastCalledWith("grid-column", "2 / span 2");
    expect(screen.getByLabelText("Row")).toHaveValue("2 / 4");
    fireEvent.change(screen.getByLabelText("Justify self"), { target: { value: "end" } });
    expect(onChange).toHaveBeenLastCalledWith("justify-self", "end");
  });
});
