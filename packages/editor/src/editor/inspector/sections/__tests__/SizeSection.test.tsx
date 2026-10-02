/**
 * SizeSection — Width / Height as Fixed · Fill · Hug with readouts (board 1:
 * "Width · Fill [640 px]", "Height [Hug · Auto]"), no object-fit (→ Image
 * block), the item controls under a flex / grid parent, and the Page panel's
 * one Max width row (board 21).
 *
 * @license BSD-3-Clause
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SizeSection, constraintTypeOf, valueForConstraint } from "../SizeSection";

function renderSize(props: Partial<React.ComponentProps<typeof SizeSection>> = {}) {
  const onChange = vi.fn();
  render(<SizeSection styles={{}} onChange={onChange} isOpen {...props} />);
  return { onChange };
}

const row = (axis: "width" | "height") => screen.getByTestId(`inspector-size-${axis}`);

afterEach(() => {
  document.body.querySelectorAll("[data-buildrick-id]").forEach((n) => n.remove());
});

describe("constraint helpers", () => {
  it("reads and writes the three modes", () => {
    expect(constraintTypeOf("100%")).toBe("fill");
    expect(constraintTypeOf("fit-content")).toBe("hug");
    expect(constraintTypeOf("auto")).toBe("hug");
    expect(constraintTypeOf("320px")).toBe("fixed");
    expect(valueForConstraint("fill", "320px")).toBe("100%");
    expect(valueForConstraint("hug", "320px")).toBe("fit-content");
    expect(valueForConstraint("fixed", "320px")).toBe("320px");
    expect(valueForConstraint("fixed", "100%")).toBe("200px");
  });
});

describe("SizeSection — board 1's readouts", () => {
  it("unset: Width · Fill with the measured px, Height reads Hug · Auto", () => {
    const node = document.createElement("div");
    node.setAttribute("data-buildrick-id", "el-1");
    Object.defineProperty(node, "offsetWidth", { value: 640 });
    Object.defineProperty(node, "offsetHeight", { value: 40 });
    document.body.appendChild(node);
    renderSize({ elementId: "el-1" });
    expect(within(row("width")).getByRole("button", { name: "Width sizing: Fill" })).toHaveTextContent("Width · Fill");
    expect(within(row("width")).getByLabelText("Width")).toHaveValue("640");
    expect(within(row("height")).getByRole("button", { name: "Height sizing: Hug" })).toHaveTextContent(/^Height$/);
    expect(within(row("height")).getByLabelText("Height sizing", { selector: "select" })).toHaveDisplayValue("Hug · Auto");
  });

  it("Fill's number is a readout: leaving it untouched writes nothing, typing makes it Fixed", () => {
    const node = document.createElement("div");
    node.setAttribute("data-buildrick-id", "el-1");
    Object.defineProperty(node, "offsetWidth", { value: 640 });
    document.body.appendChild(node);
    const { onChange } = renderSize({ elementId: "el-1", styles: { width: "100%" } });
    const input = within(row("width")).getByLabelText("Width");
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "480" } });
    expect(onChange).toHaveBeenCalledWith("width", "480px");
  });

  it("a fixed width reads Width · Fixed with its value", () => {
    renderSize({ styles: { width: "320px" } });
    expect(within(row("width")).getByRole("button", { name: "Width sizing: Fixed" })).toBeInTheDocument();
    expect(within(row("width")).getByLabelText("Width")).toHaveValue("320");
  });

  it("the mode menu switches Fixed · Fill · Hug", () => {
    const { onChange } = renderSize({ styles: { width: "320px" } });
    fireEvent.click(within(row("width")).getByRole("button", { name: "Width sizing: Fixed" }));
    fireEvent.click(screen.getByTestId("inspector-size-width-mode-fill"));
    expect(onChange).toHaveBeenCalledWith("width", "100%");
  });

  it("the Hug select switches the height to Fixed at the measured size", () => {
    const node = document.createElement("div");
    node.setAttribute("data-buildrick-id", "el-1");
    Object.defineProperty(node, "offsetHeight", { value: 48 });
    document.body.appendChild(node);
    const { onChange } = renderSize({ elementId: "el-1" });
    fireEvent.change(within(row("height")).getByLabelText("Height sizing", { selector: "select" }), { target: { value: "fixed" } });
    expect(onChange).toHaveBeenCalledWith("height", "48px");
  });
});

describe("SizeSection — what moved in and out", () => {
  it("has no object-fit (the Image block owns it)", () => {
    renderSize({ styles: { "object-fit": "cover" }, advancedExpanded: true, onAdvancedToggle: vi.fn() });
    expect(screen.queryByLabelText(/object fit/i)).not.toBeInTheDocument();
  });

  it("min / max wait behind More settings", () => {
    const { onChange } = renderSize({ advancedExpanded: true, onAdvancedToggle: vi.fn() });
    fireEvent.change(screen.getByLabelText("Max width"), { target: { value: "960" } });
    expect(onChange).toHaveBeenCalledWith("max-width", "960px");
  });

  // Regression: an Image with no max-height showed "Max height [0] px" — a
  // grey placeholder the eye reads as a 0px cap (QA 2026-10-02, board 8).
  it("unset min / max read empty, not a value-shaped 0", () => {
    renderSize({ styles: { "max-width": "100%" }, advancedExpanded: true, onAdvancedToggle: vi.fn() });
    for (const label of ["Min width", "Min height", "Max height"]) {
      const input = screen.getByLabelText(label) as HTMLInputElement;
      expect(input).toHaveValue("");
      expect(input.placeholder).toBe("");
    }
    expect(screen.getByLabelText("Max width")).toHaveValue("100");
  });

  it("under a flex parent it carries Grow and Align self", () => {
    renderSize({ parentLayout: "flex" });
    expect(screen.getByLabelText("Grow")).toBeInTheDocument();
    expect(screen.getByLabelText("Align self")).toBeInTheDocument();
  });

  it("with no flex / grid parent, no item controls", () => {
    renderSize();
    expect(screen.queryByLabelText("Grow")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Column span")).not.toBeInTheDocument();
  });

  it("hidden width / height rows stay hidden", () => {
    renderSize({ propertyStates: { width: { hidden: true }, height: { hidden: true } } });
    expect(screen.queryByTestId("inspector-size-width")).not.toBeInTheDocument();
    expect(screen.queryByTestId("inspector-size-height")).not.toBeInTheDocument();
  });
});

describe("SizeSection — Page panel (board 21)", () => {
  it("is the one Max width row", () => {
    const { onChange } = renderSize({ variant: "page", styles: { "max-width": "1200px" } });
    expect(screen.queryByTestId("inspector-size-width")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Max width")).toHaveValue("1200");
    fireEvent.change(screen.getByLabelText("Max width"), { target: { value: "1280" } });
    expect(onChange).toHaveBeenCalledWith("max-width", "1280px");
  });
});
