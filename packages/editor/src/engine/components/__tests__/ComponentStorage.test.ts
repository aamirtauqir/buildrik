/**
 * ComponentStorage — IndexedDB CRUD, project scoping, export/import, stats.
 *
 * jsdom ships no `indexedDB`, so every test runs against the shared in-memory
 * fake (engine/storage/__tests__/fakeIndexedDB), mirroring the
 * VersionHistoryStorage suite. ComponentStorage caches its DB connection in a
 * module-level `dbPromise`, so each test re-imports a fresh module via
 * vi.resetModules() to bind to the freshly-stubbed global.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ComponentDefinition } from "../../../shared/types/components";
import type { ElementData } from "../../../shared/types";
import {
  installFakeIndexedDB,
  type FakeIndexedDBEnv,
} from "../../storage/__tests__/fakeIndexedDB";

const DB_NAME = "aquibra-components";
const STORE_NAME = "components";

type StorageModule = typeof import("../ComponentStorage");

let env: FakeIndexedDBEnv;
let storage: StorageModule;

function makeComponent(overrides: Partial<ComponentDefinition> = {}): ComponentDefinition {
  return {
    id: "c-1",
    name: "Card",
    masterTree: { id: "root", type: "container" } as ElementData,
    createdAt: 1_000,
    updatedAt: 1_000,
    version: 1,
    ...overrides,
  };
}

beforeEach(async () => {
  env = installFakeIndexedDB();
  vi.resetModules();
  storage = await import("../ComponentStorage");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("isStorageAvailable", () => {
  it("is true with an indexedDB global, false without", () => {
    expect(storage.isStorageAvailable()).toBe(true);
    vi.stubGlobal("indexedDB", undefined);
    expect(storage.isStorageAvailable()).toBe(false);
  });
});

describe("saveComponent / loadComponents / loadComponent", () => {
  it("round-trips a component and creates the store with a projectId index", async () => {
    await storage.saveComponent(makeComponent(), "proj-a");

    const loaded = await storage.loadComponents("proj-a");
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe("c-1");
    expect(loaded[0].masterTree.id).toBe("root");
    expect(env.getRecords(DB_NAME, STORE_NAME)?.size).toBe(1);
  });

  it("scopes loads by projectId; defaults to 'default'", async () => {
    await storage.saveComponent(makeComponent({ id: "a" }), "proj-a");
    await storage.saveComponent(makeComponent({ id: "b" }), "proj-b");
    await storage.saveComponent(makeComponent({ id: "d" })); // default project

    expect((await storage.loadComponents("proj-a")).map((c) => c.id)).toEqual(["a"]);
    expect((await storage.loadComponents("proj-b")).map((c) => c.id)).toEqual(["b"]);
    expect((await storage.loadComponents()).map((c) => c.id)).toEqual(["d"]);
    expect(await storage.loadComponents("ghost")).toEqual([]);
  });

  it("saving the same id overwrites (put semantics)", async () => {
    await storage.saveComponent(makeComponent({ name: "v1" }), "p");
    await storage.saveComponent(makeComponent({ name: "v2" }), "p");

    const loaded = await storage.loadComponents("p");
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe("v2");
  });

  it("loadComponent fetches one by id, null when missing", async () => {
    await storage.saveComponent(makeComponent(), "p");
    expect((await storage.loadComponent("c-1"))?.name).toBe("Card");
    expect(await storage.loadComponent("ghost")).toBeNull();
  });
});

describe("deleteComponent", () => {
  it("deleteComponent removes exactly that record", async () => {
    await storage.saveComponent(makeComponent({ id: "a" }), "p");
    await storage.saveComponent(makeComponent({ id: "b" }), "p");

    await storage.deleteComponent("a");

    expect((await storage.loadComponents("p")).map((c) => c.id)).toEqual(["b"]);
  });

});

describe("getStorageStats", () => {
  it("zero state: count 0 and null dates", async () => {
    expect(await storage.getStorageStats("p")).toEqual({
      count: 0,
      oldestDate: null,
      newestDate: null,
    });
  });

  it("reports count and oldest/newest createdAt as Dates", async () => {
    await storage.saveComponent(makeComponent({ id: "a", createdAt: 1_000 }), "p");
    await storage.saveComponent(makeComponent({ id: "b", createdAt: 9_000 }), "p");

    const stats = await storage.getStorageStats("p");
    expect(stats.count).toBe(2);
    expect(stats.oldestDate).toEqual(new Date(1_000));
    expect(stats.newestDate).toEqual(new Date(9_000));
  });
});

describe("open failure", () => {
  it("rejects with a friendly error when the database cannot open", async () => {
    env.openError = new DOMException("nope", "UnknownError");
    await expect(storage.saveComponent(makeComponent(), "p")).rejects.toThrow(
      "Failed to open components database"
    );
  });

  // A failed open resets the cached dbPromise, so a later call retries the
  // open and succeeds once IndexedDB recovers.
  it("a failed open is not cached — a later call retries the open and succeeds", async () => {
    env.openError = new DOMException("nope", "UnknownError");
    await expect(storage.loadComponents("p")).rejects.toThrow();

    env.openError = null; // IDB "recovers"
    await expect(storage.loadComponents("p")).resolves.toEqual([]);
    expect(env.openCalls).toHaveLength(2); // retried after the failure
  });

  it("recovers fully after a transient open failure — save/load round-trips on retry", async () => {
    env.openError = new DOMException("nope", "UnknownError");
    await expect(storage.saveComponent(makeComponent(), "p")).rejects.toThrow();

    env.openError = null; // IDB "recovers"
    await storage.saveComponent(makeComponent({ id: "after" }), "p");
    expect((await storage.loadComponents("p")).map((c) => c.id)).toEqual(["after"]);
  });
});
