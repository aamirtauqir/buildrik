/**
 * Border essentials schema — render fidelity against the hand-written
 * BorderSection.tsx essentials block.
 *
 * Verifies:
 *   - All 4 essential controls render (Width, Style, Color, Radius)
 *   - Style select contains the 9 border-style options
 *   - Editing each control routes through the right change handler
 *   - Corner radius linked→batch write works via the schema
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { InspectorRenderer } from "../../InspectorRenderer";
import { borderEssentialsSchema } from "../border";

describe("borderEssentialsSchema", () => {
  const styles = {
    "border-width": "2px",
    "border-style": "solid",
    "border-color": "#333333",
    "border-top-left-radius": "4px",
    "border-top-right-radius": "4px",
    "border-bottom-right-radius": "4px",
    "border-bottom-left-radius": "4px",
  };

  it("renders all four essential controls", () => {
    render(
      <InspectorRenderer
        schema={borderEssentialsSchema}
        styles={styles}
        onChange={vi.fn()}
        onBatchChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Width")).toBeInTheDocument();
    expect(screen.getByLabelText("Style")).toBeInTheDocument();
    expect(screen.getByLabelText("Color")).toBeInTheDocument();
    // Corners4 exposes TL/TR/BR/BL inputs.
    expect(screen.getByLabelText("TL")).toBeInTheDocument();
    expect(screen.getByLabelText("TR")).toBeInTheDocument();
    expect(screen.getByLabelText("BR")).toBeInTheDocument();
    expect(screen.getByLabelText("BL")).toBeInTheDocument();
  });

  it("Style select carries all nine CSS border-style values", () => {
    render(
      <InspectorRenderer
        schema={borderEssentialsSchema}
        styles={styles}
        onChange={vi.fn()}
        onBatchChange={vi.fn()}
      />,
    );
    const select = screen.getByLabelText("Style") as HTMLSelectElement;
    const values = Array.from(select.options).map((o) => o.value);
    expect(values).toEqual([
      "none",
      "solid",
      "dashed",
      "dotted",
      "double",
      "groove",
      "ridge",
      "inset",
      "outset",
    ]);
  });

  it("editing Width routes border-width through onChange", () => {
    const onChange = vi.fn();
    render(
      <InspectorRenderer
        schema={borderEssentialsSchema}
        styles={styles}
        onChange={onChange}
        onBatchChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Width"), {
      target: { value: "4px" },
    });
    expect(onChange).toHaveBeenCalledWith("border-width", "4px");
  });

  it("editing Color routes border-color through onChange", () => {
    const onChange = vi.fn();
    render(
      <InspectorRenderer
        schema={borderEssentialsSchema}
        styles={styles}
        onChange={onChange}
        onBatchChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Color"), {
      target: { value: "#ff0000" },
    });
    expect(onChange).toHaveBeenCalledWith("border-color", "#ff0000");
  });

  it("editing any corner in linked mode writes border-radius shorthand", () => {
    const onBatchChange = vi.fn();
    render(
      <InspectorRenderer
        schema={borderEssentialsSchema}
        styles={styles}
        onChange={vi.fn()}
        onBatchChange={onBatchChange}
      />,
    );
    // Corners4 default is linked.
    fireEvent.change(screen.getByLabelText("TR"), {
      target: { value: "16px" },
    });
    expect(onBatchChange).toHaveBeenLastCalledWith({
      "border-radius": "16px",
    });
  });
});
