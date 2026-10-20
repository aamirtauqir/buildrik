/**
 * @vitest-environment jsdom
 *
 * REA 2026-10-20 #22 (R3 W7): `calc(1rem + 4px)` typed into a spacing side was
 * dropped without a word — nothing written, field cleared on blur — and the
 * side never showed its unit ("2" meant 2rem). A side now takes calc() / var()
 * verbatim, says so when it cannot read an entry, and shows its unit.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { SpacingBox } from "../SpacingControls";
import { parseEntry } from "../InputControls";

const zero = { top: "0px", right: "0px", bottom: "0px", left: "0px" };

function renderBox(padding: typeof zero = zero) {
  const onPaddingChange = vi.fn();
  render(<SpacingBox margin={zero} padding={padding} onMarginChange={() => {}} onPaddingChange={onPaddingChange} />);
  return { onPaddingChange, field: screen.getByRole("textbox", { name: /Padding left/ }) };
}

function type(field: HTMLElement, text: string) {
  for (let i = 1; i <= text.length; i++) fireEvent.change(field, { target: { value: text.slice(0, i) } });
}

describe("parseEntry · expressions", () => {
  const UNITS = ["px", "%", "em", "rem", "vw", "vh", "auto"];

  it("keeps calc() / var() / clamp() verbatim when the field allows expressions", () => {
    expect(parseEntry("calc(1rem + 4px)", UNITS, "px", true)).toBe("calc(1rem + 4px)");
    expect(parseEntry(" var(--Gap-L) ", UNITS, "px", true)).toBe("var(--Gap-L)");
    expect(parseEntry("clamp(1rem, 2vw, 3rem)", UNITS, "px", true)).toBe("clamp(1rem, 2vw, 3rem)");
  });

  it("refuses unbalanced, empty or declaration-breaking expressions", () => {
    expect(parseEntry("calc(1rem + 4px", UNITS, "px", true)).toBeNull();
    expect(parseEntry("calc()", UNITS, "px", true)).toBeNull();
    expect(parseEntry("calc(1px); color: red", UNITS, "px", true)).toBeNull();
    expect(parseEntry("calc(1px))(", UNITS, "px", true)).toBeNull();
  });

  it("does not accept expressions where the field did not ask for them", () => {
    expect(parseEntry("calc(1rem + 4px)", UNITS, "px")).toBeNull();
  });
});

describe("SpacingBox · calc() and var()", () => {
  it("a typed calc() is written as typed", () => {
    const { onPaddingChange, field } = renderBox();
    type(field, "calc(1rem + 4px)");
    expect(onPaddingChange).toHaveBeenLastCalledWith("left", "calc(1rem + 4px)");
    /* Never a half-typed expression on the way there. */
    for (const [, v] of onPaddingChange.mock.calls) expect(v === "calc(1rem + 4px)" || !String(v).startsWith("calc")).toBe(true);
  });

  it("a typed var() is written as typed", () => {
    const { onPaddingChange, field } = renderBox();
    type(field, "var(--gap)");
    expect(onPaddingChange).toHaveBeenLastCalledWith("left", "var(--gap)");
  });

  it("a side holding calc() shows the expression, not a unit", () => {
    renderBox({ ...zero, left: "calc(1rem + 4px)" });
    expect(screen.getByRole("textbox", { name: /Padding left/ })).toHaveValue("calc(1rem + 4px)");
    expect(screen.getByTestId("inspector-spacing-padding-left-unit").textContent).toBe("");
  });
});

describe("SpacingBox · an entry it cannot read", () => {
  it("blur keeps the draft, marks it invalid and names the error — nothing written", () => {
    const { onPaddingChange, field } = renderBox();
    type(field, "calc(1rem +");
    fireEvent.blur(field);
    expect(onPaddingChange).not.toHaveBeenCalledWith("left", expect.stringContaining("calc"));
    expect(field).toHaveValue("calc(1rem +");
    expect(field).toHaveAttribute("aria-invalid", "true");
    const line = document.getElementById(field.getAttribute("aria-describedby") ?? "");
    expect(line?.textContent).toMatch(/calc/);
  });

  it("Enter flags it the same way", () => {
    const { field } = renderBox();
    type(field, "12zz");
    fireEvent.keyDown(field, { key: "Enter" });
    expect(field).toHaveAttribute("aria-invalid", "true");
  });

  it("Escape restores the value and clears the error", () => {
    const { field } = renderBox();
    type(field, "12zz");
    fireEvent.keyDown(field, { key: "Enter" });
    fireEvent.keyDown(field, { key: "Escape" });
    expect(field).toHaveValue("0");
    expect(field).not.toHaveAttribute("aria-invalid", "true");
  });
});

describe("SpacingBox · the unit is visible", () => {
  it("each side shows its own unit next to the number", () => {
    renderBox({ top: "2rem", right: "10%", bottom: "12px", left: "auto" });
    expect(screen.getByTestId("inspector-spacing-padding-top-unit").textContent).toBe("rem");
    expect(screen.getByTestId("inspector-spacing-padding-right-unit").textContent).toBe("%");
    expect(screen.getByTestId("inspector-spacing-padding-bottom-unit").textContent).toBe("px");
    /* auto is a value mode, never 0 with a suffix. */
    expect(screen.getByTestId("inspector-spacing-padding-left-unit").textContent).toBe("");
  });
});
