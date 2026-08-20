/**
 * The manager re-reads its store after the server hydration writes to it.
 *
 * `initialize()` reads IndexedDB once and latches `initialized`. The server
 * hydration (`cmsSync.hydrateCmsFromServer`) writes collections and entries
 * straight into that store, so on a device that has never opened the site the
 * rows landed in IndexedDB and this manager stayed empty for the whole
 * session: the Content panel showed no collections, the binding popover had
 * nothing to bind, and `hasProductsCollection()` answered false — which offers
 * to create a SECOND Products collection and mirrors the duplicate back.
 * Measured in a fresh browser profile against a site whose Products collection
 * was already on the server.
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

const collection = (id: string, name: string): CMSCollection => ({
  id,
  name,
  slug: name.toLowerCase(),
  fields: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

beforeEach(() => (Storage as MockedStorage).__reset());

describe("CollectionManager.refreshFromStorage", () => {
  it("picks up rows written to the store after initialize", async () => {
    const manager = new CollectionManager();
    await manager.initialize();
    expect(manager.getAllCollections()).toHaveLength(0);

    // What hydrateCmsFromServer does: writes straight to the store.
    await Storage.saveCollection(collection("col-remote", "Products"));
    expect(manager.getAllCollections()).toHaveLength(0);

    await manager.refreshFromStorage();
    expect(manager.getAllCollections().map((c) => c.name)).toEqual(["Products"]);
  });

  it("announces the refresh so open panels reload", async () => {
    const manager = new CollectionManager();
    await manager.initialize();
    const seen: unknown[] = [];
    manager.on(EVENTS.CMS_STORE_REFRESHED, (rows: unknown) => seen.push(rows));

    await Storage.saveCollection(collection("col-remote", "Products"));
    await manager.refreshFromStorage();

    expect(seen).toHaveLength(1);
    expect((seen[0] as CMSCollection[]).map((c) => c.id)).toEqual(["col-remote"]);
  });

  it("does not announce a creation — the mirror would push these back", async () => {
    const manager = new CollectionManager();
    await manager.initialize();
    const created: unknown[] = [];
    manager.on(EVENTS.CMS_COLLECTION_CREATED, (row: unknown) => created.push(row));

    await Storage.saveCollection(collection("col-remote", "Products"));
    await manager.refreshFromStorage();

    expect(created).toHaveLength(0);
  });

  it("works before initialize too — a refresh IS a load", async () => {
    await Storage.saveCollection(collection("col-remote", "Products"));
    const manager = new CollectionManager();
    await manager.refreshFromStorage();
    expect(manager.isReady()).toBe(true);
    expect(manager.getAllCollections()).toHaveLength(1);
  });
});
