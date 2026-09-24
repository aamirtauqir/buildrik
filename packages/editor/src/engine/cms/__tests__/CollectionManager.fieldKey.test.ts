/**
 * Renaming a field's key (the Fields inspector's Key, 6103:52202) moves the
 * records' values with it and follows into the URL pattern and display field.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

import * as Storage from "../CollectionStorage";
import { CollectionManager } from "../CollectionManager";

type MockedStorage = typeof Storage & { __reset: () => void };

async function setup() {
  const cms = new CollectionManager();
  await cms.initialize();
  const col = await cms.createCollection("Menu items");
  await cms.addField(col.id, { name: "Name", slug: "name", type: "text", order: 0 });
  await cms.addField(col.id, { name: "Price", slug: "price", type: "number", order: 1 });
  await cms.updateCollection(col.id, { pageSlugPattern: "/menu/{name}", displayField: "name" });
  await cms.createContentItem(col.id, { name: "Margherita", price: 12 });
  await cms.createContentItem(col.id, { price: 9 });
  return { cms, col };
}

describe("CollectionManager.updateField — key rename", () => {
  beforeEach(() => (Storage as MockedStorage).__reset());

  it("moves each record's value to the new key", async () => {
    const { cms, col } = await setup();
    const nameId = cms.getCollection(col.id)!.fields.find((f) => f.slug === "name")!.id;
    await cms.updateField(col.id, nameId, { slug: "title" });
    const items = await cms.getContentItems(col.id);
    expect(items.map((i) => i.data)).toEqual(expect.arrayContaining([{ title: "Margherita", price: 12 }, { price: 9 }]));
    const after = cms.getCollection(col.id)!;
    expect(after.pageSlugPattern).toBe("/menu/{title}");
    expect(after.displayField).toBe("title");
  });

  it("leaves records alone when the key does not change", async () => {
    const { cms, col } = await setup();
    const priceId = cms.getCollection(col.id)!.fields.find((f) => f.slug === "price")!.id;
    await cms.updateField(col.id, priceId, { name: "Cost" });
    const items = await cms.getContentItems(col.id);
    expect(items.map((i) => i.data)).toEqual(expect.arrayContaining([{ name: "Margherita", price: 12 }]));
  });
});
