/**
 * CollectionManager tests — collection/field/content CRUD, querying,
 * validation and cache behavior, on top of an in-memory CollectionStorage
 * mock (jsdom has no indexedDB).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CollectionManager } from "../CollectionManager";
import * as Storage from "../CollectionStorage";
import { EVENTS } from "@/shared/constants/events";
import type { CMSCollection } from "@/shared/types/cms";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

type MockedStorage = typeof Storage & { __reset: () => void };

beforeEach(() => {
  (Storage as MockedStorage).__reset();
  vi.mocked(Storage.loadContentItems).mockClear();
});

describe("CollectionManager", () => {
  describe("initialization", () => {
    it("loads persisted collections on initialize", async () => {
      const persisted: CMSCollection = {
        id: "col-1",
        name: "Posts",
        slug: "posts",
        fields: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };
      await Storage.saveCollection(persisted);

      const manager = new CollectionManager();
      expect(manager.isReady()).toBe(false);
      await manager.initialize();
      expect(manager.isReady()).toBe(true);
      expect(manager.getCollection("col-1")?.slug).toBe("posts");
    });

    it("lazily initializes on first write operation", async () => {
      const manager = new CollectionManager();
      await manager.createCollection("Team");
      expect(manager.isReady()).toBe(true);
    });
  });

  describe("collection CRUD", () => {
    it("creates a collection, slugifying the name when no slug is given", async () => {
      const manager = new CollectionManager();
      const created = vi.fn();
      manager.on(EVENTS.CMS_COLLECTION_CREATED, created);

      const collection = await manager.createCollection("My Blog Posts!");
      expect(collection.slug).toBe("my-blog-posts");
      expect(collection.fields).toEqual([]);
      expect(created).toHaveBeenCalledWith(collection);
      // Persisted, not just cached.
      await expect(Storage.loadCollection(collection.id)).resolves.toMatchObject({
        slug: "my-blog-posts",
      });
    });

    it("honors an explicit slug and description", async () => {
      const manager = new CollectionManager();
      const collection = await manager.createCollection("Products", "products", "catalog");
      expect(collection.slug).toBe("products");
      expect(collection.description).toBe("catalog");
    });

    it("updates a collection and returns null for unknown ids", async () => {
      const manager = new CollectionManager();
      const collection = await manager.createCollection("Posts");

      const updated = await manager.updateCollection(collection.id, { icon: "file-text" });
      expect(updated?.icon).toBe("file-text");
      expect(updated?.name).toBe("Posts");
      expect(manager.getCollection(collection.id)?.icon).toBe("file-text");

      await expect(manager.updateCollection("nope", { icon: "x" })).resolves.toBeNull();
    });

    it("deletes a collection and reports missing ones", async () => {
      const manager = new CollectionManager();
      const collection = await manager.createCollection("Posts");

      await expect(manager.deleteCollection(collection.id)).resolves.toBe(true);
      expect(manager.getCollection(collection.id)).toBeNull();
      await expect(manager.deleteCollection(collection.id)).resolves.toBe(false);
    });

    it("looks up by slug and lists all collections sorted by name", async () => {
      const manager = new CollectionManager();
      await manager.createCollection("Zebra");
      const apple = await manager.createCollection("Apple");

      expect(manager.getCollectionBySlug("apple")?.id).toBe(apple.id);
      expect(manager.getCollectionBySlug("missing")).toBeNull();
      expect(manager.getAllCollections().map((c) => c.name)).toEqual(["Apple", "Zebra"]);
    });
  });

  describe("field operations", () => {
    async function setup() {
      const manager = new CollectionManager();
      const collection = await manager.createCollection("Posts");
      return { manager, collection };
    }

    it("adds a field with a generated id", async () => {
      const { manager, collection } = await setup();
      const field = await manager.addField(collection.id, {
        name: "Title",
        slug: "title",
        type: "text",
        order: 0,
      });

      expect(field?.id).toBeTruthy();
      expect(manager.getCollection(collection.id)?.fields).toHaveLength(1);
      await expect(manager.addField("nope", { name: "x", slug: "x", type: "text", order: 0 }))
        .resolves.toBeNull();
    });

    it("updates and deletes fields, failing gracefully on unknown ids", async () => {
      const { manager, collection } = await setup();
      const field = (await manager.addField(collection.id, {
        name: "Title",
        slug: "title",
        type: "text",
        order: 0,
      }))!;

      const updated = await manager.updateField(collection.id, field.id, { name: "Headline" });
      expect(updated?.name).toBe("Headline");
      await expect(manager.updateField(collection.id, "nope", { name: "x" })).resolves.toBeNull();

      await expect(manager.deleteField(collection.id, field.id)).resolves.toBe(true);
      expect(manager.getCollection(collection.id)?.fields).toHaveLength(0);
      await expect(manager.deleteField(collection.id, field.id)).resolves.toBe(false);
    });

    it("reorders fields and rewrites their order values", async () => {
      const { manager, collection } = await setup();
      const a = (await manager.addField(collection.id, { name: "A", slug: "a", type: "text", order: 0 }))!;
      const b = (await manager.addField(collection.id, { name: "B", slug: "b", type: "text", order: 1 }))!;

      await expect(manager.reorderFields(collection.id, [b.id, a.id])).resolves.toBe(true);
      const fields = manager.getCollection(collection.id)!.fields;
      expect(fields.map((f) => f.slug)).toEqual(["b", "a"]);
      expect(fields.map((f) => f.order)).toEqual([0, 1]);

      // Incomplete id list must not partially reorder.
      await expect(manager.reorderFields(collection.id, [a.id])).resolves.toBe(false);
    });
  });

  describe("content operations", () => {
    async function setup() {
      const manager = new CollectionManager();
      const collection = await manager.createCollection("Posts");
      return { manager, collection };
    }

    it("creates draft items and rejects unknown collections", async () => {
      const { manager, collection } = await setup();
      const item = await manager.createContentItem(collection.id, { title: "Hello" });

      expect(item?.status).toBe("draft");
      expect(item?.data.title).toBe("Hello");
      await expect(manager.getContentItem(item!.id)).resolves.toMatchObject({
        collectionId: collection.id,
      });
      await expect(manager.createContentItem("nope", {})).resolves.toBeNull();
    });

    it("publishes items: stamps publishedAt and emits content:published", async () => {
      const { manager, collection } = await setup();
      const item = (await manager.createContentItem(collection.id, { title: "Hi" }))!;
      const published = vi.fn();
      const updated = vi.fn();
      manager.on(EVENTS.CMS_CONTENT_PUBLISHED, published);
      manager.on(EVENTS.CMS_CONTENT_UPDATED, updated);

      const result = await manager.updateContentItem(item.id, { status: "published" });
      expect(result?.publishedAt).toBe(result?.updatedAt);
      expect(published).toHaveBeenCalledTimes(1);
      expect(updated).not.toHaveBeenCalled();
    });

    it("emits content:unpublished when a published item is reverted", async () => {
      const { manager, collection } = await setup();
      const item = (await manager.createContentItem(collection.id, {}))!;
      await manager.updateContentItem(item.id, { status: "published" });

      const unpublished = vi.fn();
      manager.on(EVENTS.CMS_CONTENT_UNPUBLISHED, unpublished);
      await manager.updateContentItem(item.id, { status: "draft" });
      expect(unpublished).toHaveBeenCalledTimes(1);
    });

    it("emits content:updated for plain data edits and returns null for unknown items", async () => {
      const { manager, collection } = await setup();
      const item = (await manager.createContentItem(collection.id, { title: "a" }))!;
      const updated = vi.fn();
      manager.on(EVENTS.CMS_CONTENT_UPDATED, updated);

      const result = await manager.updateContentItem(item.id, { data: { title: "b" } });
      expect(result?.data.title).toBe("b");
      expect(updated).toHaveBeenCalledTimes(1);
      await expect(manager.updateContentItem("nope", { data: {} })).resolves.toBeNull();
    });

    it("deletes items and reports missing ones", async () => {
      const { manager, collection } = await setup();
      const item = (await manager.createContentItem(collection.id, {}))!;

      await expect(manager.deleteContentItem(item.id)).resolves.toBe(true);
      await expect(manager.getContentItem(item.id)).resolves.toBeNull();
      await expect(manager.deleteContentItem(item.id)).resolves.toBe(false);
    });

    it("caches getContentItems reads and invalidates on writes", async () => {
      const { manager, collection } = await setup();
      await manager.createContentItem(collection.id, { title: "one" });

      vi.mocked(Storage.loadContentItems).mockClear();
      await manager.getContentItems(collection.id);
      await manager.getContentItems(collection.id);
      expect(Storage.loadContentItems).toHaveBeenCalledTimes(1);

      await manager.createContentItem(collection.id, { title: "two" });
      const items = await manager.getContentItems(collection.id);
      expect(items).toHaveLength(2);
      expect(Storage.loadContentItems).toHaveBeenCalledTimes(2);
    });
  });

  describe("queryContent", () => {
    async function seed() {
      const manager = new CollectionManager();
      const collection = await manager.createCollection("Posts");
      const a = (await manager.createContentItem(collection.id, { title: "Alpha", tag: "x" }))!;
      const b = (await manager.createContentItem(collection.id, { title: "Beta", tag: "y" }))!;
      const c = (await manager.createContentItem(collection.id, { title: "Gamma", tag: "x" }))!;
      return { manager, collection, a, b, c };
    }

    it("filters by status", async () => {
      const { manager, collection, a } = await seed();
      await manager.updateContentItem(a.id, { status: "published" });

      const published = await manager.queryContent({
        collectionId: collection.id,
        status: "published",
      });
      expect(published.items.map((i) => i.id)).toEqual([a.id]);
      expect(published.total).toBe(1);

      const drafts = await manager.queryContent({
        collectionId: collection.id,
        status: "draft",
      });
      expect(drafts.total).toBe(2);
    });

    it("applies exact-match data filters", async () => {
      const { manager, collection } = await seed();
      const result = await manager.queryContent({
        collectionId: collection.id,
        filter: { tag: "x" },
      });
      expect(result.total).toBe(2);
      expect(result.items.every((i) => i.data.tag === "x")).toBe(true);
    });

    it("sorts by a data field in both directions", async () => {
      const { manager, collection } = await seed();

      const asc = await manager.queryContent({
        collectionId: collection.id,
        sort: { field: "title", direction: "asc" },
      });
      expect(asc.items.map((i) => i.data.title)).toEqual(["Alpha", "Beta", "Gamma"]);

      const desc = await manager.queryContent({
        collectionId: collection.id,
        sort: { field: "title", direction: "desc" },
      });
      expect(desc.items.map((i) => i.data.title)).toEqual(["Gamma", "Beta", "Alpha"]);
    });

    it("paginates with limit/offset and reports total + hasMore", async () => {
      const { manager, collection } = await seed();

      const page1 = await manager.queryContent({ collectionId: collection.id, limit: 2 });
      expect(page1.items).toHaveLength(2);
      expect(page1.total).toBe(3);
      expect(page1.hasMore).toBe(true);

      const page2 = await manager.queryContent({
        collectionId: collection.id,
        limit: 2,
        offset: 2,
      });
      expect(page2.items).toHaveLength(1);
      expect(page2.hasMore).toBe(false);
    });

    it("returns an empty result for a collection with no items", async () => {
      const manager = new CollectionManager();
      const collection = await manager.createCollection("Empty");
      await expect(manager.queryContent({ collectionId: collection.id })).resolves.toEqual({
        items: [],
        total: 0,
        hasMore: false,
      });
    });
  });

  describe("validateContent", () => {
    it("validates against field rules and flags unknown collections", async () => {
      const manager = new CollectionManager();
      const collection = await manager.createCollection("Posts");
      await manager.addField(collection.id, {
        name: "Title",
        slug: "title",
        type: "text",
        order: 0,
        validation: { required: true, minLength: 3 },
      });

      expect(manager.validateContent(collection.id, { title: "Hello" })).toEqual({
        valid: true,
        errors: {},
      });

      const missing = manager.validateContent(collection.id, {});
      expect(missing.valid).toBe(false);
      expect(missing.errors.title).toBe("Title is required");

      const tooShort = manager.validateContent(collection.id, { title: "ab" });
      expect(tooShort.valid).toBe(false);
      expect(tooShort.errors.title).toContain("at least 3");

      const unknown = manager.validateContent("nope", {});
      expect(unknown.valid).toBe(false);
      expect(unknown.errors._collection).toBe("Collection not found");
    });
  });
});
