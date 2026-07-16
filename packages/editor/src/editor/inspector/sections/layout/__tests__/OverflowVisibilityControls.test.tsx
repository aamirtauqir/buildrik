/**
 * OverflowControls + VisibilityFloatControls — overflow buttons, overflow-x/y
 * selects, box-sizing toggle, and the visibility / float / clear rows.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OverflowControls, VisibilityFloatControls } from "../OverflowVisibilityControls";

function renderOverflow(styles: Record<string, string> = {}) {
  const onChange = vi.fn();
  const utils = render(<OverflowControls styles={styles} onChange={onChange} />);
  return { onChange, ...utils };
}

function renderVisFloat(styles: Record<string, string> = {}) {
  const onChange = vi.fn();
  const utils = render(<VisibilityFloatControls styles={styles} onChange={onChange} />);
  return { onChange, ...utils };
}

describe("OverflowControls", () => {
  it("clicking an overflow preset writes overflow", () => {
    const { onChange } = renderOverflow();
    fireEvent.click(screen.getByRole("button", { name: "Clip overflow content" }));
    expect(onChange).toHaveBeenCalledWith("overflow", "hidden");
  });

  it("marks the active overflow preset aria-pressed", () => {
    renderOverflow({ overflow: "scroll" });
    expect(screen.getByRole("button", { name: "Always show scrollbars" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("overflow-x select writes overflow-x", () => {
    const { onChange, container } = renderOverflow();
    const xSelect = container.querySelectorAll("select")[0] as HTMLSelectElement;
    fireEvent.change(xSelect, { target: { value: "scroll" } });
    expect(onChange).toHaveBeenCalledWith("overflow-x", "scroll");
  });

  it("overflow-y select writes overflow-y", () => {
    const { onChange, container } = renderOverflow();
    const ySelect = container.querySelectorAll("select")[1] as HTMLSelectElement;
    fireEvent.change(ySelect, { target: { value: "auto" } });
    expect(onChange).toHaveBeenCalledWith("overflow-y", "auto");
  });

  it("box-sizing defaults to content-box active and switches to border-box", () => {
    const { onChange } = renderOverflow();
    expect(
      screen.getByRole("button", { name: /content-box/ })
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /border-box/ }));
    expect(onChange).toHaveBeenCalledWith("box-sizing", "border-box");
  });
});

describe("VisibilityFloatControls", () => {
  it("visibility buttons write the full keyword despite the 3-char label", () => {
    const { onChange } = renderVisFloat();
    fireEvent.click(screen.getByRole("button", { name: "col" }));
    expect(onChange).toHaveBeenCalledWith("visibility", "collapse");
  });

  it("float button (scoped to the Float row) writes float", () => {
    const { onChange } = renderVisFloat();
    const floatRow = screen.getByText("Float").parentElement as HTMLElement;
    fireEvent.click(within(floatRow).getByRole("button", { name: "right" }));
    expect(onChange).toHaveBeenCalledWith("float", "right");
  });

  it("clear button (scoped to the Clear row) writes clear", () => {
    const { onChange } = renderVisFloat();
    const clearRow = screen.getByText("Clear").parentElement as HTMLElement;
    fireEvent.click(within(clearRow).getByRole("button", { name: "both" }));
    expect(onChange).toHaveBeenCalledWith("clear", "both");
  });
});
