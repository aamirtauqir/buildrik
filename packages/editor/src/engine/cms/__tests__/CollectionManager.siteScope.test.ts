/**
 * CMS collections belong to ONE site.
 *
 * They did not. `CollectionManager` and `CollectionStorage` carried no site,
 * and `useComposerInit` scoped only `versions` and `components` — so every site
 * opened in the same browser shared one Content panel. Identical shape to the
 * media-library bleed proved live the same day; recorded here rather than left
 * as "probably the same".
 *
 * Rows written before scoping stay visible, for the same reason as media: a
 * collection may exist only on this device, and hiding it would take away data
 * the user cannot recover.
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
import type { CMSCollection } from "@/shared/types/cms";

type MockedStorage = typeof Storage & { __reset: () => void };

const collection = (id: string, siteId?: string): CMSCollection => ({
  id,
  name: id,
  slug: id,
  fields: [],
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
  ...(siteId ? { siteId } : {}),
});

describe("CollectionManager — collections belong to one site", () => {
  beforeEach(() => {
    (Storage as MockedStorage).__reset();
    vi.clearAllMocks();
  });

  it("hides another site's collections once scoped", async () => {
    await Storage.saveCollection(collection("posts", "site-A"));
    await Storage.saveCollection(collection("products", "site-B"));
    const cms = new CollectionManager();
    await cms.setProjectId("site-B");
    await cms.initialize();
    expect(cms.getAllCollections().map((c) => c.id)).toEqual(["products"]);
  });

  it("leaves a brand-new site empty rather than showing the last one's collections", async () => {
    await Storage.saveCollection(collection("posts", "site-A"));
    const cms = new CollectionManager();
    await cms.setProjectId("site-NEW");
    await cms.initialize();
    expect(cms.getAllCollections()).toEqual([]);
  });

  it("keeps collections that predate scoping visible", async () => {
    await Storage.saveCollection(collection("legacy"));
    await Storage.saveCollection(collection("products", "site-B"));
    const cms = new CollectionManager();
    await cms.setProjectId("site-B");
    await cms.initialize();
    expect(cms.getAllCollections().map((c) => c.id).sort()).toEqual(["legacy", "products"]);
  });

  it("shows everything when there is no site — the standalone demo", async () => {
    await Storage.saveCollection(collection("posts", "site-A"));
    await Storage.saveCollection(collection("legacy"));
    const cms = new CollectionManager();
    await cms.initialize();
    expect(cms.getAllCollections()).toHaveLength(2);
  });

  /* `refreshFromStorage` is the path the server hydration uses — it re-reads
     after writing straight into the store, so it has to filter too, or the
     bleed comes back through the door the manager does not own. */
  it("filters on the refresh the server hydration triggers", async () => {
    const cms = new CollectionManager();
    await cms.setProjectId("site-B");
    await cms.initialize();
    await Storage.saveCollection(collection("posts", "site-A"));
    await Storage.saveCollection(collection("products", "site-B"));
    await cms.refreshFromStorage();
    expect(cms.getAllCollections().map((c) => c.id)).toEqual(["products"]);
  });
});
