/**
 * Behaviour › Collection (board 20; G3-079): pick a collection (binds the
 * list to repeat its children), "+ New collection…", cap the count with Show
 * items, Open collection ›, or pick None (unbinds).
 *
 * @license BSD-3-Clause
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CollectionListSection } from "../CollectionListSection";
import type { Composer } from "@/engine";

function makeComposer(bound: { collectionId: string; limit?: number } | null = null) {
  const bindCollectionList = vi.fn();
  const unbindCollection = vi.fn();
  const composer = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    /* P-1: bind / unbind pass the lock gate, which reads the element. */
    elements: { getElement: () => ({ isLocked: () => false }) },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    cms: {
      bindings: {
        bindCollectionList,
        unbindCollection,
        getCollectionBinding: vi.fn(() => (bound ? { elementId: "list", itemVar: "item", repeat: "children", ...bound } : null)),
      },
      collections: {
        on: vi.fn(),
        off: vi.fn(),
        getAllCollections: vi.fn(() => [{ id: "menu", name: "Menu items", slug: "menu-items", fields: [] }]),
      },
    },
  } as unknown as Composer;
  return { composer, bindCollectionList, unbindCollection };
}

const renderSection = (composer: Composer, onOpenCreateCollection?: () => void) =>
  render(<CollectionListSection elementId="list" composer={composer} onOpenCreateCollection={onOpenCreateCollection} isOpen />);

describe("CollectionListSection", () => {
  it("lists None + every collection", () => {
    renderSection(makeComposer().composer);
    const select = screen.getByRole("combobox", { name: "Collection" });
    expect([...(select as HTMLSelectElement).options].map((o) => o.textContent)).toEqual(["None", "Menu items"]);
  });

  it("picking a collection binds the list to it", () => {
    const { composer, bindCollectionList } = makeComposer();
    renderSection(composer);
    fireEvent.change(screen.getByRole("combobox", { name: "Collection" }), { target: { value: "menu" } });
    expect(bindCollectionList).toHaveBeenCalledWith("list", "menu", { limit: undefined });
  });

  it("the Show field caps the count on the bound collection", () => {
    const { composer, bindCollectionList } = makeComposer({ collectionId: "menu" });
    renderSection(composer);
    fireEvent.change(screen.getByRole("textbox", { name: "Show items" }), { target: { value: "3" } });
    expect(bindCollectionList).toHaveBeenLastCalledWith("list", "menu", { limit: 3 });
  });

  /* Board 20 draws Show items as a number field with a stepper and no unit. */
  it("Show items is a number field: ↑ steps the count, no unit dropdown", () => {
    const { composer, bindCollectionList } = makeComposer({ collectionId: "menu", limit: 6 });
    renderSection(composer);
    const field = screen.getByRole("textbox", { name: "Show items" });
    fireEvent.keyDown(field, { key: "ArrowUp" });
    expect(bindCollectionList).toHaveBeenLastCalledWith("list", "menu", { limit: 7 });
    expect(screen.queryByRole("combobox", { name: "Show items unit" })).toBeNull();
  });

  /* Ldata I2a: the stored binding's limit is bounded (cmsBindingsSchema);
     a bigger number typed here must not produce a binding the save drops. */
  it("the Show field clamps an oversized count to the stored maximum", () => {
    const { composer, bindCollectionList } = makeComposer({ collectionId: "menu" });
    renderSection(composer);
    fireEvent.change(screen.getByRole("textbox", { name: "Show items" }), { target: { value: "999999" } });
    expect(bindCollectionList).toHaveBeenLastCalledWith("list", "menu", { limit: 10_000 });
  });

  it("None unbinds", () => {
    const { composer, unbindCollection } = makeComposer({ collectionId: "menu" });
    renderSection(composer);
    fireEvent.change(screen.getByRole("combobox", { name: "Collection" }), { target: { value: "" } });
    expect(unbindCollection).toHaveBeenCalledWith("list");
  });

  it("+ New collection… is offered bound or not, and opens the create door", () => {
    const create = vi.fn();
    renderSection(makeComposer().composer, create);
    fireEvent.click(screen.getByTestId("collection-new"));
    expect(create).toHaveBeenCalled();
  });

  it("board 20 order: Collection · + New collection… · Show items · Open collection", () => {
    const { container } = renderSection(makeComposer({ collectionId: "menu", limit: 6 }).composer, vi.fn());
    const text = container.textContent ?? "";
    const at = ["Collection", "+ New collection…", "Show items", "Open collection"].map((t) => text.indexOf(t));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("Open collection › opens the CMS on the bound collection's table", () => {
    const { composer } = makeComposer({ collectionId: "menu" });
    renderSection(composer);
    fireEvent.click(screen.getByTestId("collection-open"));
    expect(composer.emit).toHaveBeenCalledWith("ui:cms-open", { collectionId: "menu" });
  });

  it("unbound: no Show items, no Open collection", () => {
    renderSection(makeComposer().composer);
    expect(screen.queryByRole("textbox", { name: "Show items" })).toBeNull();
    expect(screen.queryByTestId("collection-open")).toBeNull();
  });
});
