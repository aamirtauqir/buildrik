/**
 * Advanced layout rows (2L9 A03 247:22310): one select per property, each
 * writing its own property; an `overflow` shorthand reads into both axes.
 * @license BSD-3-Clause
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdvancedLayoutRows } from "../OverflowVisibilityControls";

describe("Advanced layout rows (A03)", () => {
  it("Overflow X / Y, Box sizing, Visibility, Float, Clear — in board order, each writes its property", () => {
    const onChange = vi.fn();
    render(<AdvancedLayoutRows styles={{ overflow: "hidden", clear: "both" }} onChange={onChange} />);
    const labels = ["Overflow X", "Overflow Y", "Box sizing", "Visibility", "Float", "Clear"];
    for (const l of labels) expect(screen.getByLabelText(l)).toBeInTheDocument();
    expect((screen.getByLabelText("Overflow Y") as HTMLSelectElement).value).toBe("hidden");
    expect((screen.getByLabelText("Clear") as HTMLSelectElement).value).toBe("both");
    fireEvent.change(screen.getByLabelText("Overflow X"), { target: { value: "auto" } });
    expect(onChange).toHaveBeenLastCalledWith("overflow-x", "auto");
    fireEvent.change(screen.getByLabelText("Box sizing"), { target: { value: "border-box" } });
    expect(onChange).toHaveBeenLastCalledWith("box-sizing", "border-box");
  });
});
