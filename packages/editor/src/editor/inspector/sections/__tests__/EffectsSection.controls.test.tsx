/**
 * EffectsSection — opacity slider, shadow presets (incl. inner-shadow merge),
 * transition/cursor selects, collapsed preview. Compose helpers
 * (composeTransform / composeFilter) are covered by EffectsSection.compose.test.ts.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EffectsSection } from "../EffectsSection";

function renderEffects(styles: Record<string, string> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <EffectsSection styles={styles} onChange={onChange} isOpen={true} />
  );
  return { onChange, ...utils };
}

const rangeInputs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLInputElement>('input[type="range"]'));

describe("EffectsSection — opacity", () => {
  it("renders 100 when opacity unset and writes fraction on change", () => {
    const { onChange, container } = renderEffects();
    const [opacitySlider] = rangeInputs(container);
    expect(opacitySlider).toHaveValue("100");
    fireEvent.change(opacitySlider, { target: { value: "50" } });
    expect(onChange).toHaveBeenCalledWith("opacity", "0.5");
  });

  it("parses an existing opacity fraction back to percent", () => {
    const { container } = renderEffects({ opacity: "0.25" });
    expect(rangeInputs(container)[0]).toHaveValue("25");
  });
});

describe("EffectsSection — shadow presets", () => {
  it("outer preset click writes the preset box-shadow", () => {
    const { onChange } = renderEffects();
    // "MD" exists in both outer and inner grids; outer renders first.
    fireEvent.click(screen.getAllByRole("button", { name: "MD" })[0]);
    expect(onChange).toHaveBeenCalledWith("box-shadow", "0 4px 6px rgba(0,0,0,0.1)");
  });

  it("inner preset merges with the existing outer shadow", () => {
    const { onChange } = renderEffects({
      "box-shadow": "0 4px 6px rgba(0,0,0,0.1)",
    });
    fireEvent.click(screen.getByRole("button", { name: "Soft" }));
    expect(onChange).toHaveBeenCalledWith(
      "box-shadow",
      "0 4px 6px rgba(0,0,0,0.1), inset 0 2px 4px rgba(0,0,0,0.06)"
    );
  });

  it("inner 'None' keeps the outer shadow", () => {
    const { onChange } = renderEffects({
      "box-shadow": "0 4px 6px rgba(0,0,0,0.1), inset 0 2px 4px rgba(0,0,0,0.06)",
    });
    // Both grids have a "None" preset; the inner grid's None is the second.
    fireEvent.click(screen.getAllByRole("button", { name: "None" })[1]);
    expect(onChange).toHaveBeenCalledWith("box-shadow", "0 4px 6px rgba(0,0,0,0.1)");
  });

  it("marks the active outer preset as pressed", () => {
    renderEffects({ "box-shadow": "0 4px 6px rgba(0,0,0,0.1)" });
    expect(screen.getAllByRole("button", { name: "MD" })[0]).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});

describe("EffectsSection — transition + cursor selects", () => {
  it("transition Property select writes transition-property", () => {
    const { onChange, container } = renderEffects();
    const propertySelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "box-shadow")
    ) as HTMLSelectElement;
    fireEvent.change(propertySelect, { target: { value: "opacity" } });
    expect(onChange).toHaveBeenCalledWith("transition-property", "opacity");
  });

  it("cursor select writes cursor", () => {
    const { onChange, container } = renderEffects();
    const cursorSelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "grabbing")
    ) as HTMLSelectElement;
    fireEvent.change(cursorSelect, { target: { value: "pointer" } });
    expect(onChange).toHaveBeenCalledWith("cursor", "pointer");
  });
});

describe("EffectsSection — collapsed preview", () => {
  it("summarizes shadow count and reduced opacity", () => {
    renderEffects({ "box-shadow": "0 4px 6px rgba(0,0,0,0.1)", opacity: "0.5" });
    expect(screen.getByText("1 shadow · 50%")).toBeInTheDocument();
  });

  it("renders no preview when no effects are applied", () => {
    const { container } = renderEffects();
    expect(container.querySelector(".bdi-sec-preview")).toBeNull();
  });
});
