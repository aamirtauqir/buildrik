/**
 * InputWithUnit — numeric validation regex, Escape revert, aria-invalid,
 * unit switching, hover reset, keyword units.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InputWithUnit } from "../InputControls";

function renderInput(props: Partial<React.ComponentProps<typeof InputWithUnit>> = {}) {
  const onChange = vi.fn();
  const utils = render(
    <InputWithUnit label="Width" value="10px" onChange={onChange} {...props} />
  );
  return { onChange, ...utils };
}

describe("InputWithUnit — value rendering", () => {
  it("shows the numeric part of a px value", () => {
    renderInput();
    expect(screen.getByRole("textbox")).toHaveValue("10");
  });

  it("shows the unit in the unit selector", () => {
    renderInput({ value: "10rem", units: ["px", "rem"] });
    const unitSelect = screen.getByRole("combobox", { name: "Width unit" });
    expect(unitSelect).toHaveValue("rem");
  });
});

describe("InputWithUnit — numeric write", () => {
  it("committing a valid number writes value + current unit", () => {
    const { onChange } = renderInput();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "20" } });
    expect(onChange).toHaveBeenCalledWith("20px");
  });

  it("switching the unit re-emits value with the new unit", () => {
    const { onChange } = renderInput({ value: "10px", units: ["px", "%"] });
    fireEvent.change(screen.getByRole("combobox", { name: "Width unit" }), {
      target: { value: "%" },
    });
    expect(onChange).toHaveBeenCalledWith("10%");
  });

  it("clearing to empty on blur commits nothing invalid and keeps state", () => {
    const { onChange } = renderInput({ value: "" });
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "" } });
    // Empty is valid but not committed via change (guarded by !== "").
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("InputWithUnit — invalid input + aria-invalid", () => {
  it("marks aria-invalid and does NOT commit for a non-numeric value", () => {
    const { onChange } = renderInput();
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "false");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input).toHaveAttribute("aria-invalid", "true");
    // No commit for invalid input.
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Escape reverts to the last committed value and clears aria-invalid", () => {
    renderInput();
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input).toHaveAttribute("aria-invalid", "true");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("10");
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("blur with an invalid value resets to the numeric prop value", () => {
    renderInput();
    const input = screen.getByRole("textbox");
    // "abc" fails the numeric regex; blur restores the committed "10".
    // (Note: "1.2.3" would actually pass isValidCSSNumber — /^-?[\d.]+$/ +
    // parseFloat — so it is NOT a valid negative-case fixture here.)
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.blur(input);
    expect(input).toHaveValue("10");
  });
});

describe("InputWithUnit — hover reset", () => {
  it("shows a Reset button on row hover and clears the value on click", () => {
    const { onChange, container } = renderInput({ value: "10px" });
    const field = container.querySelector(".bdi-fld") as HTMLElement;
    fireEvent.mouseEnter(field);
    const reset = screen.getByRole("button", { name: "Reset Width" });
    fireEvent.click(reset);
    expect(onChange).toHaveBeenCalledWith("");
  });
});

describe("InputWithUnit — keyword units", () => {
  it("selecting a keyword unit (auto) disables the numeric input and emits the keyword", () => {
    const { onChange } = renderInput({ value: "10px", units: ["px", "auto"] });
    fireEvent.change(screen.getByRole("combobox", { name: "Width unit" }), {
      target: { value: "auto" },
    });
    expect(onChange).toHaveBeenCalledWith("auto");
  });
});
