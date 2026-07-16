/**
 * ProductCollectionService tests — Products collection auto-creation with
 * schema fields + optional sample data (CollectionSetupModal flow).
 *
 * Uses the REAL CollectionManager on top of an in-memory CollectionStorage
 * mock (jsdom has no indexedDB), so the service is exercised against the
 * genuine manager semantics (field id regeneration, draft status, etc.).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProductCollectionService } from "../ProductCollectionService";
import { CollectionManager } from "../CollectionManager";
import * as Storage from "../CollectionStorage";
import { PRODUCT_COLLECTION_SCHEMA, SAMPLE_PRODUCTS } from "@/shared/types/ecommerce";

vi.mock("../CollectionStorage", async () => {
  const { createInMemoryCollectionStorage } = await import("./inMemoryCollectionStorage");
  return createInMemoryCollectionStorage();
});

type MockedStorage = typeof Storage & { __reset: () => void };

function makeService() {
  const manager = new CollectionManager();
  return { manager, service: new ProductCollectionService(manager) };
}

beforeEach(() => {
  (Storage as MockedStorage).__reset();
});

describe("ProductCollectionService", () => {
  describe("lookups before creation", () => {
    it("reports no Products collection on a fresh store", async () => {
      const { service } = makeService();
      await expect(service.hasProductsCollection()).resolves.toBe(false);
      await expect(service.getProductsCollectionId()).resolves.toBeNull();
      await expect(service.getProductsCollection()).resolves.toBeNull();
    });

    it("does not treat other collections as Products", async () => {
      const { manager, service } = makeService();
      await manager.createCollection("Blog Posts", "posts");
      await expect(service.hasProductsCollection()).resolves.toBe(false);
    });
  });

  describe("createProductsCollection", () => {
    it("creates the collection from PRODUCT_COLLECTION_SCHEMA without sample data", async () => {
      const { manager, service } = makeService();
      const collection = await service.createProductsCollection(false);

      expect(collection.name).toBe("Products");
      expect(collection.slug).toBe("products");
      expect(collection.description).toBe(PRODUCT_COLLECTION_SCHEMA.description);
      expect(collection.displayField).toBe("name");
      expect(collection.icon).toBe("shopping-bag");

      // All 8 schema fields present, same slugs, same order.
      expect(collection.fields.map((f) => f.slug)).toEqual(
        PRODUCT_COLLECTION_SCHEMA.fields.map((f) => f.slug)
      );
      expect(collection.fields.map((f) => f.order)).toEqual(
        PRODUCT_COLLECTION_SCHEMA.fields.map((f) => f.order)
      );
      // Validation rules survive the field mapping.
      const price = collection.fields.find((f) => f.slug === "price")!;
      expect(price.type).toBe("number");
      expect(price.validation).toEqual({ required: true, min: 0 });

      // No sample content items.
      const items = await manager.getContentItems(collection.id);
      expect(items).toHaveLength(0);
    });

    it("regenerates field ids via the manager (schema ids are not reused)", async () => {
      const { service } = makeService();
      const collection = await service.createProductsCollection(false);
      const schemaIds = PRODUCT_COLLECTION_SCHEMA.fields.map((f) => f.id);
      for (const field of collection.fields) {
        expect(schemaIds).not.toContain(field.id);
      }
    });

    it("seeds the 3 sample products as draft items when requested", async () => {
      const { manager, service } = makeService();
      const collection = await service.createProductsCollection(true);

      const items = await manager.getContentItems(collection.id);
      expect(items).toHaveLength(SAMPLE_PRODUCTS.length);

      const names = items.map((i) => i.data.name);
      for (const product of SAMPLE_PRODUCTS) {
        expect(names).toContain(product.name);
      }
      // createContentItem always starts items as drafts — sample products are
      // NOT published, so published-only repeaters render empty until the
      // user publishes them.
      expect(items.every((i) => i.status === "draft")).toBe(true);

      const headphones = items.find((i) => i.data.name === "Premium Wireless Headphones")!;
      expect(headphones.data.price).toBe(199.99);
      expect(headphones.data.sku).toBe("ELEC-001");
    });

    it("makes the collection discoverable via the lookup helpers", async () => {
      const { service } = makeService();
      const collection = await service.createProductsCollection(false);

      await expect(service.hasProductsCollection()).resolves.toBe(true);
      await expect(service.getProductsCollectionId()).resolves.toBe(collection.id);
      const found = await service.getProductsCollection();
      expect(found?.id).toBe(collection.id);
      expect(found?.fields).toHaveLength(8);
    });
  });

  describe("ensureProductsCollection", () => {
    it("returns the existing id without prompting when the collection exists", async () => {
      const { service } = makeService();
      const collection = await service.createProductsCollection(false);

      const onPrompt = vi.fn();
      await expect(service.ensureProductsCollection(onPrompt)).resolves.toBe(collection.id);
      expect(onPrompt).not.toHaveBeenCalled();
    });

    it("prompts when missing and resolves with the new id once the callback runs", async () => {
      const { service } = makeService();

      let createCallback: ((includeSampleData: boolean) => Promise<void>) | undefined;
      const pending = service.ensureProductsCollection((cb) => {
        createCallback = cb;
      });

      // Give the async lookup a chance to run and invoke the prompt.
      await vi.waitFor(() => expect(createCallback).toBeDefined());

      await createCallback!(true);
      const id = await pending;

      expect(id).not.toBeNull();
      await expect(service.getProductsCollectionId()).resolves.toBe(id);
      await expect(service.hasProductsCollection()).resolves.toBe(true);
    });
  });
});
