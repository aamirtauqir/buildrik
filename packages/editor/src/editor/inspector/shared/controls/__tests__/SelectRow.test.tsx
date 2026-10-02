/**
 * SelectRow — the Inspector's select row (board 1: "Text style Heading / H3 ▾").
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { SelectRow } from "../InputControls";
import { InspectorFieldContext, type InspectorFieldContextValue } from "../InspectorFieldContext";

const OPTIONS = [
  { value: "block", label: "Block" },
  { value: "flex", label: "Flex" },
];

const ctx = (over: Partial<InspectorFieldContextValue>): InspectorFieldContextValue => ({
  readOnly: false,
  readOnlyReason: null,
  mixedKeys: new Set(),
  overrides: new Map(),
  overrideLabels: {},
  resetOverride: () => undefined,
  ...over,
});

describe("SelectRow", () => {
  it("is named by its label and offers a blank Default first", () => {
    render(<SelectRow label="Display" value="block" onChange={vi.fn()} options={OPTIONS} />);
    const select = screen.getByRole("combobox", { name: "Display" });
    expect([...select.querySelectorAll("option")].map((o) => o.textContent)).toEqual(["Default", "Block", "Flex"]);
  });

  it("placeholder={null}: only the real choices, no blank option", () => {
    render(<SelectRow label="When done" value="flex" onChange={vi.fn()} options={OPTIONS} placeholder={null} />);
    const select = screen.getByRole("combobox", { name: "When done" });
    expect([...select.querySelectorAll("option")].map((o) => o.textContent)).toEqual(["Block", "Flex"]);
  });

  it("read-only (DD-18): legible and not disabled; a change is refused", () => {
    const onChange = vi.fn();
    render(
      <InspectorFieldContext.Provider value={ctx({ readOnly: true, readOnlyReason: "locked" })}>
        <SelectRow label="Display" value="block" onChange={onChange} options={OPTIONS} property="display" />
      </InspectorFieldContext.Provider>,
    );
    const select = screen.getByRole("combobox");
    expect(select).not.toBeDisabled();
    expect(select).toHaveAttribute("aria-readonly", "true");
    fireEvent.change(select, { target: { value: "flex" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("mixed: reads Mixed, named as mixed", () => {
    render(
      <InspectorFieldContext.Provider value={ctx({ mixedKeys: new Set(["display"]) })}>
        <SelectRow label="Display" value="block" onChange={vi.fn()} options={OPTIONS} property="display" />
      </InspectorFieldContext.Provider>,
    );
    const select = screen.getByRole("combobox", { name: "Display, Mixed values" });
    expect(select).toHaveValue("");
    expect(select.querySelector("option")?.textContent).toBe("Mixed");
  });
});

/* QA 2026-10-02, board 13: an Accordion item row "3 · Can I export my
   designs?" was cut mid-word under its select with no ellipsis — the text sat
   straight in the flex label, where text-overflow does nothing. It now sits
   in its own truncating span, and the full label is the hover title. */
describe("SelectRow — a long label", () => {
  it("ellipsises in its own span and carries the full label as its title", () => {
    const long = "3 · Can I export my designs?";
    render(<SelectRow label={long} value="block" onChange={vi.fn()} options={OPTIONS} placeholder={null} />);
    const text = screen.getByText(long);
    expect(text.tagName).toBe("SPAN");
    expect(text.className).toMatch(/tw:truncate/);
    expect(text).toHaveAttribute("title", long);
    expect(screen.getByRole("combobox", { name: long })).toBeInTheDocument();
  });
});
