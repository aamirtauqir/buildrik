import { describe, it, expect } from "vitest";
import { deriveCssContext } from "../cssContext";

describe("deriveCssContext respects effective styles", () => {
  it("treats overlay display:flex as flex container even when base is block", () => {
    const composer = {
      elements: {
        getElement: () => ({
          getStyles: () => ({ display: "block" }),
          getParent: () => null,
        }),
      },
    } as any;
    const ctx = deriveCssContext(
      { id: "e1", type: "box" },
      composer,
      false,
      { display: "flex" }
    );
    expect(ctx.isFlexContainer).toBe(true);
    expect(ctx.display).toBe("flex");
  });

  it("falls back to base styles when effectiveStyles is not provided", () => {
    const composer = {
      elements: {
        getElement: () => ({
          getStyles: () => ({ display: "grid" }),
          getParent: () => null,
        }),
      },
    } as any;
    const ctx = deriveCssContext({ id: "e1", type: "box" }, composer, false);
    expect(ctx.isGridContainer).toBe(true);
    expect(ctx.display).toBe("grid");
  });
});
