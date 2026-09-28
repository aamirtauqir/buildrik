/**
 * Guards transform/filter composition (PRD gap A2/A3): adjusting one function
 * must NOT wipe the others (was data-destructive — rotate clobbered scale).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { composeFilter, composeShadow, composeTransform, extractInnerShadow, extractOuterShadow } from "../effectValues";

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

describe("box-shadow layers", () => {
  it("splits outer and inset layers without breaking rgba()", () => {
    const v = "0 4px 12px rgba(0,0,0,0.08), inset 0 2px 4px rgba(0,0,0,0.1)";
    expect(extractOuterShadow(v)).toBe("0 4px 12px rgba(0,0,0,0.08)");
    expect(extractInnerShadow(v)).toBe("inset 0 2px 4px rgba(0,0,0,0.1)");
  });

  it("composes the two back, and none when both are empty", () => {
    expect(composeShadow("0 1px 2px red", "inset 0 0 1px blue")).toBe("0 1px 2px red, inset 0 0 1px blue");
    expect(composeShadow("", "")).toBe("none");
  });
});
