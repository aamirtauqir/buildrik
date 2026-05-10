import { describe, it, expect, vi } from "vitest";
import { placeCatalogComponent } from "../placeCatalogComponent";
import { CATALOG } from "../catalog";
import type { Composer } from "@/engine";

interface FakeElement {
  id: string;
  attributes: Record<string, string>;
  content: string;
  type: string;
  children: FakeElement[];
  getId: () => string;
  addChild: (child: FakeElement, index?: number) => void;
}

function makeComposer(opts: { hasParent: boolean; throwOnAddChild?: boolean }) {
  const tx: { active: boolean; rolledBack: boolean; ended: boolean } = {
    active: false, rolledBack: false, ended: false,
  };
  const parent: FakeElement | null = opts.hasParent
    ? {
        id: "parent-1",
        attributes: {},
        content: "",
        type: "container",
        children: [],
        getId: () => "parent-1",
        addChild: (child, _index) => {
          if (opts.throwOnAddChild) throw new Error("addChild fail");
          parent!.children.push(child);
        },
      }
    : null;

  return {
    elements: {
      getElement: vi.fn((id: string) => (id === "parent-1" ? parent : undefined)),
      createElement: vi.fn((type: string, options: { content?: string; attributes?: Record<string, string> }) => {
        const id = `el-${Math.random().toString(36).slice(2, 8)}`;
        return {
          id,
          attributes: options.attributes ?? {},
          content: options.content ?? "",
          type,
          children: [],
          getId: () => id,
          addChild: () => {},
        } as FakeElement;
      }),
    },
    beginTransaction: vi.fn(() => { tx.active = true; }),
    endTransaction: vi.fn(() => { tx.active = false; tx.ended = true; }),
    rollbackTransaction: vi.fn(() => { tx.active = false; tx.rolledBack = true; }),
  } as unknown as Composer;
}

describe("placeCatalogComponent", () => {
  it("creates an element of mapped type + adds to parent", () => {
    const composer = makeComposer({ hasParent: true });
    const button = CATALOG.find((c) => c.id === "button")!;
    const result = placeCatalogComponent(composer, button, "parent-1");

    expect(result.elementId).toBeTruthy();
    expect(result.variant).toBe("primary");
    expect((composer.elements.createElement as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe("button");
  });

  it("attaches data-buildrik-catalog-component + data-variant attrs", () => {
    const composer = makeComposer({ hasParent: true });
    const card = CATALOG.find((c) => c.id === "card")!;
    placeCatalogComponent(composer, card, "parent-1");
    const createOpts = (composer.elements.createElement as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(createOpts.attributes["data-buildrik-catalog-component"]).toBe("card");
    expect(createOpts.attributes["data-variant"]).toBe(card.variants[0]);
  });

  it("rolls back transaction when parent is missing", () => {
    const composer = makeComposer({ hasParent: false });
    const button = CATALOG.find((c) => c.id === "button")!;
    const result = placeCatalogComponent(composer, button, "missing-parent");
    expect(result.elementId).toBeUndefined();
    expect(composer.rollbackTransaction).toHaveBeenCalled();
  });

  it("rolls back when addChild throws", () => {
    const composer = makeComposer({ hasParent: true, throwOnAddChild: true });
    const button = CATALOG.find((c) => c.id === "button")!;
    const result = placeCatalogComponent(composer, button, "parent-1");
    expect(result.elementId).toBeUndefined();
    expect(composer.rollbackTransaction).toHaveBeenCalled();
  });

  it("maps unmapped catalog ids to 'container' element type", () => {
    const composer = makeComposer({ hasParent: true });
    const modal = CATALOG.find((c) => c.id === "modal")!;
    placeCatalogComponent(composer, modal, "parent-1");
    expect((composer.elements.createElement as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe("container");
  });
});
