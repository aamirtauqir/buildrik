/**
 * ConstraintControl — Fixed / Fill / Hug size constraint mapping.
 * Fixed → keeps/seeds a px value, Fill → 100%, Hug → fit-content. The fixed
 * numeric input only shows in Fixed mode.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ConstraintControl } from "../ConstraintControl";

function renderCtl(value: string, label = "Width") {
  const onChange = vi.fn();
  const utils = render(<ConstraintControl label={label} value={value} onChange={onChange} />);
  return { onChange, ...utils };
}

describe("ConstraintControl — current-type detection", () => {
  it("shows the Fixed value input for a numeric value", () => {
    renderCtl("300px");
    expect(screen.getByPlaceholderText("200px")).toHaveValue("300px");
  });

  it("hides the Fixed input when value is 100% (Fill)", () => {
    renderCtl("100%");
    expect(screen.queryByPlaceholderText("200px")).not.toBeInTheDocument();
  });

  it("hides the Fixed input for hug keywords (auto / fit-content / max-content)", () => {
    const { unmount } = renderCtl("auto");
    expect(screen.queryByPlaceholderText("200px")).not.toBeInTheDocument();
    unmount();
    renderCtl("max-content");
    expect(screen.queryByPlaceholderText("200px")).not.toBeInTheDocument();
  });
});

describe("ConstraintControl — writes", () => {
  it("Fill writes 100%", () => {
    const { onChange } = renderCtl("300px");
    fireEvent.click(screen.getByRole("button", { name: "Fill" }));
    expect(onChange).toHaveBeenCalledWith("100%");
  });

  it("Hug writes fit-content", () => {
    const { onChange } = renderCtl("300px");
    fireEvent.click(screen.getByRole("button", { name: "Hug" }));
    expect(onChange).toHaveBeenCalledWith("fit-content");
  });

  it("Fixed seeds 200px when the current value is a non-fixed keyword", () => {
    const { onChange } = renderCtl("100%");
    fireEvent.click(screen.getByRole("button", { name: "Fixed" }));
    expect(onChange).toHaveBeenCalledWith("200px");
  });

  it("Fixed keeps the current numeric value when already fixed", () => {
    const { onChange } = renderCtl("150px");
    fireEvent.click(screen.getByRole("button", { name: "Fixed" }));
    expect(onChange).toHaveBeenCalledWith("150px");
  });

  it("editing the Fixed input passes the raw value straight through", () => {
    const { onChange } = renderCtl("300px");
    fireEvent.change(screen.getByPlaceholderText("200px"), { target: { value: "250px" } });
    expect(onChange).toHaveBeenCalledWith("250px");
  });

  it("Height label uses an 'auto' placeholder on its Fixed input", () => {
    renderCtl("120px", "Height");
    expect(screen.getByPlaceholderText("auto")).toBeInTheDocument();
  });
});
