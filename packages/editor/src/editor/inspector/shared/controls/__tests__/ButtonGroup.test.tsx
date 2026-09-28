/**
 * ButtonGroup — the segmented control is a radio group (§16): one tab stop,
 * the arrows move the choice, read-only refuses it (DD-18).
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { ButtonGroup } from "../ButtonControls";
import { InspectorFieldContext, type InspectorFieldContextValue } from "../InspectorFieldContext";

const OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

function Harness({ onChange }: { onChange: (v: string) => void }) {
  const [value, setValue] = React.useState("center");
  return (
    <ButtonGroup
      label="Align"
      value={value}
      options={OPTIONS}
      onChange={(v) => {
        setValue(v);
        onChange(v);
      }}
    />
  );
}

describe("ButtonGroup — radiogroup", () => {
  it("is a named radio group; the chosen option is checked and the one tab stop", () => {
    render(<Harness onChange={vi.fn()} />);
    const group = screen.getByRole("radiogroup", { name: "Align" });
    const radios = screen.getAllByRole("radio");
    expect(group).toContainElement(radios[0]);
    expect(radios.map((r) => r.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);
    expect(radios.map((r) => r.tabIndex)).toEqual([-1, 0, -1]);
  });

  it("→ / ← move the choice and focus, wrapping; Home / End jump", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const center = screen.getByRole("radio", { name: "Center" });
    center.focus();
    fireEvent.keyDown(center, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("right");
    expect(screen.getByRole("radio", { name: "Right" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("left");
    fireEvent.keyDown(document.activeElement!, { key: "End" });
    expect(onChange).toHaveBeenLastCalledWith("right");
    fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenLastCalledWith("center");
  });

  it("with more than four options the row gives the track the room (board 1 Level)", () => {
    render(
      <ButtonGroup
        label="Level"
        value="h3"
        onChange={vi.fn()}
        options={["h1", "h2", "h3", "h4", "h5", "h6"].map((v) => ({ value: v, label: v.toUpperCase() }))}
      />,
    );
    expect(screen.getByTestId("inspector-row-level")).toHaveClass("seg", "wide");
  });

  it("read-only: the choice shows, clicks and arrows are refused, nothing is disabled", () => {
    const onChange = vi.fn();
    const ctx: InspectorFieldContextValue = {
      readOnly: true,
      readOnlyReason: "locked",
      mixedKeys: new Set(),
      overrides: new Map(),
      overrideLabels: {},
      resetOverride: () => undefined,
    };
    render(
      <InspectorFieldContext.Provider value={ctx}>
        <ButtonGroup label="Align" value="center" options={OPTIONS} onChange={onChange} />
      </InspectorFieldContext.Provider>,
    );
    const right = screen.getByRole("radio", { name: "Right" });
    expect(right).not.toBeDisabled();
    fireEvent.click(right);
    fireEvent.keyDown(screen.getByRole("radio", { name: "Center" }), { key: "ArrowRight" });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-readonly", "true");
  });
});
