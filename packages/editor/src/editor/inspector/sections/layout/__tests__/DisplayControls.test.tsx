import { TooltipProvider } from "@/editor/shared/vibcoder";
/**
 * DisplayControls — display-mode buttons + the Flex/Grid hint box + Mixed badge.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DisplayControls } from "../DisplayControls";

function renderDisplay(display = "", mixedKeys?: ReadonlySet<string>) {
  const onChange = vi.fn();
  const utils = render(
    <TooltipProvider>
      <DisplayControls display={display} onChange={onChange} mixedKeys={mixedKeys} />
    </TooltipProvider>
  );
  return { onChange, ...utils };
}

describe("DisplayControls", () => {
  it("clicking a mode button writes display", () => {
    const { onChange } = renderDisplay();
    fireEvent.click(screen.getByRole("button", { name: "Grid" }));
    expect(onChange).toHaveBeenCalledWith("display", "grid");
  });

  it("shows the flex hint when display is flex", () => {
    renderDisplay("flex");
    expect(screen.getByText("See Flexbox section for flex controls")).toBeInTheDocument();
  });

  it("shows the grid hint when display is grid", () => {
    renderDisplay("grid");
    expect(screen.getByText("See Grid controls below")).toBeInTheDocument();
  });

  it("treats inline-flex as flex for the hint", () => {
    renderDisplay("inline-flex");
    expect(screen.getByText("See Flexbox section for flex controls")).toBeInTheDocument();
  });

  it("shows no hint box for a block element", () => {
    renderDisplay("block");
    expect(screen.queryByText(/See Flexbox/)).not.toBeInTheDocument();
    expect(screen.queryByText(/See Grid/)).not.toBeInTheDocument();
  });

  it("renders a Mixed badge when display differs across selection", () => {
    renderDisplay("flex", new Set(["display"]));
    expect(screen.getByLabelText("Mixed value")).toBeInTheDocument();
  });
});
