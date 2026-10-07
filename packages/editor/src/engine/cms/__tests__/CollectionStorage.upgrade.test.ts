/**
 * DM-06: v1 indexed collections by `slug` UNIQUE across the browser's whole
 * store, so a second site's `products` collection could not be saved or
 * hydrated beside the first site's. v2 replaces it with a per-site index.
 */
import { describe, expect, it } from "vitest";
import { upgradeCmsDatabase, type CmsStoreLike } from "../CollectionStorage";

function fakeStore(indexes: string[]) {
  const names = new Map<string, { keyPath: unknown; unique?: boolean }>(indexes.map((n) => [n, { keyPath: n, unique: n === "slug" }]));
  const store: CmsStoreLike & { names: typeof names } = {
    names,
    indexNames: { contains: (n) => names.has(n) },
    createIndex: (n, keyPath, o) => names.set(n, { keyPath, unique: o?.unique }),
    deleteIndex: (n) => void names.delete(n),
  };
  return store;
}

describe("upgradeCmsDatabase (DM-06)", () => {
  it("from v1: drops the browser-wide unique slug index, adds [siteId, slug]", () => {
    const collections = fakeStore(["slug", "updatedAt"]);
    const content = fakeStore(["collectionId", "status", "updatedAt"]);
    const stores: Record<string, CmsStoreLike> = { collections, content };
    upgradeCmsDatabase(
      { objectStoreNames: { contains: (n) => n in stores }, createObjectStore: () => fakeStore([]) },
      { objectStore: (n) => stores[n] },
    );
    expect(collections.names.has("slug")).toBe(false);
    expect(collections.names.get("siteSlug")).toEqual({ keyPath: ["siteId", "slug"], unique: false });
  });

  it("fresh: creates both stores with the per-site index", () => {
    const created: Record<string, ReturnType<typeof fakeStore>> = {};
    upgradeCmsDatabase(
      {
        objectStoreNames: { contains: (n) => n in created },
        createObjectStore: (n) => (created[n] = fakeStore([])),
      },
      null,
    );
    expect([...created.collections.names.keys()].sort()).toEqual(["siteSlug", "updatedAt"]);
    expect(created.collections.names.has("slug")).toBe(false);
    expect([...created.content.names.keys()].sort()).toEqual(["collectionId", "status", "updatedAt"]);
  });
});
