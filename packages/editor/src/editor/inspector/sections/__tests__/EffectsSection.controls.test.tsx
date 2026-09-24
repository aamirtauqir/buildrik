/**
 * Effects tab (board 4428:142686): OPACITY (slider + number), SHADOW (one
 * select), BLUR, then the advanced "More effects" section — inner shadow,
 * custom shadow, transform, transition, cursor, filters, blend. Compose
 * helpers are covered by EffectsSection.compose.test.ts.
 *
 * @license BSD-3-Clause
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EffectsSection } from "../EffectsSection";
import { BlurSection, OpacitySection, ShadowSection } from "../EffectsBasicSections";

type Part = typeof EffectsSection;
function renderPart(Component: Part, styles: Record<string, string> = {}, isOpen = true) {
  const onChange = vi.fn();
  const utils = render(<Component styles={styles} onChange={onChange} isOpen={isOpen} />);
  return { onChange, ...utils };
}
const renderEffects = (styles: Record<string, string> = {}, isOpen = true) =>
  renderPart(EffectsSection, styles, isOpen);

describe("OpacitySection", () => {
  it("renders 100 when opacity unset and writes a fraction from the slider", () => {
    const { onChange } = renderPart(OpacitySection);
    const slider = screen.getByRole("slider", { name: "Opacity" });
    expect(slider).toHaveValue("100");
    fireEvent.change(slider, { target: { value: "50" } });
    expect(onChange).toHaveBeenCalledWith("opacity", "0.5");
  });

  it("carries a number field beside the slider (board draws [100])", () => {
    const { onChange } = renderPart(OpacitySection, { opacity: "0.25" });
    const field = screen.getByRole("spinbutton", { name: "Opacity value" });
    expect(field).toHaveValue(25);
    fireEvent.change(field, { target: { value: "80" } });
    expect(onChange).toHaveBeenCalledWith("opacity", "0.8");
  });

  it("titles the section OPACITY", () => {
    renderPart(OpacitySection);
    expect(document.getElementById("inspector-section-opacity")).not.toBeNull();
  });
});

describe("ShadowSection", () => {
  const select = () => screen.getByRole("combobox", { name: "Shadow" }) as HTMLSelectElement;

  it("is one select whose options read name · offsets (board: Soft · 0 4 12 px)", () => {
    renderPart(ShadowSection);
    const labels = Array.from(select().options).map((o) => o.textContent);
    expect(labels).toContain("None");
    expect(labels).toContain("Soft · 0 4 12 px");
  });

  it("writes the chosen preset's box-shadow", () => {
    const { onChange } = renderPart(ShadowSection);
    const soft = Array.from(select().options).find((o) => o.textContent === "Soft · 0 4 12 px")!;
    fireEvent.change(select(), { target: { value: soft.value } });
    expect(onChange).toHaveBeenCalledWith("box-shadow", soft.value);
  });

  it("keeps an unmatched shadow visible as Custom rather than resetting it", () => {
    renderPart(ShadowSection, { "box-shadow": "1px 1px 0 red" });
    expect(select().value).toBe("1px 1px 0 red");
    expect(select().selectedOptions[0].textContent).toBe("Custom");
  });

  it("keeps an inner shadow when the outer preset changes", () => {
    const { onChange } = renderPart(ShadowSection, {
      "box-shadow": "0 4px 12px rgba(0,0,0,0.08), inset 0 2px 4px rgba(0,0,0,0.06)",
    });
    fireEvent.change(select(), { target: { value: "none" } });
    expect(onChange).toHaveBeenCalledWith("box-shadow", "inset 0 2px 4px rgba(0,0,0,0.06)");
  });
});

describe("BlurSection", () => {
  it("writes blur into the filter list, keeping other filters", () => {
    const { onChange } = renderPart(BlurSection, { filter: "grayscale(50%)" });
    fireEvent.change(screen.getByRole("slider", { name: "Blur" }), { target: { value: "4" } });
    expect(onChange).toHaveBeenCalledWith("filter", expect.stringContaining("blur(4px)"));
    expect(onChange).toHaveBeenCalledWith("filter", expect.stringContaining("grayscale(50%)"));
  });
});

describe("EffectsSection (More effects) — what moved out", () => {
  it("no longer carries opacity, the outer preset grid or blur", () => {
    renderEffects();
    expect(screen.queryByRole("slider", { name: "Opacity" })).toBeNull();
    expect(screen.queryByRole("slider", { name: "Blur" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Glow" })).toBeNull();
  });

  it("inner preset merges with the existing outer shadow", () => {
    const { onChange } = renderEffects({ "box-shadow": "0 4px 6px rgba(0,0,0,0.1)" });
    fireEvent.click(screen.getByRole("button", { name: "Soft" }));
    expect(onChange).toHaveBeenCalledWith(
      "box-shadow",
      "0 4px 6px rgba(0,0,0,0.1), inset 0 2px 4px rgba(0,0,0,0.06)"
    );
  });

  it("inner 'None' keeps the outer shadow", () => {
    const { onChange } = renderEffects({
      "box-shadow": "0 4px 6px rgba(0,0,0,0.1), inset 0 2px 4px rgba(0,0,0,0.06)",
    });
    fireEvent.click(screen.getByRole("button", { name: "None" }));
    expect(onChange).toHaveBeenCalledWith("box-shadow", "0 4px 6px rgba(0,0,0,0.1)");
  });
});

describe("EffectsSection — transition + cursor selects", () => {
  it("transition Property select writes transition-property", () => {
    const { onChange, container } = renderEffects();
    const propertySelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "box-shadow")
    ) as HTMLSelectElement;
    fireEvent.change(propertySelect, { target: { value: "opacity" } });
    expect(onChange).toHaveBeenCalledWith("transition-property", "opacity");
  });

  it("cursor select writes cursor", () => {
    const { onChange, container } = renderEffects();
    const cursorSelect = Array.from(container.querySelectorAll("select")).find((s) =>
      Array.from(s.options).some((o) => o.value === "grabbing")
    ) as HTMLSelectElement;
    fireEvent.change(cursorSelect, { target: { value: "pointer" } });
    expect(onChange).toHaveBeenCalledWith("cursor", "pointer");
  });
});

describe("EffectsSection — collapsed preview", () => {
  it("counts the advanced effects that are set", () => {
    renderEffects({ transform: "scale(1.1)", cursor: "pointer" }, false);
    expect(screen.getByText("2 set")).toBeInTheDocument();
  });

  it("renders no preview when no effects are applied", () => {
    const { container } = renderEffects({}, false);
    expect(container.querySelector(".bdi-sec-preview")).toBeNull();
  });
});
