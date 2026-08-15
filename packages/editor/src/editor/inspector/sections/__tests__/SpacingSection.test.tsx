/**
 * SpacingSection — box-model values, linked/unlinked writes, shorthand
 * parsing, advanced gap disclosure.
 *
 * DOM notes (verified against the real render):
 *  - The "link margin/padding sides" toggle Buttons carry visible text
 *    ("Margin" / "Padding"), so their ACCESSIBLE NAME is that text — the
 *    `title` ("Link margin sides") is only a fallback and does NOT win.
 *    Query by the text name; assert link state via aria-pressed.
 *  - Margin axis inputs are direct children of .bdi-mbox; padding axis
 *    inputs live in the nested .bdi-pbox. Both use aria-label
 *    top/right/bottom/left, so we disambiguate via the container class.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SpacingSection } from "../SpacingSection";

function renderSpacing(props: Partial<React.ComponentProps<typeof SpacingSection>> = {}) {
  const onChange = vi.fn();
  const onBatchChange = vi.fn();
  const utils = render(
    <SpacingSection
      styles={{}}
      onChange={onChange}
      onBatchChange={onBatchChange}
      isOpen={true}
      {...props}
    />
  );
  return { onChange, onBatchChange, ...utils };
}

const marginInput = (container: HTMLElement, side: "t" | "r" | "b" | "l") =>
  container.querySelector(`.bdi-mbox > input.bdi-ax.${side}`) as HTMLInputElement;
const paddingInput = (container: HTMLElement, side: "t" | "r" | "b" | "l") =>
  container.querySelector(`.bdi-pbox > input.bdi-ax.${side}`) as HTMLInputElement;

const marginToggle = () => screen.getByRole("button", { name: "Margin" });
const paddingToggle = () => screen.getByRole("button", { name: "Padding" });

describe("SpacingSection — current values render", () => {
  it("shows longhand margin/padding values in the box-model inputs", () => {
    const { container } = renderSpacing({
      styles: { "margin-top": "10px", "padding-left": "4px" },
    });
    expect(marginInput(container, "t")).toHaveValue("10");
    expect(paddingInput(container, "l")).toHaveValue("4");
  });

  it("falls back to shorthand parsing when longhands are absent", () => {
    const { container } = renderSpacing({ styles: { margin: "10px 20px" } });
    expect(marginInput(container, "t")).toHaveValue("10");
    expect(marginInput(container, "r")).toHaveValue("20");
    expect(marginInput(container, "b")).toHaveValue("10");
    expect(marginInput(container, "l")).toHaveValue("20");
  });

  it("shows an 'm <value>' preview when all margin sides match", () => {
    renderSpacing({ styles: { margin: "16px" }, isOpen: false });
    expect(screen.getByText("m 16px")).toBeInTheDocument();
  });
});

describe("SpacingSection — link toggles (accessible name = visible text)", () => {
  it("margin/padding toggles start unpressed", () => {
    renderSpacing();
    expect(marginToggle()).toHaveAttribute("aria-pressed", "false");
    expect(paddingToggle()).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking the Margin toggle flips it to pressed", () => {
    renderSpacing();
    fireEvent.click(marginToggle());
    expect(marginToggle()).toHaveAttribute("aria-pressed", "true");
  });
});

describe("SpacingSection — unlinked writes", () => {
  it("editing margin-top writes only margin-top", () => {
    const { container, onChange, onBatchChange } = renderSpacing();
    fireEvent.change(marginInput(container, "t"), { target: { value: "24" } });
    expect(onChange).toHaveBeenCalledWith("margin-top", "24px");
    expect(onBatchChange).not.toHaveBeenCalled();
  });

  it("editing padding-right writes only padding-right", () => {
    const { container, onChange } = renderSpacing();
    fireEvent.change(paddingInput(container, "r"), { target: { value: "8" } });
    expect(onChange).toHaveBeenCalledWith("padding-right", "8px");
  });
});

describe("SpacingSection — linked writes", () => {
  it("with margin linked, one edit batch-writes all four margin sides", () => {
    const { container, onChange, onBatchChange } = renderSpacing();
    fireEvent.click(marginToggle());
    fireEvent.change(marginInput(container, "t"), { target: { value: "12" } });
    expect(onBatchChange).toHaveBeenCalledWith({
      "margin-top": "12px",
      "margin-right": "12px",
      "margin-bottom": "12px",
      "margin-left": "12px",
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("with padding linked, one edit batch-writes all four padding sides", () => {
    const { container, onBatchChange } = renderSpacing();
    fireEvent.click(paddingToggle());
    fireEvent.change(paddingInput(container, "b"), { target: { value: "6" } });
    expect(onBatchChange).toHaveBeenCalledWith({
      "padding-top": "6px",
      "padding-right": "6px",
      "padding-bottom": "6px",
      "padding-left": "6px",
    });
  });
});

describe("SpacingSection — advanced gap disclosure", () => {
  it("hides row/column gap until advancedExpanded; toggle shows count 2", () => {
    const onAdvancedToggle = vi.fn();
    renderSpacing({ onAdvancedToggle });
    expect(screen.queryByText("Row gap")).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "More settings" });
    expect(toggle).toHaveTextContent("2");
    fireEvent.click(toggle);
    expect(onAdvancedToggle).toHaveBeenCalledTimes(1);
  });

  it("writes row-gap when the advanced Row gap input is edited", () => {
    const { onChange, container } = renderSpacing({
      advancedExpanded: true,
      onAdvancedToggle: vi.fn(),
      styles: { "row-gap": "4px" },
    });
    expect(screen.getByText("Row gap")).toBeInTheDocument();
    // Row gap is the first InputWithUnit (.bdi-fld) textbox outside the box model.
    const rowGapInput = container.querySelector(".bdi-fld input") as HTMLInputElement;
    expect(rowGapInput).toHaveValue("4");
    fireEvent.change(rowGapInput, { target: { value: "10" } });
    expect(onChange).toHaveBeenCalledWith("row-gap", "10px");
  });
});
