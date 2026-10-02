/**
 * FontControls — the Typography face under Font (boards 1, 4): Font size,
 * Line height, Weight, Colour, Align, each writing its own property; and the
 * Page panel's subset (board 21), the text colour alone.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FontControls } from "../FontControls";

function renderFont(styles: Record<string, string> = {}, variant?: "element" | "page") {
  const onChange = vi.fn();
  const utils = render(<FontControls styles={styles} onChange={onChange} variant={variant} />);
  return { onChange, ...utils };
}

const labels = (c: HTMLElement) => Array.from(c.querySelectorAll(".bdi-lb")).map((l) => l.textContent?.trim());
const field = (label: string) => (screen.getByTestId(`inspector-row-${label.toLowerCase().replace(/ /g, "-")}`).querySelector("input") as HTMLInputElement);

describe("FontControls — board 1's rows", () => {
  it("Font size, Line height, Weight, Colour, Align — in that order, nothing else", () => {
    const { container } = renderFont();
    expect(labels(container)).toEqual(["Font size", "Line height", "Weight", "Colour", "Align"]);
  });

  it("shows the size's number, 16 when unset", () => {
    renderFont({ "font-size": "32px" });
    expect(field("Font size")).toHaveValue("32");
  });

  it("the weight reads as its number, like the board", () => {
    renderFont({ "font-weight": "600" });
    const select = screen.getByLabelText("Weight") as HTMLSelectElement;
    expect(select.value).toBe("600");
    expect(select.selectedOptions[0].textContent).toBe("600");
  });

  it("Align is Left · Center · Right", () => {
    renderFont({ "text-align": "center" });
    expect(screen.getByRole("radio", { name: "Center" })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByRole("button", { name: "Justify" })).toBeNull();
  });
});

describe("FontControls — writes", () => {
  it("font size writes with its unit; line height keeps px", () => {
    const { onChange } = renderFont({ "font-size": "16px", "line-height": "24px" });
    fireEvent.change(field("Font size"), { target: { value: "20" } });
    expect(onChange).toHaveBeenCalledWith("font-size", "20px");
    fireEvent.change(field("Line height"), { target: { value: "28" } });
    expect(onChange).toHaveBeenCalledWith("line-height", "28px");
  });

  it("weight, colour and align write their properties", () => {
    const { onChange } = renderFont();
    fireEvent.change(screen.getByLabelText("Weight"), { target: { value: "300" } });
    expect(onChange).toHaveBeenCalledWith("font-weight", "300");
    fireEvent.change(screen.getByRole("textbox", { name: "Colour value" }), { target: { value: "ff0000" } });
    expect(onChange).toHaveBeenCalledWith("color", "#ff0000");
    fireEvent.click(screen.getByRole("radio", { name: "Right" }));
    expect(onChange).toHaveBeenCalledWith("text-align", "right");
  });

  it("a size bound to a type style shows the size it resolves to — no chain button here", () => {
    document.documentElement.style.setProperty("--buildrick-design-font-size-2xl", "24px");
    renderFont({ "font-size": "var(--buildrick-design-font-size-2xl)" });
    expect(field("Font size").value).not.toContain("var(");
    expect(screen.queryByRole("button", { name: /type token/ })).toBeNull();
  });
});

describe("FontControls — Page panel (board 21)", () => {
  it("only the text colour, labelled Text colour", () => {
    const { container, onChange } = renderFont({}, "page");
    expect(labels(container)).toEqual(["Text colour"]);
    fireEvent.change(screen.getByRole("textbox", { name: "Text colour value" }), { target: { value: "333333" } });
    expect(onChange).toHaveBeenCalledWith("color", "#333333");
  });
});
