/**
 * InputWithUnit — Inspector v4 number field (board 1, board 34, DD-19):
 * value + stepper + unit dropdown; typed entries read on Enter / blur;
 * an unreadable entry shows board 34's message, keeps the old value, and
 * Esc restores; ↑/↓ step 1, Shift 10; read-only keeps the value legible.
 *
 * @license BSD-3-Clause
 */

import { act, cleanup, render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { InputWithUnit, parseEntry } from "../InputControls";
import { Section } from "../Section";
import { InspectorFieldContext, type InspectorFieldContextValue } from "../InspectorFieldContext";

function renderInput(props: Partial<React.ComponentProps<typeof InputWithUnit>> = {}) {
  const onChange = vi.fn();
  const utils = render(<InputWithUnit label="Width" value="10px" onChange={onChange} {...props} />);
  return { onChange, input: screen.getByRole("textbox"), ...utils };
}

const ctx = (over: Partial<InspectorFieldContextValue>): InspectorFieldContextValue => ({
  readOnly: false,
  readOnlyReason: null,
  mixedKeys: new Set(),
  overrides: new Map(),
  overrideLabels: {},
  resetOverride: () => undefined,
  ...over,
});

describe("InputWithUnit — value rendering", () => {
  it("shows the number and the unit in the unit dropdown", () => {
    renderInput({ value: "10rem", units: ["px", "rem"] });
    expect(screen.getByRole("textbox")).toHaveValue("10");
    expect(screen.getByRole("combobox", { name: "Width unit" })).toHaveValue("rem");
  });

  it("a keyword value reads as the keyword, legibly, not as a disabled field", () => {
    const { input } = renderInput({ value: "auto", units: ["px", "auto"] });
    expect(input).toHaveValue("auto");
    expect(input).not.toBeDisabled();
  });
});

describe("parseEntry — what a typed entry means (DD-19)", () => {
  const units = ["px", "%", "rem", "auto"];
  it.each([
    ["24", "px", "24px"],
    ["24px", "px", "24px"],
    ["2rem", "px", "2rem"],
    ["50%", "px", "50%"],
    [" auto ", "px", "auto"],
    ["1.5", "rem", "1.5rem"],
    ["12", "auto", "12px"],
    ["", "px", ""],
    ["var(--buildrick-design-space-4)", "px", "var(--buildrick-design-space-4)"],
  ])("%s (field unit %s) → %s", (raw, unit, out) => {
    expect(parseEntry(raw, units, unit)).toBe(out);
  });

  it.each(["24..", "abc", "2 3", "12em", "none", "--4"])("%s cannot be read", (raw) => {
    expect(parseEntry(raw, units, "px")).toBeNull();
  });
});

describe("InputWithUnit — writes", () => {
  it("a plain number is written as it is typed, in the field's unit", () => {
    const { onChange, input } = renderInput();
    fireEvent.change(input, { target: { value: "20" } });
    expect(onChange).toHaveBeenCalledWith("20px");
  });

  it("a typed unit is read on Enter", () => {
    const { onChange, input } = renderInput({ units: ["px", "rem"] });
    fireEvent.change(input, { target: { value: "2rem" } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("2rem");
  });

  it("switching the unit re-emits the value with the new unit", () => {
    const { onChange } = renderInput({ value: "10px", units: ["px", "%"] });
    fireEvent.change(screen.getByRole("combobox", { name: "Width unit" }), { target: { value: "%" } });
    expect(onChange).toHaveBeenCalledWith("10%");
  });

  it("a keyword unit writes the keyword", () => {
    const { onChange } = renderInput({ value: "10px", units: ["px", "auto"] });
    fireEvent.change(screen.getByRole("combobox", { name: "Width unit" }), { target: { value: "auto" } });
    expect(onChange).toHaveBeenCalledWith("auto");
  });
});

describe("InputWithUnit — board 34: an entry it cannot read", () => {
  it("Enter: red field, aria-invalid, the message named by aria-describedby; nothing written", () => {
    const { onChange, input } = renderInput();
    fireEvent.change(input, { target: { value: "24.." } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveValue("24..");
    const line = document.getElementById(input.getAttribute("aria-describedby") ?? "");
    /* 2L9 I03: what it takes, then what the element still carries. */
    expect(line).toHaveTextContent("Enter a number and a supported unit. Last applied: 10 px.");
    expect(input.closest(".bdi-fld")).toHaveClass("invalid");
  });

  it("blur flags it the same way and keeps the entry to correct", () => {
    const { input } = renderInput();
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.blur(input);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveValue("abc");
  });

  it("Esc restores the last value and clears the error", () => {
    const { input } = renderInput();
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("10");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByTestId("inspector-field-error")).toBeNull();
  });

  it("inside a section the message sits directly under its own field (2L9 I03), in a polite region", () => {
    render(
      <Section title="Size" defaultOpen>
        <InputWithUnit label="Width" value="10px" onChange={vi.fn()} />
        <InputWithUnit label="Height" value="10px" onChange={vi.fn()} />
      </Section>,
    );
    const input = screen.getByRole("textbox", { name: /^Width/ });
    fireEvent.change(input, { target: { value: "24.." } });
    fireEvent.keyDown(input, { key: "Enter" });
    const line = screen.getByTestId("inspector-field-error");
    expect(line).toHaveTextContent("Enter a number and a supported unit. Last applied: 10 px.");
    expect(line.id).toBe(input.getAttribute("aria-describedby"));
    expect(line.parentElement).toHaveAttribute("aria-live", "polite");
    /* Between Width and Height — under the field it is about, not in a band after the last row. */
    const height = screen.getByRole("textbox", { name: /^Height/ });
    expect(line.compareDocumentPosition(height) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("inspector-row-width")).toContainElement(line);
  });
});

describe("InputWithUnit — ↑ / ↓ and the stepper", () => {
  it("↑ adds 1, Shift+↓ takes 10, and the unit stays", () => {
    const { onChange, input } = renderInput({ value: "24px" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith("25px");
    fireEvent.keyDown(input, { key: "ArrowDown", shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith("15px");
  });

  it("an empty field nudges from 0", () => {
    const { onChange, input } = renderInput({ value: "" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith("1px");
  });

  it("the stepper's halves step by one", () => {
    const { onChange, container } = renderInput({ value: "24px" });
    const [up, down] = Array.from(container.querySelectorAll(".bdi-step > span"));
    fireEvent.click(up);
    expect(onChange).toHaveBeenLastCalledWith("25px");
    fireEvent.click(down);
    expect(onChange).toHaveBeenLastCalledWith("24px");
  });
});

describe("InputWithUnit — emptied field (P-11d)", () => {
  it("empty + Enter clears the property", () => {
    const { onChange, input } = renderInput({ value: "10px" });
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("an already-empty field left empty writes nothing", () => {
    const { onChange, input } = renderInput({ value: "" });
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("InputWithUnit — field context", () => {
  it("read-only (DD-18): the value stays legible, not disabled; typing, stepping and the unit are refused", () => {
    const onChange = vi.fn();
    render(
      <InspectorFieldContext.Provider value={ctx({ readOnly: true, readOnlyReason: "locked" })}>
        <InputWithUnit label="Width" value="10px" onChange={onChange} property="width" />
      </InspectorFieldContext.Provider>,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("10");
    expect(input).not.toBeDisabled();
    expect(input).toHaveAttribute("readonly");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    const unit = screen.getByRole("combobox", { name: "Width unit" });
    expect(unit).not.toBeDisabled();
    fireEvent.change(unit, { target: { value: "%" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("mixed: no value, 'Mixed' placeholder, named as mixed", () => {
    render(
      <InspectorFieldContext.Provider value={ctx({ mixedKeys: new Set(["width"]) })}>
        <InputWithUnit label="Width" value="10px" onChange={vi.fn()} property="width" />
      </InspectorFieldContext.Provider>,
    );
    const input = screen.getByRole("textbox", { name: "Width Mixed values" });
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", "Mixed");
  });

  it("an unlabelled field still draws its override dot", () => {
    render(
      <InspectorFieldContext.Provider value={ctx({ overrides: new Map([["width", ["breakpoint"] as const]]), overrideLabels: { breakpoint: "Tablet" } })}>
        <InputWithUnit label="" ariaLabel="Width" value="10px" onChange={vi.fn()} property="width" />
      </InspectorFieldContext.Provider>,
    );
    expect(screen.getByRole("button", { name: "Overridden on Tablet" })).toBeInTheDocument();
  });

  it("dot={false}: a field whose row already draws the dot does not draw a second (board 28)", () => {
    render(
      <InspectorFieldContext.Provider value={ctx({ overrides: new Map([["width", ["breakpoint"] as const]]), overrideLabels: { breakpoint: "Tablet" } })}>
        <InputWithUnit label="" ariaLabel="Width" value="10px" onChange={vi.fn()} property="width" dot={false} />
      </InspectorFieldContext.Provider>,
    );
    expect(screen.queryByRole("button", { name: "Overridden on Tablet" })).toBeNull();
  });
});

describe("InputWithUnit — 2L9 precision (I03, I08)", () => {
  it("I03: a property CSS keeps non-negative says so, refuses a negative, and keeps the draft", () => {
    const { onChange, input } = renderInput({ label: "Font size", value: "24px", property: "font-size" });
    fireEvent.change(input, { target: { value: "24pxx" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("inspector-field-error")).toHaveTextContent(
      "Enter a non-negative number and a supported unit. Last applied: 24 px.",
    );
    expect(input).toHaveValue("24pxx");
    onChange.mockClear();
    fireEvent.change(input, { target: { value: "-4px" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalledWith("-4px");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("I08: a calc() is shown as authored, labelled a custom value, and not rewritten by a blur", () => {
    const { onChange, input } = renderInput({ value: "calc(100% - 2rem)", property: "width" });
    expect(input).toHaveValue("calc(100% - 2rem)");
    expect(screen.getByText("Width · Custom value")).toBeInTheDocument();
    expect(screen.getByTestId("inspector-field-custom")).toHaveTextContent("Preserved as authored. Enter an explicit supported value to replace it.");
    expect(screen.queryByRole("combobox", { name: /unit/ })).toBeNull();
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "320px" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("320px");
  });
});

describe("InputWithUnit — 2L9 I07 unit conversion", () => {
  it("px → rem keeps the size the canvas shows: 24px becomes 1.5rem", () => {
    const { onChange } = renderInput({ label: "Font size", value: "24px", units: ["px", "rem", "em", "%"] });
    fireEvent.change(screen.getByRole("combobox", { name: "Font size unit" }), { target: { value: "rem" } });
    expect(onChange).toHaveBeenCalledWith("1.5rem");
  });

  it("rem → px converts back; px → % keeps the number (no fixed ratio)", () => {
    const { onChange } = renderInput({ label: "Font size", value: "1.5rem", units: ["px", "rem", "%"] });
    fireEvent.change(screen.getByRole("combobox", { name: "Font size unit" }), { target: { value: "px" } });
    expect(onChange).toHaveBeenCalledWith("24px");
    cleanup();
    const second = renderInput({ value: "10px", units: ["px", "%"] });
    fireEvent.change(screen.getByRole("combobox", { name: "Width unit" }), { target: { value: "%" } });
    expect(second.onChange).toHaveBeenCalledWith("10%");
  });
});

describe("InputWithUnit — a unit change that converts (2L9 I07)", () => {
  it("24px → rem writes 1.5rem as its own step and says how, once", () => {
    const onChange = vi.fn();
    const order: string[] = [];
    const announce = vi.fn((m: string) => order.push(`announce:${m}`));
    render(
      <InspectorFieldContext.Provider
        value={ctx({ runDiscrete: (a) => { order.push("discrete"); a(); }, announce })}
      >
        <InputWithUnit label="Font size" value="24px" onChange={onChange} units={["px", "rem", "em"]} />
      </InspectorFieldContext.Provider>,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Font size unit" }), { target: { value: "rem" } });
    expect(onChange).toHaveBeenCalledWith("1.5rem");
    expect(order).toEqual(["discrete", "announce:Converted using root font 16px"]);
  });

  it("a unit with no conversion (% from %) says nothing", () => {
    const announce = vi.fn();
    render(
      <InspectorFieldContext.Provider value={ctx({ announce })}>
        <InputWithUnit label="Width" value="50%" onChange={vi.fn()} units={["%", "vw"]} />
      </InspectorFieldContext.Provider>,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Width unit" }), { target: { value: "vw" } });
    expect(announce).not.toHaveBeenCalled();
  });
});

describe("InputWithUnit — an unreadable entry is held for the tab guard (2L9 I05)", () => {
  it("registers while invalid with label, draft and applied value; revert restores; clears once fixed", async () => {
    const { getUnappliedDraft } = await import("../unappliedDraft");
    render(<InputWithUnit label="Font size" value="24px" onChange={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: /^Font size/ });
    fireEvent.change(input, { target: { value: "24pxx" } });
    fireEvent.keyDown(input, { key: "Enter" });
    const held = getUnappliedDraft();
    expect(held).toMatchObject({ label: "Font size", draft: "24pxx", applied: "24px" });
    act(() => held!.revert());
    expect(input).toHaveValue("24");
    expect(getUnappliedDraft()).toBeNull();
  });
});
