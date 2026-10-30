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

const MENU = {
  id: "menu",
  name: "Menu items",
  slug: "menu-items",
  fields: [
    { id: "f1", name: "Name", slug: "name", type: "text" },
    { id: "f2", name: "Price", slug: "price", type: "number" },
  ],
};

function makeComposer(bound: { collectionId: string; limit?: number; sort?: Array<{ field: string; dir: "asc" | "desc" }> } | null = null) {
  const bindCollectionList = vi.fn();
  const unbindCollection = vi.fn();
  const setListQuery = vi.fn(() => true);
  const composer = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    /* P-1: bind / unbind pass the lock gate, which reads the element. */
    elements: { getElement: () => ({ isLocked: () => false, getType: () => "collection-list", getCustomData: () => undefined }), getActivePage: () => ({ name: "Home" }) },
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
    cms: {
      bindings: {
        bindCollectionList,
        unbindCollection,
        setListQuery,
        getCollectionBinding: vi.fn(() => (bound ? { elementId: "list", itemVar: "item", repeat: "children", ...bound } : null)),
      },
      collections: {
        on: vi.fn(),
        off: vi.fn(),
        getAllCollections: vi.fn(() => [MENU]),
        getCollection: vi.fn(() => MENU),
      },
    },
  } as unknown as Composer;
  return { composer, bindCollectionList, unbindCollection, setListQuery };
}

const renderSection = (composer: Composer, onOpenCreateCollection?: () => void) =>
  render(<CollectionListSection elementId="list" composer={composer} onOpenCreateCollection={onOpenCreateCollection} isOpen />);

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

  it("the Show field caps the count on the bound collection — one step on the list's query", () => {
    const { composer, setListQuery } = makeComposer({ collectionId: "menu" });
    renderSection(composer);
    fireEvent.change(screen.getByRole("textbox", { name: "Show" }), { target: { value: "3" } });
    expect(setListQuery).toHaveBeenLastCalledWith("list", { limit: 3 }, "Show items");
  });

  /* Board 20 draws Show items as a number field with a stepper and no unit. */
  it("Show is a number field: ↑ steps the count, no unit dropdown", () => {
    const { composer, setListQuery } = makeComposer({ collectionId: "menu", limit: 6 });
    renderSection(composer);
    const field = screen.getByRole("textbox", { name: "Show" });
    fireEvent.keyDown(field, { key: "ArrowUp" });
    expect(setListQuery).toHaveBeenLastCalledWith("list", { limit: 7 }, "Show items");
    expect(screen.queryByRole("combobox", { name: "Show unit" })).toBeNull();
  });

  /* Ldata I2a: the stored binding's limit is bounded (cmsBindingsSchema);
     a bigger number typed here must not produce a binding the save drops. */
  it("the Show field clamps an oversized count to the stored maximum", () => {
    const { composer, setListQuery } = makeComposer({ collectionId: "menu" });
    renderSection(composer);
    fireEvent.change(screen.getByRole("textbox", { name: "Show" }), { target: { value: "999999" } });
    expect(setListQuery).toHaveBeenLastCalledWith("list", { limit: 10_000 }, "Show items");
  });

  it("None unbinds", () => {
    const { composer, unbindCollection } = makeComposer({ collectionId: "menu" });
    renderSection(composer);
    fireEvent.change(screen.getByRole("combobox", { name: "Source" }), { target: { value: "" } });
    expect(unbindCollection).toHaveBeenCalledWith("list");
  });

  it("+ New collection… is offered bound or not, and opens the create door", () => {
    const create = vi.fn();
    renderSection(makeComposer().composer, create);
    fireEvent.click(screen.getByTestId("collection-new"));
    expect(create).toHaveBeenCalled();
  });

  it("2L9 B5-D76 order: Source · + New collection… · Open collection · Filter · + Add filter · Match · Sort · Direction · + Then by · Show · Skip", () => {
    const { container } = renderSection(makeComposer({ collectionId: "menu", limit: 6 }).composer, vi.fn());
    const text = container.textContent ?? "";
    const at = ["Source", "+ New collection…", "Open collection", "Filter", "+ Add filter", "Match", "Sort", "Direction", "+ Then by", "Show", "Skip"].map((t) => text.indexOf(t));
    expect(at.every((i) => i >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("2L9 B5-D79: with three sort keys a band counts them under the first key, and + Then by is gone", () => {
    const sort = [{ field: "_updated", dir: "desc" as const }, { field: "name", dir: "asc" as const }, { field: "_created", dir: "desc" as const }];
    renderSection(makeComposer({ collectionId: "menu", sort }).composer);
    expect(screen.getByTestId("collection-sort-count")).toHaveTextContent("3 sort keys");
    expect(screen.getAllByRole("combobox", { name: "Then by" })).toHaveLength(2);
    expect(screen.queryByTestId("collection-then-by")).toBeNull();
  });

  it("one sort key: no count band", () => {
    renderSection(makeComposer({ collectionId: "menu" }).composer);
    expect(screen.queryByTestId("collection-sort-count")).toBeNull();
  });

  it("Open collection › opens the CMS on the bound collection's table, naming where it came from (C-11)", () => {
    const { composer } = makeComposer({ collectionId: "menu" });
    renderSection(composer);
    fireEvent.click(screen.getByTestId("collection-open"));
    expect(composer.emit).toHaveBeenCalledWith("ui:cms-open", expect.objectContaining({ collectionId: "menu", origin: expect.stringMatching(/ · /) }));
  });

  /* C-14: a filter rule, a sort key and Skip are each one step on the query. */
  it("+ Add filter adds a rule on the first field; Sort / Skip write the query", () => {
    const { composer, setListQuery } = makeComposer({ collectionId: "menu" });
    renderSection(composer);
    fireEvent.click(screen.getByTestId("collection-add-filter"));
    expect(setListQuery).toHaveBeenLastCalledWith("list", { filter: { match: "all", rules: [{ field: "name", op: "set" }] } }, "Add filter");
    fireEvent.change(screen.getByRole("combobox", { name: "Sort" }), { target: { value: "price" } });
    expect(setListQuery).toHaveBeenLastCalledWith("list", { sort: [{ field: "price", dir: "asc" }] }, "Sort list");
    fireEvent.change(screen.getByRole("textbox", { name: "Skip" }), { target: { value: "2" } });
    expect(setListQuery).toHaveBeenLastCalledWith("list", { skip: 2 }, "Skip items");
  });

  it("a stored filter draws its rule card with Remove filter", () => {
    const { composer, setListQuery } = makeComposer({ collectionId: "menu", filter: { match: "all", rules: [{ field: "price", op: "gt", value: "5" }] } } as never);
    renderSection(composer);
    expect(screen.getByRole("combobox", { name: "Filter" })).toHaveDisplayValue("1 rule");
    fireEvent.click(screen.getByRole("button", { name: "Remove filter" }));
    expect(setListQuery).toHaveBeenLastCalledWith("list", { filter: undefined }, "Remove filter");
  });

  it("unbound: no Show, no Open collection", () => {
    renderSection(makeComposer().composer);
    expect(screen.queryByRole("textbox", { name: "Show" })).toBeNull();
    expect(screen.queryByTestId("collection-open")).toBeNull();
  });
});
