/**
 * CheckRow — the ONE boolean row of the Inspector (boards 5, 6, 9, 10, 12–15,
 * 19): the box first, the property's name beside it and as its accessible
 * name (X-8, P-11b), read-only / Mixed / override dot from the field context.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CheckRow } from "../CheckRow";
import { InspectorFieldContext, type InspectorFieldContextValue } from "../InspectorFieldContext";

afterEach(cleanup);

const ctx = (over: Partial<InspectorFieldContextValue> = {}): InspectorFieldContextValue => ({
  readOnly: false,
  readOnlyReason: null,
  mixedKeys: new Set(),
  overrides: new Map(),
  overrideLabels: {},
  resetOverride: vi.fn(),
  ...over,
});

describe("CheckRow", () => {
  it("draws the box first and the label beside it; the label names the box and toggles it", () => {
    const onChange = vi.fn();
    render(<CheckRow label="Open in new tab" checked={false} onChange={onChange} />);
    const box = screen.getByRole("checkbox", { name: "Open in new tab" });
    const row = screen.getByTestId("inspector-row-open-in-new-tab");
    expect(row.firstElementChild === box || row.firstElementChild?.contains(box)).toBe(true);
    expect(row.textContent?.trim()).toBe("Open in new tab");
    fireEvent.click(screen.getByText("Open in new tab"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("an explicit testId replaces the derived one", () => {
    render(<CheckRow label="Required" checked onChange={() => {}} testId="form-field-required" />);
    expect(screen.getByTestId("form-field-required")).toBeTruthy();
    expect(screen.queryByTestId("inspector-row-required")).toBeNull();
  });

  it("read-only keeps the value legible and refuses the change", () => {
    const onChange = vi.fn();
    render(
      <InspectorFieldContext.Provider value={ctx({ readOnly: true, readOnlyReason: "locked" })}>
        <CheckRow label="Loop" checked onChange={onChange} />
      </InspectorFieldContext.Provider>
    );
    const box = screen.getByRole("checkbox", { name: "Loop" });
    expect(box).toBeChecked();
    expect(box).toHaveAttribute("aria-readonly", "true");
    fireEvent.click(box);
    expect(onChange).not.toHaveBeenCalled();
    expect(box).toBeChecked();
  });

  it("with a property: Mixed across the selection reads as mixed, an override draws its dot", () => {
    render(
      <InspectorFieldContext.Provider
        value={ctx({
          mixedKeys: new Set(["flex-wrap"]),
          overrides: new Map([["flex-wrap", ["breakpoint"]]]),
          overrideLabels: { breakpoint: "Tablet" },
        })}
      >
        <CheckRow label="Wrap" checked={false} onChange={() => {}} property="flex-wrap" />
      </InspectorFieldContext.Provider>
    );
    const box = screen.getByRole("checkbox", { name: "Wrap" }) as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
    expect(box).toHaveAttribute("aria-checked", "mixed");
    expect(screen.getByRole("button", { name: "Overridden on Tablet" })).toBeTruthy();
  });
});
