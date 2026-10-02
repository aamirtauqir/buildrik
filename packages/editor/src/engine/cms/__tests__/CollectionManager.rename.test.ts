/**
 * Field-key rename must move every record's value to the new key — and must
 * announce it. Before this landed, the rename was client-only: the engine's
 * own records changed shape, but the server mirror kept the old key. A row
 * edited on another device and mirrored back would then smash the local
 * rewrite, because the local copy and the server's were no longer talking
 * about the same shape.
 *
 * Order matters: per-record emits must precede the collection update, so the
 * server sees records under the new key before the collection that names the
 * pattern arrives. useCmsSync subscribes to both, and the per-record handler
 * runs ahead of the collection one.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CollectionManager } from "../CollectionManager";
import * as Storage from "../CollectionStorage";
import { EVENTS } from "../../../shared/constants/events";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

type MockedStorage = typeof Storage & { __reset: () => void };
beforeEach(() => {
  (Storage as MockedStorage).__reset();
});

describe("updateField key rename", () => {
  it("emits a content update per migrated record, before the collection update", async () => {
    const cm = new CollectionManager();
    await cm.initialize();
    const col = await cm.createCollection("Blog", "blog");
    const field = await cm.addField(col.id, { name: "Title", slug: "title", type: "text", order: 0 });
    if (!field) throw new Error("seed: addField returned null");
    const item = await cm.createContentItem(col.id, { title: "Hello" });
    if (!item) throw new Error("seed: createContentItem returned null");

    const order: string[] = [];
    cm.on(EVENTS.CMS_CONTENT_UPDATED, (i: { id: string; data: Record<string, unknown>; updatedAt: string }) => {
      order.push(`entry:${i.id}`);
      expect(i.data).toEqual({ name: "Hello" });
      expect(i.updatedAt).not.toBe(item.updatedAt);
    });
    cm.on(EVENTS.CMS_COLLECTION_UPDATED, () => order.push("collection"));

    await cm.updateField(col.id, field.id, { slug: "name" });

    expect(order).toEqual([`entry:${item.id}`, "collection"]);
  });

  it("does not emit for records that never had the old key", async () => {
    const cm = new CollectionManager();
    await cm.initialize();
    const col = await cm.createCollection("Blog", "blog");
    const field = await cm.addField(col.id, { name: "Title", slug: "title", type: "text", order: 0 });
    if (!field) throw new Error("seed: addField returned null");
    // One record has the field, the other was created before it was added and
    // never picked it up — only the former should announce a rename.
    const skip = await cm.createContentItem(col.id, {});
    const migrate = await cm.createContentItem(col.id, { title: "Migrate" });
    if (!skip || !migrate) throw new Error("seed: createContentItem returned null");

    const seen: string[] = [];
    cm.on(EVENTS.CMS_CONTENT_UPDATED, (i: { id: string }) => seen.push(i.id));
    await cm.updateField(col.id, field.id, { slug: "name" });

    expect(seen).toEqual([migrate.id]);
  });
});
