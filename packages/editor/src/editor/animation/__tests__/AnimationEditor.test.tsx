/**
 * AnimationEditor — 2L9 A10 (247:26063): "CSS animation" with Preset (all 25
 * presets, grouped Entrance 12 / Attention 8 / Exit 5) and the saved Trigger
 * read-only, then "Playback options": Duration, Delay (seconds), Direction,
 * Fill, Repeat, Easing. Re-baselined from the preset-grid / slider layout.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import * as React from "react";
import { AnimationEditor } from "../AnimationEditor";
import type { AnimationConfig } from "@/shared/types/animations";

const base: AnimationConfig = {
  type: "fadeIn",
  duration: 1200,
  delay: 100,
  easing: "ease",
  direction: "alternate",
  iterations: -1,
  trigger: "hover",
  fillMode: "both",
};

describe("AnimationEditor — A10", () => {
  it("rows in board order with the board's readouts", () => {
    render(<AnimationEditor animation={base} onChange={vi.fn()} trigger="Hover · saved legacy" />);
    const ed = screen.getByTestId("animation-editor");
    expect(ed.textContent).toMatch(/^CSS animationLegacy triggerPreset.*Trigger.*Hover · saved legacy.*Playback options.*Duration.*Delay.*Direction.*Fill.*Repeat.*Easing/);
    expect(screen.getByLabelText("Duration")).toHaveValue("1.2 s");
    expect(screen.getByLabelText("Delay")).toHaveValue("0.1 s");
    expect((screen.getByLabelText("Direction") as HTMLSelectElement).selectedOptions[0].textContent).toBe("Alternate");
    expect((screen.getByLabelText("Fill") as HTMLSelectElement).selectedOptions[0].textContent).toBe("Both");
    expect((screen.getByLabelText("Repeat") as HTMLSelectElement).selectedOptions[0].textContent).toBe("Infinite");
  });

  it("Preset offers every preset, grouped 12 / 8 / 5, and keeps the other fields", () => {
    const onChange = vi.fn();
    render(<AnimationEditor animation={base} onChange={onChange} />);
    const preset = screen.getByLabelText("Preset");
    const groups = preset.querySelectorAll("optgroup");
    expect([...groups].map((g) => [g.label, g.querySelectorAll("option").length])).toEqual([
      ["Entrance", 12],
      ["Attention", 8],
      ["Exit", 5],
    ]);
    fireEvent.change(preset, { target: { value: "pulse" } });
    expect(onChange).toHaveBeenCalledWith({ ...base, type: "pulse" });
  });

  it("Duration and Delay commit in seconds (or ms) on blur", () => {
    const onChange = vi.fn();
    render(<AnimationEditor animation={base} onChange={onChange} />);
    const duration = screen.getByLabelText("Duration");
    fireEvent.change(duration, { target: { value: "2" } });
    fireEvent.blur(duration);
    expect(onChange).toHaveBeenLastCalledWith({ ...base, duration: 2000 });
    const delay = screen.getByLabelText("Delay");
    fireEvent.change(delay, { target: { value: "250ms" } });
    fireEvent.blur(delay);
    expect(onChange).toHaveBeenLastCalledWith({ ...base, delay: 250 });
  });

  it("Direction, Fill and Repeat write their fields", () => {
    const onChange = vi.fn();
    render(<AnimationEditor animation={base} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Direction"), { target: { value: "reverse" } });
    expect(onChange).toHaveBeenLastCalledWith({ ...base, direction: "reverse" });
    fireEvent.change(screen.getByLabelText("Fill"), { target: { value: "forwards" } });
    expect(onChange).toHaveBeenLastCalledWith({ ...base, fillMode: "forwards" });
    fireEvent.change(screen.getByLabelText("Repeat"), { target: { value: "3" } });
    expect(onChange).toHaveBeenLastCalledWith({ ...base, iterations: 3 });
  });

  it("a load trigger has no Legacy mark", () => {
    render(<AnimationEditor animation={{ ...base, trigger: "load" }} onChange={vi.fn()} trigger="Load" />);
    expect(screen.queryByText("Legacy trigger")).toBeNull();
    expect(within(screen.getByTestId("anim-trigger")).getByText("Load")).toBeInTheDocument();
  });
});
