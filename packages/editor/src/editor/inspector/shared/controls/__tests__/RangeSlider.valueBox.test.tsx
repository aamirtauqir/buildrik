/**
 * 2L9 36:2: a RangeSlider carries a value box — a typed value commits on
 * Enter (clamped to the range), Escape drops the draft.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RangeSlider } from "../SliderControls";

describe("RangeSlider value box", () => {
  it("commits a typed value on Enter, clamped; Escape restores", () => {
    const onChange = vi.fn();
    render(<RangeSlider label="Contrast" value={100} min={0} max={200} unit="%" onChange={onChange} />);
    const box = screen.getByRole("textbox", { name: "Contrast value" });
    expect(box).toHaveValue("100");
    fireEvent.change(box, { target: { value: "250" } });
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(200);
    fireEvent.change(box, { target: { value: "40" } });
    fireEvent.keyDown(box, { key: "Escape" });
    expect(box).toHaveValue("100");
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
