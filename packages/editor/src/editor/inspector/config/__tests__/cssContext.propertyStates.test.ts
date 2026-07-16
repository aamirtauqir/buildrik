/**
 * cssContext — computeEffectiveStyles cascade (base → breakpoint → pseudo)
 * and getPropertyStates disable/hidden gates. deriveCssContext itself is
 * covered by cssContext.effectiveStyles.test.ts.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { computeEffectiveStyles, getPropertyStates, type CssContext } from "../cssContext";

function makeCtx(overrides: Partial<CssContext>): CssContext {
  // getPropertyStates only reads the boolean flags below; a partial cast is
  // enough for this unit.
  return {
    isInline: false,
    isMedia: false,
    isFlexContainer: false,
    isGridContainer: false,
    isFlexItem: false,
    isPositioned: false,
    ...overrides,
  } as CssContext;
}

describe("computeEffectiveStyles — cascade order", () => {
  it("returns base styles at desktop/normal", () => {
    const el = { getId: () => "e1", getStyles: () => ({ color: "red", display: "block" }) };
    const out = computeEffectiveStyles(el as never, null, "desktop", "normal");
    expect(out).toEqual({ color: "red", display: "block" });
  });

  it("layers a breakpoint overlay on top of base at a non-desktop breakpoint", () => {
    const el = { getId: () => "e1", getStyles: () => ({ display: "block", color: "red" }) };
    const composer = {
      styles: {
        getBreakpointStyle: (id: string, bp: string) =>
          id === "e1" && bp === "mobile" ? { display: "flex" } : {},
        getRule: () => undefined,
      },
    };
    const out = computeEffectiveStyles(el as never, composer as never, "mobile", "normal");
    expect(out.display).toBe("flex"); // overlay wins
    expect(out.color).toBe("red"); // base preserved
  });

  it("layers a pseudo rule on top of base+breakpoint", () => {
    const el = { getId: () => "e1", getStyles: () => ({ color: "red" }) };
    const composer = {
      styles: {
        getBreakpointStyle: () => ({}),
        getRule: (selector: string) =>
          selector === '[data-buildrick-id="e1"]:hover'
            ? { properties: { color: "blue" } }
            : undefined,
      },
    };
    const out = computeEffectiveStyles(el as never, composer as never, "desktop", "hover");
    expect(out.color).toBe("blue");
  });

  it("returns an empty object for a null element", () => {
    expect(computeEffectiveStyles(null, null, "desktop", "normal")).toEqual({});
  });
});

describe("getPropertyStates — property disable gates", () => {
  it("disables width/height + vertical spacing for inline elements", () => {
    const states = getPropertyStates(makeCtx({ isInline: true }));
    expect(states.width.disabled).toBe(true);
    expect(states.width.reason).toMatch(/inline/i);
    expect(states["margin-top"].disabled).toBe(true);
  });

  it("hides object-fit for non-media elements", () => {
    const states = getPropertyStates(makeCtx({ isMedia: false }));
    expect(states["object-fit"].hidden).toBe(true);
  });

  it("does NOT hide object-fit for media elements", () => {
    const states = getPropertyStates(makeCtx({ isMedia: true }));
    expect(states["object-fit"]).toBeUndefined();
  });

  it("disables gaps when neither flex nor grid container", () => {
    const states = getPropertyStates(makeCtx({}));
    expect(states.gap.disabled).toBe(true);
    expect(states["row-gap"].disabled).toBe(true);
  });

  it("leaves gaps enabled for a flex container", () => {
    const states = getPropertyStates(makeCtx({ isFlexContainer: true }));
    expect(states.gap).toBeUndefined();
  });

  it("disables flex-item props when not a flex item", () => {
    const states = getPropertyStates(makeCtx({}));
    expect(states["flex-grow"].disabled).toBe(true);
    expect(states["align-self"].disabled).toBe(true);
  });

  it("disables offsets/z-index when not positioned", () => {
    const states = getPropertyStates(makeCtx({}));
    expect(states.top.disabled).toBe(true);
    expect(states["z-index"].disabled).toBe(true);
  });

  it("leaves offsets enabled when positioned", () => {
    const states = getPropertyStates(makeCtx({ isPositioned: true }));
    expect(states.top).toBeUndefined();
  });
});
