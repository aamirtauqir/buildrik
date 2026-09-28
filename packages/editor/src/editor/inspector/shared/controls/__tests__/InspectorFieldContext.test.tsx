/**
 * The field context — read-only and override dots are drawn by the shared
 * controls from one provider (R-DD-14, DD-18), not per section.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InputRow, SelectRow } from "../InputControls";
import { ControlRow } from "../ControlRow";
import { FontPicker } from "../../../sections/typography/FontPicker";
import { InspectorFieldContext, type InspectorFieldContextValue } from "../InspectorFieldContext";

const ctx = (over: Partial<InspectorFieldContextValue> = {}): InspectorFieldContextValue => ({
  readOnly: false,
  readOnlyReason: null,
  mixedKeys: new Set(),
  overrides: new Map(),
  overrideLabels: {},
  resetOverride: vi.fn(),
  ...over,
});

describe("InspectorFieldContext", () => {
  it("read-only keeps values legible: text fields readOnly, selects not changeable", () => {
    render(
      <InspectorFieldContext.Provider value={ctx({ readOnly: true, readOnlyReason: "locked" })}>
        <InputRow label="Name" value="hero" onChange={() => {}} />
        <SelectRow label="Loading" value="lazy" onChange={() => {}} options={[{ value: "lazy", label: "Lazy" }]} />
      </InspectorFieldContext.Provider>
    );
    expect(screen.getByLabelText("Name")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Name")).toHaveValue("hero");
    expect(screen.getByLabelText("Loading")).toBeDisabled();
  });

  it("an overridden property gets an announced dot whose menu resets it", () => {
    const resetOverride = vi.fn();
    render(
      <InspectorFieldContext.Provider
        value={ctx({ overrides: new Map([["width", ["breakpoint"]]]), overrideLabels: { breakpoint: "Tablet" }, resetOverride })}
      >
        <ControlRow label="Width" property="width">
          <span />
        </ControlRow>
        <ControlRow label="Height" property="height">
          <span />
        </ControlRow>
      </InspectorFieldContext.Provider>
    );
    const dots = screen.getAllByRole("button", { name: "Overridden on Tablet" });
    expect(dots).toHaveLength(1);
    fireEvent.click(dots[0]);
    fireEvent.click(screen.getByRole("menuitem", { name: "Reset to Desktop" }));
    expect(resetOverride).toHaveBeenCalledWith("width", "breakpoint");
  });

  it("the Font row (font-family) draws its dot and is not changeable while read-only", () => {
    render(
      <InspectorFieldContext.Provider
        value={ctx({ readOnly: true, readOnlyReason: "locked", overrides: new Map([["font-family", ["pseudo"]]]), overrideLabels: { pseudo: ":hover" } })}
      >
        <FontPicker value="Inter, sans-serif" onChange={() => {}} />
      </InspectorFieldContext.Provider>
    );
    expect(screen.getByRole("button", { name: "Overridden on :hover" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Font family" })).toBeDisabled();
  });
});
