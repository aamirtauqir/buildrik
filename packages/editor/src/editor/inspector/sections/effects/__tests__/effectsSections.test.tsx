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
import { SECTION_REGISTRY } from "@/editor/inspector/sections/registry";
import { EffectsAdvancedSection } from "../EffectsAdvancedSection";
import { FiltersSection } from "../FiltersSection";
import { ToastProvider } from "@/editor/chrome-ui";
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

describe("Shadow — layer rows (2L9 161:12525)", () => {
  it("one layer: X offset · Y offset · Blur · Spread · Color · Inset, '1 layer' in the header", () => {
    const p = props({ "box-shadow": "0 4px 12px 0 rgba(17, 24, 39, 0.12)" });
    render(<ShadowSection {...p} />);
    expect(screen.getByText("1 layer")).toBeInTheDocument();
    expect(screen.getByLabelText("Y offset")).toHaveValue("4");
    expect(screen.getByLabelText("Blur")).toHaveValue("12");
    expect(screen.getByRole("textbox", { name: "Color value" })).toHaveValue("#111827 / 12%");
    fireEvent.change(screen.getByLabelText("Blur"), { target: { value: "20" } });
    expect(p.onChange).toHaveBeenLastCalledWith("box-shadow", "0px 4px 20px 0px rgba(17, 24, 39, 0.12)");
    fireEvent.click(screen.getByRole("checkbox", { name: "Inset" }));
    expect(p.onChange).toHaveBeenLastCalledWith("box-shadow", "inset 0px 4px 12px 0px rgba(17, 24, 39, 0.12)");
  });

  it("each layer keeps the others; removing the second leaves the first", () => {
    const p = props({ "box-shadow": "0 1px 2px red, inset 0 2px 4px blue" });
    render(<ShadowSection {...p} />);
    expect(screen.getByText("2 layers")).toBeInTheDocument();
    /* A08: several layers read back as authored first; Edit layers opens them. */
    expect(screen.getByTestId("inspector-shadow-summary")).toHaveTextContent("0 1px 2px red, inset 0 2px 4px blue");
    fireEvent.click(screen.getByRole("button", { name: "Edit layers" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove layer 2" }));
    expect(p.onChange).toHaveBeenLastCalledWith("box-shadow", "0px 1px 2px 0px red");
  });

  it("a value the rows cannot hold is kept as written, with Edit custom value", () => {
    const p = props({ "box-shadow": "var(--elevation-2)" });
    render(<ShadowSection {...p} />);
    expect(screen.getByTestId("inspector-shadow-authored")).toHaveTextContent("var(--elevation-2)");
    expect(screen.getByRole("button", { name: "Edit custom value" })).toBeInTheDocument();
  });
});

describe("Filters — kept as written when the sliders cannot hold it (161:12525, I10)", () => {
  it("two blurs and a saturate: 'Custom', the authored value, the note, and an edit that writes the text", () => {
    const p = props({ filter: "blur(4px) saturate(1.2) blur(1px)" });
    render(
      <ToastProvider>
        <FiltersSection {...p} />
      </ToastProvider>,
    );
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.getByTestId("inspector-filters-authored")).toHaveTextContent("blur(4px) saturate(1.2) blur(1px)");
    expect(screen.getByText("Two blur functions are preserved in their original order.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Brightness")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Edit custom value" }));
    const box = screen.getByRole("textbox", { name: "Authored value" });
    fireEvent.change(box, { target: { value: "blur(2px) saturate(1.2) blur(1px)" } });
    fireEvent.blur(box);
    expect(p.onChange).toHaveBeenCalledWith("filter", "blur(2px) saturate(1.2) blur(1px)");
    expect(screen.getByText("Filter updated")).toBeInTheDocument();
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

  it("a bare ratio reads as its percentage — brightness(1) is 100, not 1 (2L9 36:2)", () => {
    render(<FiltersSection {...props({ filter: "brightness(1) contrast(1.5) grayscale(0.25)" })} />);
    expect(screen.getByLabelText("Brightness")).toHaveValue("100");
    expect(screen.getByLabelText("Contrast")).toHaveValue("150");
    expect(screen.getByLabelText("Grayscale")).toHaveValue("25");
  });
});

describe("Filters — 2L9 36:2 'n set' on the open section", () => {
  it("counts the filters off their identity; none set shows no count", () => {
    const { unmount } = render(<FiltersSection {...props({ filter: "blur(4px) brightness(1)" })} />);
    expect(screen.getByTestId("inspector-filters-count")).toHaveTextContent("1 set");
    unmount();
    render(<FiltersSection {...props()} />);
    expect(screen.queryByTestId("inspector-filters-count")).toBeNull();
  });
});

describe("Transform & motion", () => {
  it("A08: Scale reads as a percent; rotate keeps scale; the transition rows write their longhands", () => {
    const p = props({ transform: "scale(1.5)" });
    render(<TransformMotionSection {...p} />);
    expect(screen.getByLabelText("Scale")).toHaveValue("150");
    const rotate = screen.getByLabelText("Rotate");
    fireEvent.change(rotate, { target: { value: "45" } });
    fireEvent.blur(rotate);
    expect(p.onChange).toHaveBeenCalledWith("transform", "scale(1.5) rotate(45deg)");
    fireEvent.change(screen.getByLabelText("Property"), { target: { value: "transform, opacity" } });
    expect(p.onChange).toHaveBeenLastCalledWith("transition-property", "transform, opacity");
  });

  /* QA 2026-10-02: unset Move X / Move Y / Duration / Delay showed "0px",
     "0.3s", "0s" in grey — read as values (a 0.3s transition that is not
     there). Same rule as Size's unset Min / Max (DD-12): unset reads empty. */
  it("unset move and transition fields read empty, not value-shaped", () => {
    render(<TransformMotionSection {...props()} />);
    for (const label of ["Move X", "Move Y", "Duration", "Delay"]) {
      const input = screen.getByLabelText(label) as HTMLInputElement;
      expect(input).toHaveValue("");
      expect(input.placeholder).toBe("");
    }
  });
});

describe("Advanced", () => {
  it("cursor and blend write their properties", () => {
    const p = props();
    render(<EffectsAdvancedSection {...p} />);
    fireEvent.change(screen.getByLabelText("Cursor"), { target: { value: "pointer" } });
    expect(p.onChange).toHaveBeenCalledWith("cursor", "pointer");
    fireEvent.change(screen.getByLabelText("Blend mode"), { target: { value: "multiply" } });
    expect(p.onChange).toHaveBeenLastCalledWith("mix-blend-mode", "multiply");
    /* A09: Will change is written as typed — a list like "transform, opacity". */
    fireEvent.change(screen.getByLabelText("Will change"), { target: { value: "transform, opacity" } });
    expect(p.onChange).toHaveBeenLastCalledWith("will-change", "transform, opacity");
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

  it("Opacity, Shadow, Filters arrive by value; Transform and transition and Advanced effects shut (161:12525)", () => {
    expect(ids.map((id) => SECTION_REGISTRY[id].open)).toEqual(["valued", "valued", "valued", "closed", "closed"]);
  });

  it("a shadow of none does not count as a value", () => {
    const has = SECTION_REGISTRY.shadow.hasValue!;
    expect(has({ authoredStyles: { "box-shadow": "none" } } as never)).toBe(false);
    expect(has({ authoredStyles: { "box-shadow": "0 1px 2px red" } } as never)).toBe(true);
  });
});
