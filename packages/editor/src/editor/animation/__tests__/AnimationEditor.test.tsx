/**
 * AnimationEditor pins:
 * - Preset counts per category: 12 entrance / 8 attention / 5 exit.
 * - Timing controls (duration/delay sliders, easing select) call onChange.
 * - Generated CSS block reflects the selected preset + timing.
 * - Trigger UI was REMOVED 2026-05-18 (engine never honored load/scroll/
 *   hover/click) — pinned as absent.
 * - AnimationEditor has NO GSAP path at all (does not import gsap; triggered
 *   animations live in the Interactions section instead) — nothing to mock.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { AnimationEditor } from "../AnimationEditor";
import type { AnimationConfig } from "../../../shared/types/animations";
import { DEFAULT_ANIMATION } from "../../../shared/types/animations";

const baseAnimation: AnimationConfig = {
  type: "fadeIn",
  duration: 1000,
  delay: 0,
  easing: "ease",
  direction: "normal",
  iterations: 1,
  trigger: "load",
};

/** The preset grid is the single display:grid div in the editor. */
function getPresetButtons(container: HTMLElement): HTMLButtonElement[] {
  const grid = Array.from(container.querySelectorAll("div")).find(
    (d) => d.style.display === "grid",
  );
  if (!grid) throw new Error("preset grid not found");
  return Array.from(grid.querySelectorAll("button"));
}

describe("AnimationEditor — preset counts (pinned 12/8/5)", () => {
  it("shows 12 entrance presets on the default tab", () => {
    const { container } = render(<AnimationEditor onChange={vi.fn()} />);

    const entranceTab = screen.getByRole("tab", { name: "Entrance" });
    expect(entranceTab).toHaveAttribute("aria-selected", "true");
    expect(getPresetButtons(container)).toHaveLength(12);
    expect(screen.getByText("Fade In")).toBeInTheDocument();
    expect(screen.getByText("Rotate In")).toBeInTheDocument();
  });

  it("shows 8 attention presets", () => {
    const { container } = render(<AnimationEditor onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Attention" }));
    expect(getPresetButtons(container)).toHaveLength(8);
    expect(screen.getByText("Pulse")).toBeInTheDocument();
    expect(screen.getByText("Rubber Band")).toBeInTheDocument();
  });

  it("shows 5 exit presets", () => {
    const { container } = render(<AnimationEditor onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("tab", { name: "Exit" }));
    expect(getPresetButtons(container)).toHaveLength(5);
    expect(screen.getByText("Fade Out")).toBeInTheDocument();
    expect(screen.getByText("Slide Out Up")).toBeInTheDocument();
  });

  it("clicking a preset calls onChange with the new type, preserving other fields", () => {
    const onChange = vi.fn();
    render(<AnimationEditor animation={baseAnimation} onChange={onChange} />);

    fireEvent.click(screen.getByText("Zoom In"));
    expect(onChange).toHaveBeenCalledWith({ ...baseAnimation, type: "zoomIn" });
  });
});

describe("AnimationEditor — timing controls", () => {
  it("duration slider change calls onChange with the numeric duration", () => {
    const onChange = vi.fn();
    const { container } = render(
      <AnimationEditor animation={baseAnimation} onChange={onChange} />,
    );

    const [durationInput] = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="range"]'),
    );
    fireEvent.change(durationInput, { target: { value: "500" } });
    expect(onChange).toHaveBeenCalledWith({ ...baseAnimation, duration: 500 });
  });

  it("delay slider change calls onChange with the numeric delay", () => {
    const onChange = vi.fn();
    const { container } = render(
      <AnimationEditor animation={baseAnimation} onChange={onChange} />,
    );

    const rangeInputs = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="range"]'),
    );
    expect(rangeInputs).toHaveLength(2); // duration + delay only
    fireEvent.change(rangeInputs[1], { target: { value: "300" } });
    expect(onChange).toHaveBeenCalledWith({ ...baseAnimation, delay: 300 });
  });

  it("easing select change calls onChange with the chosen easing", () => {
    const onChange = vi.fn();
    render(<AnimationEditor animation={baseAnimation} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Easing"), { target: { value: "linear" } });
    expect(onChange).toHaveBeenCalledWith({ ...baseAnimation, easing: "linear" });
  });

  it("slider head rows display the current duration and delay values", () => {
    const { container } = render(
      <AnimationEditor
        animation={{ ...baseAnimation, duration: 700, delay: 200 }}
        onChange={vi.fn()}
      />,
    );
    const values = Array.from(
      container.querySelectorAll<HTMLInputElement>(".bk-slider__num"),
    ).map((el) => el.value);
    expect(values).toEqual(["700", "200"]);
  });
});

describe("AnimationEditor — generated CSS output", () => {
  it("reflects the default animation config", () => {
    const { container } = render(<AnimationEditor onChange={vi.fn()} />);
    // DEFAULT_ANIMATION: fadeIn 1000ms ease 0ms, 1 iteration.
    expect(DEFAULT_ANIMATION.type).toBe("fadeIn");
    expect(container.textContent).toContain("animation: fadeIn 1000ms ease 0ms 1;");
  });

  it("reflects a custom preset + timing", () => {
    render(
      <AnimationEditor
        animation={{
          ...baseAnimation,
          type: "bounceIn",
          duration: 500,
          delay: 200,
          easing: "linear",
          iterations: 3,
        }}
        onChange={vi.fn()}
      />,
    );
    expect(document.body.textContent).toContain(
      "animation: bounceIn 500ms linear 200ms 3;",
    );
  });

  it("renders 'infinite' for iterations === -1", () => {
    render(
      <AnimationEditor
        animation={{ ...baseAnimation, iterations: -1 }}
        onChange={vi.fn()}
      />,
    );
    expect(document.body.textContent).toContain("animation: fadeIn 1000ms ease 0ms infinite;");
  });
});

describe("AnimationEditor — removed/absent features (pinned)", () => {
  it("renders NO trigger controls (trigger row removed 2026-05-18)", () => {
    const { container } = render(<AnimationEditor onChange={vi.fn()} />);

    expect(screen.queryByText(/trigger/i)).not.toBeInTheDocument();
    // The only select in the editor is Easing — no trigger dropdown with
    // load/scroll/hover/click options exists anymore.
    const selects = container.querySelectorAll("select");
    expect(selects).toHaveLength(1);
    const optionValues = Array.from(selects[0].options).map((o) => o.value);
    expect(optionValues).not.toContain("load");
    expect(optionValues).not.toContain("scroll");
    expect(optionValues).not.toContain("hover");
    expect(optionValues).not.toContain("click");
  });

  it("preview button fires onPreview", () => {
    const onPreview = vi.fn();
    render(<AnimationEditor onChange={vi.fn()} onPreview={onPreview} />);

    fireEvent.click(screen.getByRole("button", { name: /Preview Animation/ }));
    expect(onPreview).toHaveBeenCalledTimes(1);
  });
});
