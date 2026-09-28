/**
 * SpacingSection — the SpacingBox only (DD-9b): margin outside, padding
 * inside, Link sides; no pairs, no gap rows. Each side carries its CSS
 * property, so an override lights a dot on that side (board 26).
 *
 * @license BSD-3-Clause
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InspectorFieldContext, type InspectorFieldContextValue } from "../../shared/controls/InspectorFieldContext";
import { SpacingSection } from "../SpacingSection";

function renderSpacing(styles: Record<string, string> = {}, field?: Partial<InspectorFieldContextValue>) {
  const onChange = vi.fn();
  const onBatchChange = vi.fn();
  const ui = <SpacingSection styles={styles} onChange={onChange} onBatchChange={onBatchChange} isOpen />;
  render(
    field ? (
      <InspectorFieldContext.Provider
        value={{ readOnly: false, readOnlyReason: null, mixedKeys: new Set(), overrides: new Map(), overrideLabels: {}, resetOverride: vi.fn(), ...field }}
      >
        {ui}
      </InspectorFieldContext.Provider>
    ) : (
      ui
    ),
  );
  return { onChange, onBatchChange };
}

describe("SpacingSection — the box", () => {
  it("reads longhands and the shorthand into the eight sides", () => {
    renderSpacing({ padding: "24px 16px", "margin-top": "8px" });
    expect(screen.getByLabelText("Padding top")).toHaveValue("24");
    expect(screen.getByLabelText("Padding left")).toHaveValue("16");
    expect(screen.getByLabelText("Margin top")).toHaveValue("8");
    expect(screen.getByLabelText("Margin bottom")).toHaveValue("");
  });

  it("a side writes its own longhand", () => {
    const { onChange } = renderSpacing();
    fireEvent.change(screen.getByLabelText("Padding right"), { target: { value: "12" } });
    expect(onChange).toHaveBeenCalledWith("padding-right", "12px");
    fireEvent.change(screen.getByLabelText("Margin bottom"), { target: { value: "auto" } });
    expect(onChange).toHaveBeenCalledWith("margin-bottom", "auto");
  });

  it("Link sides writes all four sides of that box in one change", () => {
    const { onChange, onBatchChange } = renderSpacing();
    fireEvent.click(screen.getByRole("button", { name: "Link sides" }));
    expect(screen.getByRole("button", { name: "Link sides" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.change(screen.getByLabelText("Padding top"), { target: { value: "20" } });
    expect(onBatchChange).toHaveBeenCalledWith({ "padding-top": "20px", "padding-right": "20px", "padding-bottom": "20px", "padding-left": "20px" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("no padding / margin pairs and no gap rows (DD-9, DD-9b)", () => {
    renderSpacing();
    expect(screen.queryByRole("group", { name: "Padding" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Gap")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Row gap")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /more settings/i })).not.toBeInTheDocument();
  });
});

describe("SpacingSection — field context", () => {
  it("an overridden side draws its dot (board 26, padding overrides master)", () => {
    renderSpacing({ "padding-top": "32px" }, { overrides: new Map([["padding-top", ["master"]]]) });
    expect(screen.getByRole("button", { name: "Overrides master" })).toBeInTheDocument();
    expect(screen.getAllByTestId("inspector-override-dot-master")).toHaveLength(1);
  });

  it("read-only keeps the values legible and refuses edits", () => {
    renderSpacing({ "padding-top": "32px" }, { readOnly: true, readOnlyReason: "locked" });
    const input = screen.getByLabelText("Padding top");
    expect(input).toHaveValue("32");
    expect(input).toHaveAttribute("readonly");
  });

  it("a mixed side says so instead of showing one element's value", () => {
    renderSpacing({ "padding-top": "32px" }, { mixedKeys: new Set(["padding-top"]) });
    expect(screen.getByRole("textbox", { name: "Padding top Mixed values" })).toHaveAttribute("placeholder", "Mixed");
  });
});
