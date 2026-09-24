/**
 * DisplayControls — board 32:2's one-row Display picker: six glyph buttons in
 * the control column, the active one pressed, a Mixed badge on the label.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DisplayControls } from "../DisplayControls";

function renderDisplay(display = "", mixedKeys?: ReadonlySet<string>) {
  const onChange = vi.fn();
  const utils = render(
    <DisplayControls display={display} onChange={onChange} mixedKeys={mixedKeys} />
  );
  return { onChange, ...utils };
}

describe("DisplayControls", () => {
  it("clicking a mode button writes display", () => {
    const { onChange } = renderDisplay();
    fireEvent.click(screen.getByRole("button", { name: "Grid" }));
    expect(onChange).toHaveBeenCalledWith("display", "grid");
  });

  /* The hint box ("See Flexbox section for flex controls") went with the card
     grid — board 32:2 draws one row and the Flexbox section sits right below
     it, saying the same thing by being there. */
  it("marks the active mode pressed and leaves the rest alone", () => {
    renderDisplay("flex");
    expect(screen.getByRole("button", { name: "Flex" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Block" })).toHaveAttribute("aria-pressed", "false");
  });

  /* Board 4428:141170: ▭ ▤ ▦ segments and a ▾ chip for the rest — every
     mode stays reachable. */
  it("draws Block/Flex/Grid as segments and the rest behind the ▾ chip", () => {
    const { onChange } = renderDisplay("block");
    for (const name of ["Block", "Flex", "Grid"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Inline" })).toBeNull();
    const more = screen.getByRole("combobox", { name: "More display modes" });
    const values = Array.from((more as HTMLSelectElement).options).map((o) => o.value);
    expect(values).toEqual(expect.arrayContaining(["inline-block", "inline", "none"]));
    fireEvent.change(more, { target: { value: "none" } });
    expect(onChange).toHaveBeenCalledWith("display", "none");
  });

  it("a mode from the chip shows in the chip, not as a pressed segment", () => {
    renderDisplay("inline");
    expect(screen.getByRole("combobox", { name: "More display modes" })).toHaveValue("inline");
    expect(screen.getByRole("button", { name: "Block" })).toHaveAttribute("aria-pressed", "false");
  });

  it("renders a Mixed badge when display differs across selection", () => {
    renderDisplay("flex", new Set(["display"]));
    expect(screen.getByLabelText("Mixed value")).toBeInTheDocument();
  });
});
