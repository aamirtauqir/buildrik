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

  it("keeps every mode reachable in one row", () => {
    renderDisplay("block");
    for (const name of ["Block", "Flex", "Grid", "I-Block", "Inline", "None"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("renders a Mixed badge when display differs across selection", () => {
    renderDisplay("flex", new Set(["display"]));
    expect(screen.getByLabelText("Mixed value")).toBeInTheDocument();
  });
});
