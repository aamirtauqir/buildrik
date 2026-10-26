/**
 * SizeSection — "Width mode" / "Height mode" (Fixed · Fill · Hug · Auto) and
 * the value while Fixed (2L9 161:8940), an image's Fit (2L9 36:2), the item controls under a flex / grid parent, and the Page panel's
 * one Max width row (board 21).
 *
 * @license BSD-3-Clause
 */

import { act, fireEvent, render, screen, within } from "@testing-library/react";
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

describe("SizeSection — 2L9 161:8940: '{Axis} mode', then the value while Fixed", () => {
  const mode = (axis: "width" | "height") => within(row(axis)).getByLabelText(axis === "width" ? "Width mode" : "Height mode") as HTMLSelectElement;

  it("unset: Width mode Fill, Height mode Hug · Auto, no number rows", () => {
    renderSize({});
    expect(mode("width").selectedOptions[0].textContent).toBe("Fill");
    expect(mode("height").selectedOptions[0].textContent).toBe("Hug · Auto");
    expect(within(row("width")).queryByLabelText("Width")).toBeNull();
  });

  it("a fixed width reads Width mode Fixed and Width with its value", () => {
    renderSize({ styles: { width: "320px" } });
    expect(mode("width").value).toBe("fixed");
    expect(within(row("width")).getByLabelText("Width")).toHaveValue("320");
  });

  it("the mode select switches Fixed · Fill · Hug", () => {
    const { onChange } = renderSize({ styles: { width: "320px" } });
    fireEvent.change(mode("width"), { target: { value: "fill" } });
    expect(onChange).toHaveBeenCalledWith("width", "100%");
  });

  it("switching to Fixed starts at the measured size", () => {
    const node = document.createElement("div");
    node.setAttribute("data-buildrick-id", "el-1");
    Object.defineProperty(node, "offsetHeight", { value: 48 });
    document.body.appendChild(node);
    const { onChange } = renderSize({ elementId: "el-1" });
    fireEvent.change(mode("height"), { target: { value: "fixed" } });
    expect(onChange).toHaveBeenCalledWith("height", "48px");
  });

  // Regression (QA 2026-10-02): the canvas re-creates the node on the first
  // selection after load — the measurement follows the new node.
  it("follows the canvas node when it is replaced, so Fixed starts at its size", async () => {
    const make = (w: number) => {
      const n = document.createElement("div");
      n.setAttribute("data-buildrick-id", "el-1");
      Object.defineProperty(n, "offsetWidth", { get: () => (n.isConnected ? w : 0) });
      return n;
    };
    const first = make(640);
    document.body.appendChild(first);
    const { onChange } = renderSize({ elementId: "el-1" });
    const second = make(920);
    await act(async () => {
      first.replaceWith(second);
      await new Promise((r) => setTimeout(r, 0));
    });
    fireEvent.change(mode("width"), { target: { value: "fixed" } });
    expect(onChange).toHaveBeenCalledWith("width", "920px");
  });
});

describe("SizeSection — what moved in and out", () => {
  it("no Fit row unless the element is an image", () => {
    renderSize({ styles: { "object-fit": "cover" }, advancedExpanded: true, onAdvancedToggle: vi.fn() });
    expect(screen.queryByRole("radio", { name: "Cover" })).not.toBeInTheDocument();
  });

  it("an image's Fit (2L9 36:2: fit and dimensions are in Style) writes object-fit through the style path", () => {
    const { onChange } = renderSize({ styles: { "object-fit": "cover" }, fit: true });
    expect(screen.getByRole("radio", { name: "Cover" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("radio", { name: "Contain" }));
    expect(onChange).toHaveBeenCalledWith("object-fit", "contain");
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
