/**
 * Border › corner radius — 2L9 247:24493: one "Radius" row (the shorthand)
 * while the corners agree; Top left · Top right · Bottom right · Bottom
 * left rows (the longhands) once they differ or More settings is open.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BorderSection } from "../BorderSection";

const CORNERS = ["Top left", "Top right", "Bottom right", "Bottom left"];

function renderBorder(styles: Record<string, string>, advancedExpanded = false) {
  const onChange = vi.fn();
  render(<BorderSection styles={styles} onChange={onChange} isOpen advancedExpanded={advancedExpanded} />);
  return { onChange };
}

describe("Border › corner radius", () => {
  it("one Radius row while the corners agree; it writes the shorthand", () => {
    const { onChange } = renderBorder({ "border-radius": "8px" });
    for (const c of CORNERS) expect(screen.queryByLabelText(c)).toBeNull();
    const radius = screen.getByLabelText("Radius");
    expect(radius).toHaveValue("8");
    fireEvent.change(radius, { target: { value: "12" } });
    expect(onChange).toHaveBeenCalledWith("border-radius", "12px");
  });

  it("corners that differ show four rows from the shorthand, each writing its longhand (247:24493)", () => {
    const { onChange } = renderBorder({ "border-radius": "8px 8px 16px 16px" });
    expect(screen.queryByLabelText("Radius")).toBeNull();
    expect(CORNERS.map((c) => (screen.getByLabelText(c) as HTMLInputElement).value)).toEqual(["8", "8", "16", "16"]);
    fireEvent.change(screen.getByLabelText("Bottom right"), { target: { value: "2" } });
    expect(onChange).toHaveBeenCalledWith("border-bottom-right-radius", "2px");
  });

  it("a longhand wins over the shorthand for its corner", () => {
    renderBorder({ "border-radius": "8px", "border-top-left-radius": "12px" });
    expect(screen.getByLabelText("Top left")).toHaveValue("12");
    expect(screen.getByLabelText("Top right")).toHaveValue("8");
  });

  it("More settings opens the four rows even while they agree", () => {
    renderBorder({ "border-radius": "8px" }, true);
    expect(screen.getByLabelText("Bottom left")).toHaveValue("8");
  });
});
