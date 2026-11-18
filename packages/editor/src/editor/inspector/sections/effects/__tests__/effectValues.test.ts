/**
 * Guards transform/filter composition (PRD gap A2/A3): adjusting one function
 * must NOT wipe the others (was data-destructive — rotate clobbered scale).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { composable, composeFilter, composeShadowLayers, composeTransform, FILTER_ORDER, parseShadowLayers } from "../effectValues";

describe("composeTransform", () => {
  it("merges a new function without dropping existing ones", () => {
    const after = composeTransform("scale(1.5)", "rotate", "45deg");
    expect(after).toBe("scale(1.5) rotate(45deg)");
  });

  it("replaces an existing function in place", () => {
    const after = composeTransform("scale(1.5) rotate(45deg)", "scale", "2");
    expect(after).toBe("scale(2) rotate(45deg)");
  });

  it("preserves translate while editing rotate", () => {
    const after = composeTransform("translateX(10px) scale(1.5)", "rotate", "30deg");
    expect(after).toBe("translateX(10px) scale(1.5) rotate(30deg)");
  });

  it("drops a function set back to its identity value", () => {
    const after = composeTransform("scale(1.5) rotate(45deg)", "rotate", "0deg");
    expect(after).toBe("scale(1.5)");
  });

  it("returns none when all functions are identity", () => {
    expect(composeTransform("scale(1)", "scale", "1")).toBe("none");
  });
});

describe("composeFilter", () => {
  it("keeps brightness when editing blur (canonical order)", () => {
    const after = composeFilter("brightness(120%)", "blur", "4px");
    expect(after).toBe("blur(4px) brightness(120%)");
  });

  it("does not let blur clobber contrast (canonical order)", () => {
    const after = composeFilter("contrast(150%) blur(2px)", "blur", "8px");
    expect(after).toBe("blur(8px) contrast(150%)");
  });

  it("drops identity filters", () => {
    expect(composeFilter("blur(4px)", "blur", "0px")).toBe("none");
  });
});

describe("box-shadow layers (2L9 161:12525)", () => {
  it("reads each layer's parts without breaking rgba(), and writes them back", () => {
    const v = "0 4px 12px rgba(0,0,0,0.08), inset 0 2px 4px 1px rgba(0, 0, 0, 0.1)";
    const layers = parseShadowLayers(v)!;
    expect(layers).toEqual([
      { inset: false, x: "0px", y: "4px", blur: "12px", spread: "0px", color: "rgba(0,0,0,0.08)" },
      { inset: true, x: "0px", y: "2px", blur: "4px", spread: "1px", color: "rgba(0, 0, 0, 0.1)" },
    ]);
    expect(composeShadowLayers(layers)).toBe("0px 4px 12px 0px rgba(0,0,0,0.08), inset 0px 2px 4px 1px rgba(0, 0, 0, 0.1)");
  });

  it("none / empty is no layers; none written back when all are removed", () => {
    expect(parseShadowLayers("none")).toEqual([]);
    expect(composeShadowLayers([])).toBe("none");
  });

  it("a value the rows cannot hold reads as null (kept as written)", () => {
    expect(parseShadowLayers("var(--elevation)")).toBeNull();
    expect(parseShadowLayers("0 0 calc(1px + 2px) red")).toBeNull();
  });
});

describe("composable (161:12525)", () => {
  it("is false for an unknown function or one written twice — the sliders would drop it", () => {
    expect(composable("blur(4px) brightness(120%)", FILTER_ORDER)).toBe(true);
    expect(composable("blur(4px) saturate(1.2) blur(1px)", FILTER_ORDER)).toBe(false);
    expect(composable("saturate(1.2)", FILTER_ORDER)).toBe(false);
    expect(composable(undefined, FILTER_ORDER)).toBe(true);
  });
});
