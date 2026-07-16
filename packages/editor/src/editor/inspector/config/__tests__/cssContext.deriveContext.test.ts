/**
 * deriveCssContext — branch coverage for the single-element flag derivation
 * (fallback path, inline / inline-block, positioned, media, flex/grid item
 * from the parent). Complements cssContext.effectiveStyles.test.ts.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { deriveCssContext } from "../cssContext";
import { makeMockElement, makeMockComposer } from "@/editor/inspector/__tests__/harness";

function ctxFor(
  styles: Record<string, string>,
  type = "box",
  parentStyles?: Record<string, string>
) {
  const parent = parentStyles ? makeMockElement({ id: "p1", styles: parentStyles }) : null;
  const el = makeMockElement({ id: "e1", type, styles, parent });
  const composer = makeMockComposer({ element: el });
  return deriveCssContext({ id: "e1", type }, composer as never);
}

describe("deriveCssContext — fallback path", () => {
  it("returns the fallback context (no composer) but still flags media by type", () => {
    const ctx = deriveCssContext({ id: "e1", type: "image" }, null);
    expect(ctx.isMedia).toBe(true);
    expect(ctx.isFlexContainer).toBe(false);
    expect(ctx.position).toBe("static");
    expect(ctx.selectedElements).toEqual([]);
  });

  it("returns the fallback context when selectedElement is null", () => {
    const composer = makeMockComposer();
    const ctx = deriveCssContext(null, composer as never);
    expect(ctx.elementType).toBe("");
    expect(ctx.isPositioned).toBe(false);
  });
});

describe("deriveCssContext — single-element flags", () => {
  it("flags inline (but not inline-block) for display:inline", () => {
    const ctx = ctxFor({ display: "inline" });
    expect(ctx.isInline).toBe(true);
    expect(ctx.isInlineBlock).toBe(false);
  });

  it("flags inline-block for display:inline-block", () => {
    const ctx = ctxFor({ display: "inline-block" });
    expect(ctx.isInlineBlock).toBe(true);
    expect(ctx.isInline).toBe(false);
  });

  it("flags positioned for a non-static position", () => {
    const ctx = ctxFor({ position: "absolute" });
    expect(ctx.isPositioned).toBe(true);
    expect(ctx.position).toBe("absolute");
  });

  it("flags grid container for display:grid", () => {
    const ctx = ctxFor({ display: "grid" });
    expect(ctx.isGridContainer).toBe(true);
    expect(ctx.isFlexContainer).toBe(false);
  });

  it("flags media for a video element", () => {
    const ctx = ctxFor({}, "video");
    expect(ctx.isMedia).toBe(true);
  });
});

describe("deriveCssContext — parent-derived item flags", () => {
  it("marks a child of a flex parent as a flex item", () => {
    const ctx = ctxFor({ display: "block" }, "box", { display: "flex" });
    expect(ctx.isFlexItem).toBe(true);
    expect(ctx.isGridItem).toBe(false);
  });

  it("marks a child of a grid parent as a grid item", () => {
    const ctx = ctxFor({ display: "block" }, "box", { display: "grid" });
    expect(ctx.isGridItem).toBe(true);
    expect(ctx.isFlexItem).toBe(false);
  });
});
