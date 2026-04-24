import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NumericStepper } from "../NumericStepper";

describe("NumericStepper — clamp on empty/dash", () => {
  it("clamps to min when input is cleared (value=10, min=5)", () => {
    const onChange = vi.fn();
    render(<NumericStepper value={10} min={5} onChange={onChange} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("clamps to min when input becomes dash and min > 0", () => {
    const onChange = vi.fn();
    render(<NumericStepper value={10} min={5} onChange={onChange} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "-" } });
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("falls back to 0 when input is cleared and no min set", () => {
    const onChange = vi.fn();
    render(<NumericStepper value={10} onChange={onChange} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("clamps numeric paste below min", () => {
    const onChange = vi.fn();
    render(<NumericStepper value={10} min={5} onChange={onChange} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "1" } });
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("clamps numeric paste above max", () => {
    const onChange = vi.fn();
    render(<NumericStepper value={10} max={20} onChange={onChange} />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "999" } });
    expect(onChange).toHaveBeenCalledWith(20);
  });
});
