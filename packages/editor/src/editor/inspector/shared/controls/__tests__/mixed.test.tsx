/**
 * "Mixed" across a multi-selection (DD-12, board 22) is drawn by the shared
 * controls from the field context: an empty value, a muted "Mixed"
 * placeholder, and "Mixed values" in the accessible name — never a
 * value-shaped reading of the primary element.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import {
  ButtonGroup,
  ColorInput,
  CornerRadiusInput,
  InputRow,
  InputWithUnit,
  MixedValueIndicator,
  RangeSlider,
  SelectRow,
  SliderInput,
  TextInputRow,
} from "..";
import { InspectorFieldContext, type InspectorFieldContextValue } from "../InspectorFieldContext";
import { FontPicker } from "../../../sections/typography/FontPicker";

const ctx = (mixed: string[]): InspectorFieldContextValue => ({
  readOnly: false,
  readOnlyReason: null,
  mixedKeys: new Set(mixed),
  overrides: new Map(),
  overrideLabels: {},
  resetOverride: () => undefined,
});

const inMixed = (mixed: string[], ui: React.ReactNode) =>
  render(<InspectorFieldContext.Provider value={ctx(mixed)}>{ui}</InspectorFieldContext.Provider>);

describe("Mixed — shared controls", () => {
  it("number: empty, 'Mixed' placeholder, 'Mixed values' in the name", () => {
    inMixed(["font-size"], <InputWithUnit label="Font size" value="24px" onChange={vi.fn()} property="font-size" />);
    const input = screen.getByRole("textbox", { name: /Font size.*Mixed values/ });
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Mixed");
  });

  it("select: reads Mixed, 'Mixed values' in the name", () => {
    inMixed(["font-weight"], <SelectRow label="Weight" value="600" onChange={vi.fn()} options={[{ value: "600", label: "600" }]} property="font-weight" />);
    const select = screen.getByRole("combobox", { name: "Weight, Mixed values" });
    expect((select as HTMLSelectElement).value).toBe("");
    expect(select.querySelector("option")?.textContent).toBe("Mixed");
  });

  it("colour: empty field with the 'Mixed' placeholder, 'Mixed values' in the name", () => {
    inMixed(["color"], <ColorInput label="Colour" value="#111111" onChange={vi.fn()} property="color" />);
    const field = screen.getByRole("textbox", { name: "Colour value, Mixed values" });
    expect(field).toHaveValue("");
    expect(field).toHaveAttribute("placeholder", "Mixed");
  });

  it("font: shows 'Mixed' muted, never the primary's family; 'Mixed values' in the name", () => {
    inMixed(["font-family"], <FontPicker value="'Inter', sans-serif" onChange={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: "Font family, Mixed values" });
    expect(trigger.textContent).toBe("Mixed");
    expect(trigger.textContent).not.toContain("Inter");
  });

  it("text row: empty, 'Mixed' placeholder, 'Mixed values' in the name", () => {
    inMixed(["background-image"], <InputRow label="Image" value="url(a.png)" onChange={vi.fn()} property="background-image" />);
    const input = screen.getByRole("textbox", { name: "Image, Mixed values" });
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Mixed");
  });

  it("text input row: empty, 'Mixed' placeholder", () => {
    inMixed(["transform"], <TextInputRow label="Move X" value="4px" onChange={vi.fn()} property="transform" />);
    const input = screen.getByRole("textbox", { name: "Move X, Mixed values" });
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Mixed");
  });

  it("segmented: nothing chosen, 'Mixed values' in the group's name", () => {
    inMixed(
      ["text-align"],
      <ButtonGroup label="Align" value="left" onChange={vi.fn()} options={[{ value: "left", label: "Left" }, { value: "center", label: "Center" }]} property="text-align" />,
    );
    const group = screen.getByRole("radiogroup", { name: "Align, Mixed values" });
    expect(group.querySelectorAll('[aria-checked="true"]')).toHaveLength(0);
  });

  it("sliders: the readout reads Mixed, 'Mixed values' in the name", () => {
    inMixed(
      ["opacity", "filter"],
      <>
        <SliderInput label="Opacity" value={50} onChange={vi.fn()} property="opacity" />
        <RangeSlider label="Blur" value={2} onChange={vi.fn()} property="filter" />
      </>,
    );
    expect(screen.getByRole("slider", { name: "Opacity, Mixed values" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Blur, Mixed values" })).toBeInTheDocument();
    expect(screen.getAllByText("Mixed")).toHaveLength(2);
  });

  it("corner radius: a mixed corner is empty with the 'Mixed' placeholder", () => {
    inMixed(
      ["border-top-left-radius"],
      <CornerRadiusInput values={{ tl: "4px", tr: "4px", br: "4px", bl: "4px" }} onChange={vi.fn()} />,
    );
    const tl = screen.getByRole("textbox", { name: "tl corner, Mixed values" });
    expect(tl).toHaveValue("");
    expect(tl).toHaveAttribute("placeholder", "Mixed");
    expect(screen.getByRole("textbox", { name: "tr corner" })).toHaveValue("4");
  });

  it("MixedValueIndicator reads the field context — no prop threading, muted 'Mixed'", () => {
    inMixed(["overflow"], <MixedValueIndicator property="overflow" />);
    expect(screen.getByText("Mixed")).toBeInTheDocument();
  });

  it("MixedValueIndicator is absent when the selection agrees", () => {
    inMixed([], <MixedValueIndicator property="overflow" />);
    expect(screen.queryByText("Mixed")).toBeNull();
  });

  it("a mixed number is not written back when left untouched", () => {
    const onChange = vi.fn();
    inMixed(["font-size"], <InputWithUnit label="Font size" value="24px" onChange={onChange} property="font-size" />);
    const input = screen.getByRole("textbox", { name: /Font size/ });
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });
});
