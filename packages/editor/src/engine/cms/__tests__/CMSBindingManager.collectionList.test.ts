/**
 * G3-079 — bindCollectionList: a `repeat: "children"` binding, and the
 * starter `{{item.<field>}}` placeholders that name no field of the chosen
 * collection are pointed at fields it has (display field first).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CMSBindingManager } from "../CMSBindingManager";
import { CollectionManager } from "../CollectionManager";
import * as Storage from "../CollectionStorage";
import type { Composer } from "@/engine/Composer";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

function node(content: string) {
  const el = { content, getContent: () => el.content, setContent: vi.fn((c: string) => { el.content = c; }) };
  return el;
}

async function setup(contents: string[]) {
  const cms = new CollectionManager();
  const kids = contents.map(node);
  const list = { getDescendants: () => kids };
  const composer = {
    data: { on: vi.fn(), off: vi.fn() },
    markDirty: vi.fn(),
    emit: vi.fn(),
    elements: { getElement: (id: string) => (id === "list" ? list : null) },
  } as unknown as Composer;
  const bindings = new CMSBindingManager(composer, cms);
  const menu = await cms.createCollection("Menu items");
  await cms.addField(menu.id, { name: "Dish", slug: "dish", type: "text", order: 0 });
  await cms.addField(menu.id, { name: "Photo", slug: "photo", type: "image", order: 1 });
  await cms.addField(menu.id, { name: "Price", slug: "price", type: "text", order: 2 });
  await cms.updateCollection(menu.id, { displayField: "dish" });
  return { bindings, kids, menuId: menu.id };
}

beforeEach(() => (Storage as typeof Storage & { __reset: () => void }).__reset());

describe("CMSBindingManager.bindCollectionList", () => {
  it("binds the list to repeat its children, with the limit", async () => {
    const { bindings, menuId } = await setup([]);
    bindings.bindCollectionList("list", menuId, { limit: 3 });
    expect(bindings.getCollectionBinding("list")).toMatchObject({ collectionId: menuId, repeat: "children", limit: 3 });
  });

  it("points unknown starter placeholders at the display field, then the next text field", async () => {
    const { bindings, kids, menuId } = await setup(["{{item.name}}", "{{item.description}}", "Static copy"]);
    bindings.bindCollectionList("list", menuId);
    expect(kids.map((k) => k.content)).toEqual(["{{item.dish}}", "{{item.price}}", "Static copy"]);
  });

  it("leaves placeholders that already name a field of the collection", async () => {
    const { bindings, kids, menuId } = await setup(["{{item.price}}", "{{item.name}}"]);
    bindings.bindCollectionList("list", menuId);
    expect(kids.map((k) => k.content)).toEqual(["{{item.price}}", "{{item.dish}}"]);
    expect(kids[0].setContent).not.toHaveBeenCalled();
  });
});
