/**
 * 2L9 A10: a CSS animation's saved non-load trigger is said not to apply;
 * an interaction animating the same property is named, never removed.
 * @license BSD-3-Clause
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_ANIMATION } from "@/shared/types/animations";
import { animatedProperties, ElementAnimationEditor } from "../ElementAnimationRow";

describe("Element CSS animation (A10)", () => {
  it("names the legacy trigger and the property conflict; Inspect / Disable act, nothing removed on its own", () => {
    const onChange = vi.fn();
    const onInspect = vi.fn();
    render(
      <ElementAnimationEditor
        animation={{ ...DEFAULT_ANIMATION, type: "fadeIn", trigger: "hover" }}
        onChange={onChange}
        conflicts={[{ id: "i1", label: "On scroll into view · Fade in", property: "opacity" }]}
        onInspect={onInspect}
      />,
    );
    expect(screen.getByTestId("element-animation-legacy")).toHaveTextContent("This saved Hover trigger is not applied by current CSS output.");
    expect(screen.getByTestId("element-animation-conflict")).toHaveTextContent("Fade In and On scroll into view · Fade in both animate opacity. Neither is removed automatically.");
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("element-animation-inspect-conflict"));
    expect(onInspect).toHaveBeenCalledWith("i1");
    fireEvent.click(screen.getByTestId("element-animation-disable"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("knows what a preset moves", () => {
    expect([...animatedProperties("fadeInUp")].sort()).toEqual(["opacity", "transform"]);
    expect([...animatedProperties("fadeIn")]).toEqual(["opacity"]);
  });
});
