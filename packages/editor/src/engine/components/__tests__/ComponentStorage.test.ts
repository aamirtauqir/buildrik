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

describe("deleteComponent / deleteAllComponents", () => {
  it("deleteComponent removes exactly that record", async () => {
    await storage.saveComponent(makeComponent({ id: "a" }), "p");
    await storage.saveComponent(makeComponent({ id: "b" }), "p");

    await storage.deleteComponent("a");

    expect((await storage.loadComponents("p")).map((c) => c.id)).toEqual(["b"]);
  });

  it("deleteAllComponents wipes ONLY the given project and returns the count", async () => {
    await storage.saveComponent(makeComponent({ id: "a1" }), "p1");
    await storage.saveComponent(makeComponent({ id: "a2" }), "p1");
    await storage.saveComponent(makeComponent({ id: "b1" }), "p2");

    expect(await storage.deleteAllComponents("p1")).toBe(2);
    expect(await storage.loadComponents("p1")).toEqual([]);
    expect((await storage.loadComponents("p2")).map((c) => c.id)).toEqual(["b1"]);
  });

  it("deleteAllComponents returns 0 for an empty project", async () => {
    await storage.saveComponent(makeComponent(), "p");
    expect(await storage.deleteAllComponents("empty")).toBe(0);
  });
});

describe("exportComponents / importComponents", () => {
  it("export bundles project components with version + timestamp", async () => {
    await storage.saveComponent(makeComponent({ id: "a" }), "p");

    const data = await storage.exportComponents("p");

    expect(data.version).toBe("1.0.0");
    expect(data.projectId).toBe("p");
    expect(data.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(data.components.map((c) => c.id)).toEqual(["a"]);
  });

  it("import adds components and returns the count (existing kept by default)", async () => {
    await storage.saveComponent(makeComponent({ id: "old" }), "p");

    const count = await storage.importComponents({
      version: "1.0.0",
      projectId: "p",
      exportedAt: "x",
      components: [makeComponent({ id: "new-1" }), makeComponent({ id: "new-2" })],
    });

    expect(count).toBe(2);
    const ids = (await storage.loadComponents("p")).map((c) => c.id).sort();
    expect(ids).toEqual(["new-1", "new-2", "old"]);
  });

  it("clearExisting=true wipes the target project before importing", async () => {
    await storage.saveComponent(makeComponent({ id: "old" }), "p");

    await storage.importComponents(
      {
        version: "1.0.0",
        projectId: "p",
        exportedAt: "x",
        components: [makeComponent({ id: "new-1" })],
      },
      true
    );

    expect((await storage.loadComponents("p")).map((c) => c.id)).toEqual(["new-1"]);
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

describe("downloadComponentsFile", () => {
  it("creates + revokes a blob URL and clicks a temp anchor", async () => {
    const createObjectURL = vi.fn(() => "blob:fake");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", Object.assign(Object.create(URL), { createObjectURL, revokeObjectURL }));
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    storage.downloadComponentsFile({
      version: "1.0.0",
      projectId: "p",
      exportedAt: "x",
      components: [],
    });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake");
    // The temp anchor is removed again.
    expect(document.querySelector("a[download]")).toBeNull();
  });
});

describe("open failure", () => {
  it("rejects with a friendly error when the database cannot open", async () => {
    env.openError = new DOMException("nope", "UnknownError");
    await expect(storage.saveComponent(makeComponent(), "p")).rejects.toThrow(
      "Failed to open components database"
    );
  });

  // Pinned: `dbPromise` caches the REJECTED promise, so storage stays broken
  // for the lifetime of the module even after IndexedDB recovers.
  it("pins: a failed open is cached forever — later calls fail without retrying", async () => {
    env.openError = new DOMException("nope", "UnknownError");
    await expect(storage.loadComponents("p")).rejects.toThrow();

    env.openError = null; // IDB "recovers"
    await expect(storage.loadComponents("p")).rejects.toThrow(
      "Failed to open components database"
    );
    expect(env.openCalls).toHaveLength(1); // never retried
  });

  it.todo(
    "BUG: getDatabase caches a rejected dbPromise — one transient IndexedDB open failure permanently disables component storage until full page reload; the cache should reset on rejection"
  );
});
