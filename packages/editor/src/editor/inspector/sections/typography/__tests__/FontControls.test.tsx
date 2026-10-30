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
    expect(labels(container)).toEqual(["Font size", "Weight", "Line height", "Text color"]);
  });

  it("shows the size's number", () => {
    renderFont({ "font-size": "32px" });
    expect(field("Font size")).toHaveValue("32");
  });

  it("the weight reads by name, like the 2L9 board ('Regular', 'Semibold')", () => {
    renderFont({ "font-weight": "600" });
    const select = screen.getByLabelText("Weight") as HTMLSelectElement;
    expect(select.value).toBe("600");
    expect(select.selectedOptions[0].textContent).toBe("Semibold");
  });

  it("no Align in the face — it is under More settings (2L9 161:8940)", () => {
    renderFont({ "text-align": "center" });
    expect(screen.queryByRole("radio", { name: "Center" })).toBeNull();
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

  it("weight and colour write their properties", () => {
    const { onChange } = renderFont();
    fireEvent.change(screen.getByLabelText("Weight"), { target: { value: "300" } });
    expect(onChange).toHaveBeenCalledWith("font-weight", "300");
    fireEvent.change(screen.getByRole("textbox", { name: "Text color value" }), { target: { value: "ff0000" } });
    expect(onChange).toHaveBeenCalledWith("color", "#ff0000");
  });

  it("a size bound to a type style shows the size it resolves to — no chain button here", () => {
    document.documentElement.style.setProperty("--buildrick-design-font-size-2xl", "24px");
    renderFont({ "font-size": "var(--buildrick-design-font-size-2xl)" });
    expect(field("Font size").value).not.toContain("var(");
    expect(screen.queryByRole("button", { name: /type token/ })).toBeNull();
  });
});

describe("FontControls — Page panel (board 21)", () => {
  it("only the text colour, labelled Text color", () => {
    const { container, onChange } = renderFont({}, "page");
    expect(labels(container)).toEqual(["Text color"]);
    fireEvent.change(screen.getByRole("textbox", { name: "Text color value" }), { target: { value: "333333" } });
    expect(onChange).toHaveBeenCalledWith("color", "#333333");
  });
});

describe("FontControls — what the cascade resolves (2L9 S21)", () => {
  const inherited = { "font-size": "32px", "font-weight": "600", "line-height": "38.4px" };

  it("an unset row reads the resolved value '· inherited' — never a guessed default", () => {
    render(<FontControls styles={{ "font-size": "16px" }} onChange={vi.fn()} inherited={inherited} />);
    expect(field("Font size")).toHaveValue("");
    expect(field("Font size")).toHaveAttribute("placeholder", "32 px · inherited");
    expect(field("Line height")).toHaveAttribute("placeholder", "1.2 × · inherited");
    const weight = screen.getByLabelText("Weight") as HTMLSelectElement;
    expect(weight.value).toBe("");
    expect(weight.selectedOptions[0].textContent).toBe("600 · inherited");
  });

  it("no unit dropdown on an inherited row until it has a value of its own", () => {
    render(<FontControls styles={{}} onChange={vi.fn()} inherited={inherited} />);
    expect(screen.queryByLabelText("Font size unit")).toBeNull();
  });

  it("with nothing resolved the rows keep their plain placeholders", () => {
    render(<FontControls styles={{}} onChange={vi.fn()} />);
    expect(field("Line height")).toHaveAttribute("placeholder", "1.5");
    expect((screen.getByLabelText("Weight") as HTMLSelectElement).selectedOptions[0].textContent).toBe("Default");
  });
});
