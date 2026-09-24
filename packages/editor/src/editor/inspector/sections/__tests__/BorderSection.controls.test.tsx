/**
 * BorderSection — width/style/color writes, preview pill, advanced
 * (individual sides + outline) disclosure. Complements the render-only
 * smoke test in inspector/__tests__/BorderSection.test.tsx.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BorderSection } from "../BorderSection";

function renderBorder(props: Partial<React.ComponentProps<typeof BorderSection>> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <BorderSection styles={{}} onChange={onChange} isOpen={true} {...props} />
  );
  return { onChange, ...utils };
}

describe("BorderSection — basic controls", () => {
  it("shows the current border-width and writes edits with unit", () => {
    const { onChange, container } = renderBorder({ styles: { "border-width": "2px" } });
    /* The first field is the compact Radius row; Width follows it. */
    const widthInput = container.querySelectorAll(".bdi-fld input")[1] as HTMLInputElement;
    expect(widthInput).toHaveValue("2");
    fireEvent.change(widthInput, { target: { value: "4" } });
    expect(onChange).toHaveBeenCalledWith("border-width", "4px");
  });

  it("changing the Style select writes border-style", () => {
    const { onChange, container } = renderBorder({ advancedExpanded: true });
    const styleSelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "dashed")
    ) as HTMLSelectElement;
    fireEvent.change(styleSelect, { target: { value: "dashed" } });
    expect(onChange).toHaveBeenCalledWith("border-style", "dashed");
  });

  it("typing a hex into the Color input writes border-color", () => {
    const { onChange } = renderBorder({ advancedExpanded: true });
    const hexInput = screen.getAllByRole("textbox", { name: "Color value" })[0];
    fireEvent.change(hexInput, { target: { value: "333333" } });
    expect(onChange).toHaveBeenCalledWith("border-color", "#333333");
  });

  /* A preview is a collapsed-state summary — the open header carries only its
     name and chevron (boards 807:8342 / 807:8567). */
  it("renders a preview pill combining width + style", () => {
    renderBorder({ styles: { "border-width": "2px", "border-style": "solid" }, isOpen: false });
    expect(screen.getByText("2px solid")).toBeInTheDocument();
  });
});

describe("BorderSection — advanced disclosure", () => {
  /* Board 7056:79008: a border-less element opens BORDER as one row, "Radius";
     the stroke and per-corner radii join the advanced block (11). With a
     border set, width/style/colour stay in view and the badge counts 8. */
  it("with no border: only Radius shows; stroke + sides + outline behind More settings (11)", () => {
    renderBorder({ onAdvancedToggle: vi.fn() });
    expect(screen.getByText("Radius")).toBeInTheDocument();
    expect(screen.queryByText("Width")).not.toBeInTheDocument();
    expect(screen.queryByText("Individual Borders")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More settings" })).toHaveTextContent("11");
  });

  it("with a border set: width/style/colour stay in view; badge 8", () => {
    renderBorder({ onAdvancedToggle: vi.fn(), styles: { "border-width": "1px", "border-style": "solid" } });
    expect(screen.getByText("Width")).toBeInTheDocument();
    expect(screen.queryByText("Outline")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More settings" })).toHaveTextContent("8");
  });

  it("individual side edit writes the border-<side> longhand", () => {
    const { onChange } = renderBorder({
      advancedExpanded: true,
      onAdvancedToggle: vi.fn(),
    });
    expect(screen.getByText("Individual Borders")).toBeInTheDocument();
    const sideInputs = screen.getAllByPlaceholderText("1px solid #ccc");
    expect(sideInputs).toHaveLength(4);
    fireEvent.change(sideInputs[0], { target: { value: "1px dashed red" } });
    expect(onChange).toHaveBeenCalledWith("border-top", "1px dashed red");
  });

  it("outline controls write outline-style", () => {
    const { onChange, container } = renderBorder({
      advancedExpanded: true,
      onAdvancedToggle: vi.fn(),
    });
    expect(screen.getByText("Outline")).toBeInTheDocument();
    // Outline style select is the one whose option set is exactly
    // none/solid/dashed/dotted (border-style select has 9 options).
    const outlineStyle = Array.from(container.querySelectorAll("select")).find(
      (s) =>
        s.options.length === 5 && // placeholder + 4 styles
        Array.from(s.options).some((o) => o.value === "dotted")
    ) as HTMLSelectElement;
    expect(outlineStyle).toBeTruthy();
    fireEvent.change(outlineStyle, { target: { value: "dotted" } });
    expect(onChange).toHaveBeenCalledWith("outline-style", "dotted");
  });
});
