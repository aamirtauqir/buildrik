/**
 * SECTION_REGISTRY shouldRender predicates — the per-family visibility gates
 * (flex/grid container-or-item, link element types, dev-only all-css,
 * text-like typography).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { SECTION_REGISTRY, type ShouldRenderContext } from "../index";

const ctx = (partial: unknown) => partial as ShouldRenderContext;

describe("SECTION_REGISTRY — shouldRender gates", () => {
  it("flex renders for a flex container OR a flex item, else hides", () => {
    const gate = SECTION_REGISTRY.flex.shouldRender!;
    expect(gate(ctx({ cssContext: { isFlexContainer: true, isFlexItem: false } }))).toBe(true);
    expect(gate(ctx({ cssContext: { isFlexContainer: false, isFlexItem: true } }))).toBe(true);
    expect(gate(ctx({ cssContext: { isFlexContainer: false, isFlexItem: false } }))).toBe(false);
  });

  it("grid renders for a grid container OR a grid item, else hides", () => {
    const gate = SECTION_REGISTRY.grid.shouldRender!;
    expect(gate(ctx({ cssContext: { isGridContainer: true, isGridItem: false } }))).toBe(true);
    expect(gate(ctx({ cssContext: { isGridContainer: false, isGridItem: true } }))).toBe(true);
    expect(gate(ctx({ cssContext: { isGridContainer: false, isGridItem: false } }))).toBe(false);
  });

  it("link renders only for linkable element types", () => {
    const gate = SECTION_REGISTRY.link.shouldRender!;
    expect(gate(ctx({ selectedElement: { type: "link" } }))).toBe(true);
    expect(gate(ctx({ selectedElement: { type: "button" } }))).toBe(true);
    expect(gate(ctx({ selectedElement: { type: "container" } }))).toBe(false);
  });

  it("all-css renders only in dev mode", () => {
    const gate = SECTION_REGISTRY["all-css"].shouldRender!;
    expect(gate(ctx({ devMode: true }))).toBe(true);
    expect(gate(ctx({ devMode: false }))).toBe(false);
  });

  it("typography renders only for text-like elements", () => {
    const gate = SECTION_REGISTRY.typography.shouldRender!;
    expect(gate(ctx({ cssContext: { inspectorContext: { isTextLike: true } } }))).toBe(true);
    expect(gate(ctx({ cssContext: { inspectorContext: { isTextLike: false } } }))).toBe(false);
  });

  it("universal sections (css-classes) declare no gate", () => {
    expect(SECTION_REGISTRY["css-classes"].shouldRender).toBeUndefined();
  });
});
