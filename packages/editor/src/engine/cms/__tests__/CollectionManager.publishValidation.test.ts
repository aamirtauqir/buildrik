/**
 * Publishing a record runs the collection's own validation rules.
 *
 * `validateContent` was written alongside the field schemas and then called by
 * nothing, so the "required" tag in the Content panel and the ecommerce setup
 * modal's "Validation rules included" both described checks that never ran — a
 * Product could go live with no Name, no Price and negative Inventory. Drafts
 * stay free-form; an unfinished record is what a draft is for.
 *
 * Walked live: publishing an empty required field is refused in the Content
 * panel (message under the field, record stays draft) and in the CMS records
 * modal (message on the row), and the same record publishes once filled.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CollectionManager, CMSValidationError } from "../CollectionManager";
import * as Storage from "../CollectionStorage";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

type MockedStorage = typeof Storage & { __reset: () => void };

beforeEach(() => {
  (Storage as MockedStorage).__reset();
});

async function seed() {
  const manager = new CollectionManager();
  await manager.initialize();
  const collection = await manager.createCollection("Products", "products");
  await manager.addField(collection.id, {
    name: "Name",
    slug: "name",
    type: "text",
    order: 0,
    validation: { required: true, minLength: 3 },
  });
  await manager.addField(collection.id, {
    name: "Price",
    slug: "price",
    type: "number",
    order: 1,
    validation: { required: true, min: 0 },
  });
  return { manager, collection };
}

describe("publishing a record", () => {
  it("is refused when a required field is empty, and the record stays a draft", async () => {
    const { manager, collection } = await seed();
    const item = await manager.createContentItem(collection.id, { name: "", price: 10 });

    await expect(
      manager.updateContentItem(item!.id, { status: "published" })
    ).rejects.toBeInstanceOf(CMSValidationError);
    expect((await manager.getContentItem(item!.id))?.status).toBe("draft");
  });

  it("names every offending field, not just the first", async () => {
    const { manager, collection } = await seed();
    const item = await manager.createContentItem(collection.id, { name: "ab", price: -1 });

    const err = await manager
      .updateContentItem(item!.id, { status: "published" })
      .catch((e: unknown) => e as CMSValidationError);

    expect(Object.keys((err as CMSValidationError).errors).sort()).toEqual(["name", "price"]);
  });

  it("lets an incomplete DRAFT through — that is what a draft is", async () => {
    const { manager, collection } = await seed();
    const item = await manager.createContentItem(collection.id, {});
    await expect(
      manager.updateContentItem(item!.id, { data: { name: "" } })
    ).resolves.toMatchObject({ status: "draft" });
  });

  it("publishes once the values satisfy the rules", async () => {
    const { manager, collection } = await seed();
    const item = await manager.createContentItem(collection.id, {});
    const saved = await manager.updateContentItem(item!.id, {
      data: { name: "Espresso", price: 12 },
      status: "published",
    });
    expect(saved?.status).toBe("published");
    expect(saved?.publishedAt).toBeTruthy();
  });

  it("re-validates an EDIT to an already-published record", async () => {
    const { manager, collection } = await seed();
    const item = await manager.createContentItem(collection.id, {});
    await manager.updateContentItem(item!.id, { data: { name: "Espresso", price: 12 }, status: "published" });

    await expect(
      manager.updateContentItem(item!.id, { data: { name: "", price: 12 } })
    ).rejects.toBeInstanceOf(CMSValidationError);
    expect((await manager.getContentItem(item!.id))?.data.name).toBe("Espresso");
  });
});
