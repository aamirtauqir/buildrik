/**
 * Effects tab (board 3) — Opacity, Shadow, Filters, Transform & motion,
 * Advanced. Each section is the one writer of its properties; the registry
 * draws them as "+" rows until they carry a value and Advanced closed with
 * "Cursor: auto · Blend: normal".
 *
 * @license BSD-3-Clause
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SECTION_REGISTRY } from "../../registry";
import { EffectsAdvancedSection } from "../EffectsAdvancedSection";
import { FiltersSection } from "../FiltersSection";
import { OpacitySection } from "../OpacitySection";
import { ShadowSection } from "../ShadowSection";
import { TransformMotionSection } from "../TransformMotionSection";

const props = (styles: Record<string, string> = {}) => ({ styles, onChange: vi.fn(), isOpen: true });

describe("Opacity", () => {
  it("reads 100 when unset and writes a fraction", () => {
    const p = props();
    render(<OpacitySection {...p} />);
    expect(screen.getByLabelText("Opacity")).toHaveValue("100");
    fireEvent.change(screen.getByLabelText("Opacity"), { target: { value: "40" } });
    expect(p.onChange).toHaveBeenCalledWith("opacity", "0.4");
  });
});

describe("Shadow — presets, inner and custom in one section (D-12)", () => {
  it("the outer preset keeps an existing inner layer", () => {
    const p = props({ "box-shadow": "inset 0 2px 4px rgba(0,0,0,0.1)" });
    render(<ShadowSection {...p} />);
    fireEvent.change(screen.getByLabelText("Outer"), { target: { value: "0 4px 12px rgba(0,0,0,0.08)" } });
    expect(p.onChange).toHaveBeenCalledWith("box-shadow", "0 4px 12px rgba(0,0,0,0.08), inset 0 2px 4px rgba(0,0,0,0.1)");
  });

  it("the inner preset keeps the outer layer, and None on both writes none", () => {
    const p = props({ "box-shadow": "0 1px 2px rgba(0,0,0,0.06)" });
    render(<ShadowSection {...p} />);
    fireEvent.change(screen.getByLabelText("Inner"), { target: { value: "inset 0 0 10px rgba(0,0,0,0.15)" } });
    expect(p.onChange).toHaveBeenLastCalledWith("box-shadow", "0 1px 2px rgba(0,0,0,0.06), inset 0 0 10px rgba(0,0,0,0.15)");
    fireEvent.change(screen.getByLabelText("Outer"), { target: { value: "" } });
    expect(p.onChange).toHaveBeenLastCalledWith("box-shadow", "none");
  });

  it("an unmatched shadow stays selected as Custom; its CSS is editable behind More settings", () => {
    const p = props({ "box-shadow": "1px 1px 0 red" });
    render(<ShadowSection {...p} />);
    expect(screen.getByLabelText("Outer")).toHaveValue("1px 1px 0 red");
    fireEvent.click(screen.getByRole("button", { name: /more settings/i }));
    fireEvent.change(screen.getByLabelText("Inner CSS"), { target: { value: "0 0 2px blue" } });
    expect(p.onChange).toHaveBeenLastCalledWith("box-shadow", "1px 1px 0 red, inset 0 0 2px blue");
  });
});

describe("Filters — blur and the rest, merged into one filter value", () => {
  it("each slider keeps the other functions", () => {
    const p = props({ filter: "brightness(120%)" });
    render(<FiltersSection {...p} />);
    fireEvent.change(screen.getByLabelText("Blur"), { target: { value: "4" } });
    expect(p.onChange).toHaveBeenCalledWith("filter", "blur(4px) brightness(120%)");
    fireEvent.change(screen.getByLabelText("Grayscale"), { target: { value: "50" } });
    expect(p.onChange).toHaveBeenLastCalledWith("filter", "brightness(120%) grayscale(50%)");
  });
});

describe("Transform & motion", () => {
  it("rotate keeps scale; the transition rows write their longhands", () => {
    const p = props({ transform: "scale(1.5)" });
    render(<TransformMotionSection {...p} />);
    fireEvent.change(screen.getByLabelText("Rotate"), { target: { value: "45" } });
    expect(p.onChange).toHaveBeenCalledWith("transform", "scale(1.5) rotate(45deg)");
    fireEvent.change(screen.getByLabelText("Animate"), { target: { value: "opacity" } });
    expect(p.onChange).toHaveBeenLastCalledWith("transition-property", "opacity");
  });
});

describe("Advanced", () => {
  it("cursor and blend write their properties", () => {
    const p = props();
    render(<EffectsAdvancedSection {...p} />);
    fireEvent.change(screen.getByLabelText("Cursor"), { target: { value: "pointer" } });
    expect(p.onChange).toHaveBeenCalledWith("cursor", "pointer");
    fireEvent.change(screen.getByLabelText("Blend"), { target: { value: "multiply" } });
    expect(p.onChange).toHaveBeenLastCalledWith("mix-blend-mode", "multiply");
  });
});

describe("Effects registry — one writer per property, board 3's arrival", () => {
  const ids = ["opacity", "shadow", "filters", "transform-motion", "effects-advanced"] as const;

  it("no two Effects sections declare the same property", () => {
    const seen = new Map<string, string>();
    for (const id of ids) {
      for (const key of SECTION_REGISTRY[id].styleKeys) {
        expect(seen.get(key), `${key} in ${id} and ${seen.get(key)}`).toBeUndefined();
        seen.set(key, id);
      }
    }
  });

  it("four '+' rows and Advanced closed", () => {
    expect(ids.map((id) => SECTION_REGISTRY[id].open)).toEqual(["valued", "valued", "valued", "valued", "closed"]);
  });

  it("a shadow of none does not count as a value", () => {
    const has = SECTION_REGISTRY.shadow.hasValue!;
    expect(has({ authoredStyles: { "box-shadow": "none" } } as never)).toBe(false);
    expect(has({ authoredStyles: { "box-shadow": "0 1px 2px red" } } as never)).toBe(true);
  });
});
