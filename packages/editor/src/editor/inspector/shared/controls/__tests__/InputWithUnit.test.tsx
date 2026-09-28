/**
 * InputWithUnit — Inspector v4 number field (board 1, board 34, DD-19):
 * value + stepper + unit dropdown; typed entries read on Enter / blur;
 * an unreadable entry shows board 34's message, keeps the old value, and
 * Esc restores; ↑/↓ step 1, Shift 10; read-only keeps the value legible.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { InputWithUnit, NUMBER_ERROR, parseEntry } from "../InputControls";
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
    expect(line).toHaveTextContent(NUMBER_ERROR);
    expect(NUMBER_ERROR).toBe("Enter a valid number. Choose the unit separately.");
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

  it("inside a section the message lands in the section's polite band, under its rows", () => {
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
    expect(line).toHaveTextContent(NUMBER_ERROR);
    expect(line.id).toBe(input.getAttribute("aria-describedby"));
    expect(line.parentElement).toHaveAttribute("aria-live", "polite");
    /* After the last row, not between Width and Height (board 34). */
    const height = screen.getByRole("textbox", { name: /^Height/ });
    expect(height.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
    const input = screen.getByRole("textbox", { name: "Width mixed values" });
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
});
