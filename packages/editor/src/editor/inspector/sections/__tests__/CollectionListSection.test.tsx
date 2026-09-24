/**
 * G3-079 — the Collection list's binding door (Settings › COLLECTION):
 * pick a collection (binds the list to repeat its children), cap the count,
 * or pick None (unbinds).
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

const renderSection = (composer: Composer) =>
  render(<CollectionListSection elementId="list" composer={composer} isOpen />);

describe("CollectionListSection", () => {
  it("lists None + every collection", () => {
    renderSection(makeComposer().composer);
    const select = screen.getByRole("combobox", { name: "Source" });
    expect([...(select as HTMLSelectElement).options].map((o) => o.textContent)).toEqual(["None", "Menu items"]);
  });

  it("picking a collection binds the list to it", () => {
    const { composer, bindCollectionList } = makeComposer();
    renderSection(composer);
    fireEvent.change(screen.getByRole("combobox", { name: "Source" }), { target: { value: "menu" } });
    expect(bindCollectionList).toHaveBeenCalledWith("list", "menu", { limit: undefined });
  });

  it("the Show field caps the count on the bound collection", () => {
    const { composer, bindCollectionList } = makeComposer({ collectionId: "menu" });
    renderSection(composer);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Show" }), { target: { value: "3" } });
    expect(bindCollectionList).toHaveBeenLastCalledWith("list", "menu", { limit: 3 });
  });

  it("None unbinds", () => {
    const { composer, unbindCollection } = makeComposer({ collectionId: "menu" });
    renderSection(composer);
    fireEvent.change(screen.getByRole("combobox", { name: "Source" }), { target: { value: "" } });
    expect(unbindCollection).toHaveBeenCalledWith("list");
  });
});
