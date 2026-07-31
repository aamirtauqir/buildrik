/**
 * Slider (92:30) — contract tests.
 *
 * Moved from `editor/ui/__tests__/atoms.test.tsx` (Task 6, flowbite
 * big-bang) when Slider ported to chrome-ui — same describe block, new home.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Slider } from "../index";

describe("Slider (92:30)", () => {
  it("renders a range input with the accessible name and value", () => {
    const onChange = vi.fn();
    render(<Slider label="Opacity" value={62} min={0} max={100} onChange={onChange} />);
    const range = screen.getByRole("slider", { name: "Opacity" });
    expect(range).toHaveValue("62");
    fireEvent.change(range, { target: { value: "70" } });
    expect(onChange).toHaveBeenCalledWith(70);
  });

  it("numeric field mirrors the value, clamps to max, and hides via withField", () => {
    const onChange = vi.fn();
    const { rerender } = render(<Slider label="Opacity" value={62} min={0} max={100} onChange={onChange} unit="%" />);
    const num = screen.getByRole("spinbutton", { name: "Opacity value" });
    expect(num).toHaveValue(62);
    fireEvent.change(num, { target: { value: "250" } });
    expect(onChange).toHaveBeenCalledWith(100);
    rerender(<Slider label="Opacity" value={62} onChange={onChange} withField={false} />);
    expect(screen.queryByRole("spinbutton")).toBeNull();
  });

  it("disabled disables both inputs", () => {
    render(<Slider label="Opacity" value={10} onChange={() => {}} disabled />);
    expect(screen.getByRole("slider", { name: "Opacity" })).toBeDisabled();
    expect(screen.getByRole("spinbutton", { name: "Opacity value" })).toBeDisabled();
  });
});
