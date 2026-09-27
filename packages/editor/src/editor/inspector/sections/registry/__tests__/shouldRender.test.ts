/**
 * SECTION_REGISTRY presence — v4: `capability` reads what the TYPE is (the
 * one table, @/shared/constants/elementCapabilities); `shouldRender` reads
 * runtime state (a flex container, a component instance).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect } from "vitest";
import { SECTION_REGISTRY, type ShouldRenderContext } from "../index";
import { capabilitiesFor } from "@/shared/constants/elementCapabilities";

const ctx = (partial: unknown) => partial as ShouldRenderContext;
const has = (id: keyof typeof SECTION_REGISTRY, type: string) => SECTION_REGISTRY[id].capability?.(capabilitiesFor(type)) ?? true;

describe("SECTION_REGISTRY — capability gates", () => {
  it("link: linkable types only (boards 6, 7, 18)", () => {
    for (const t of ["link", "button", "section", "container", "card", "cta"]) expect(has("link", t), t).toBe(true);
    for (const t of ["image", "heading", "form", "list-item"]) expect(has("link", t), t).toBe(false);
  });

  it("cms-binding: bindable types only — never on a Section or a container (R-2, board 18)", () => {
    for (const t of ["heading", "text", "paragraph", "image", "button", "link"]) expect(has("cms-binding", t), t).toBe(true);
    for (const t of ["section", "video", "icon", "divider", "container"]) expect(has("cms-binding", t), t).toBe(false);
  });

  it("typography opens on text; containers, buttons and fields get Text inside; media neither", () => {
    expect(has("typography", "heading")).toBe(true);
    expect(has("text-inside", "heading")).toBe(false);
    for (const t of ["section", "button", "input", "checkbox"]) {
      expect(has("typography", t), t).toBe(false);
      expect(has("text-inside", t), t).toBe(true);
    }
    for (const t of ["image", "video-embed", "divider"]) {
      expect(has("typography", t), t).toBe(false);
      expect(has("text-inside", t), t).toBe(false);
    }
  });

  it("layout: containers, not the Flex / Grid types (their type block carries it)", () => {
    expect(has("layout", "container")).toBe(true);
    expect(has("layout", "flex")).toBe(false);
    expect(has("layout", "heading")).toBe(false);
  });

  it("the type's own Behaviour sections come from its capabilities", () => {
    expect(has("form-fields", "form")).toBe(true);
    expect(has("form-fields", "container")).toBe(false);
    expect(has("collection", "collection-list")).toBe(true);
    expect(has("slides", "slider")).toBe(true);
  });

  it("universal sections declare no gate", () => {
    for (const id of ["size", "spacing", "fill", "border", "visibility", "interactions", "css-classes", "attributes", "opacity"] as const) {
      expect(SECTION_REGISTRY[id].capability, id).toBeUndefined();
      expect(SECTION_REGISTRY[id].shouldRender, id).toBeUndefined();
    }
  });
});

describe("SECTION_REGISTRY — runtime gates", () => {
  it("the interim flex / grid sections render for a container set to flex / grid", () => {
    expect(SECTION_REGISTRY.flex.shouldRender!(ctx({ cssContext: { isFlexContainer: true } }))).toBe(true);
    expect(SECTION_REGISTRY.flex.shouldRender!(ctx({ cssContext: { isFlexContainer: false } }))).toBe(false);
    expect(SECTION_REGISTRY.grid.shouldRender!(ctx({ cssContext: { isGridContainer: true } }))).toBe(true);
  });

  it("the component row renders only on an instance", () => {
    const gate = SECTION_REGISTRY.component.shouldRender!;
    const composer = (instance: unknown) => ({ components: { getInstanceByElementId: () => instance } });
    expect(gate(ctx({ composer: composer({ elementId: "e" }), selectedElement: { id: "e" } }))).toBe(true);
    expect(gate(ctx({ composer: composer(null), selectedElement: { id: "e" } }))).toBe(false);
  });
});
