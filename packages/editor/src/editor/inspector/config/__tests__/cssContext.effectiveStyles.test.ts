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

  it("marks child as flex item when parent's mobile overlay sets display:flex", () => {
    const parent = {
      getId: () => "p1",
      getStyles: () => ({ display: "block" }),
      getParent: () => null,
    };
    const el = {
      getId: () => "e1",
      getStyles: () => ({}),
      getParent: () => parent,
    };
    const composer = {
      elements: { getElement: () => el },
      styles: {
        getBreakpointStyle: (id: string) => (id === "p1" ? { display: "flex" } : {}),
        getRule: () => undefined,
      },
    } as any;
    const ctx = deriveCssContext(
      { id: "e1", type: "box" },
      composer,
      false,
      undefined,
      "mobile",
      "normal",
    );
    expect(ctx.isFlexItem).toBe(true);
    expect(ctx.parentDisplay).toBe("flex");
  });

  it("marks child as grid item when parent's :hover pseudo sets display:grid", () => {
    const parent = {
      getId: () => "p1",
      getStyles: () => ({ display: "block" }),
      getParent: () => null,
    };
    const el = {
      getId: () => "e1",
      getStyles: () => ({}),
      getParent: () => parent,
    };
    const composer = {
      elements: { getElement: () => el },
      styles: {
        getBreakpointStyle: () => ({}),
        getRule: (selector: string) =>
          selector === '[data-buildrick-id="p1"]:hover'
            ? { properties: { display: "grid" } }
            : undefined,
      },
    } as any;
    const ctx = deriveCssContext(
      { id: "e1", type: "box" },
      composer,
      false,
      undefined,
      "desktop",
      "hover",
    );
    expect(ctx.isGridItem).toBe(true);
    expect(ctx.parentDisplay).toBe("grid");
  });
});
