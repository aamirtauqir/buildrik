/**
 * BorderSection — 2L9 247:24493: Width · Style · Color always, the corners,
 * then "Outline" once set; More settings adds the corners, the outline and
 * the individual sides.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BorderSection } from "../BorderSection";

function renderBorder(props: Partial<React.ComponentProps<typeof BorderSection>> = {}) {
  const onChange = vi.fn();
  const utils = render(<BorderSection styles={{}} onChange={onChange} isOpen={true} {...props} />);
  return { onChange, ...utils };
}

describe("BorderSection — stroke", () => {
  it("Width, Style and Color lead the open section, in that order", () => {
    renderBorder();
    const labels = Array.from(document.querySelectorAll("[data-testid^='inspector-field-']")).map((n) => n.getAttribute("data-testid"));
    expect(labels.slice(0, 3)).toEqual(["inspector-field-width", "inspector-field-style", "inspector-field-color"]);
  });

  it("shows the current border-width and writes edits with unit", () => {
    const { onChange } = renderBorder({ styles: { "border-width": "2px" } });
    const width = screen.getAllByLabelText("Width")[0];
    expect(width).toHaveValue("2");
    fireEvent.change(width, { target: { value: "4" } });
    expect(onChange).toHaveBeenCalledWith("border-width", "4px");
  });

  it("changing the Style select writes border-style", () => {
    const { onChange, container } = renderBorder();
    const styleSelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "groove"),
    ) as HTMLSelectElement;
    fireEvent.change(styleSelect, { target: { value: "dashed" } });
    expect(onChange).toHaveBeenCalledWith("border-style", "dashed");
  });

  it("typing a hex into the Color input writes border-color", () => {
    const { onChange } = renderBorder();
    fireEvent.change(screen.getAllByRole("textbox", { name: "Color value" })[0], { target: { value: "333333" } });
    expect(onChange).toHaveBeenCalledWith("border-color", "#333333");
  });
});

describe("BorderSection — Outline and More settings", () => {
  it("no outline: no Outline group; More settings counts corners + outline + sides (12)", () => {
    renderBorder({ onAdvancedToggle: vi.fn() });
    expect(screen.queryByText("Outline")).not.toBeInTheDocument();
    expect(screen.queryByText("Individual sides")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More settings" })).toHaveTextContent("12");
  });

  it("an outline set shows the Outline group (Width · Style · Color · Offset)", () => {
    const { onChange, container } = renderBorder({
      styles: { "outline-width": "2px", "outline-style": "solid", "outline-offset": "4px" },
      onAdvancedToggle: vi.fn(),
    });
    expect(screen.getByText("Outline")).toBeInTheDocument();
    expect(screen.getByLabelText("Offset")).toHaveValue("4");
    const outlineStyle = Array.from(container.querySelectorAll("select")).find(
      (s) => Array.from(s.options).some((o) => o.value === "dotted") && !Array.from(s.options).some((o) => o.value === "groove"),
    ) as HTMLSelectElement;
    fireEvent.change(outlineStyle, { target: { value: "dotted" } });
    expect(onChange).toHaveBeenCalledWith("outline-style", "dotted");
    expect(screen.getByRole("button", { name: "More settings" })).toHaveTextContent("8");
  });

  it("More settings: individual side edit writes the border-<side> longhand", () => {
    const { onChange } = renderBorder({ advancedExpanded: true, onAdvancedToggle: vi.fn() });
    expect(screen.getByText("Individual sides")).toBeInTheDocument();
    const sideInputs = screen.getAllByPlaceholderText("1px solid #ccc");
    expect(sideInputs).toHaveLength(4);
    fireEvent.change(sideInputs[0], { target: { value: "1px dashed red" } });
    expect(onChange).toHaveBeenCalledWith("border-top", "1px dashed red");
  });
});
