/**
 * CMS sync mapping (E7). Verifies the editor maps engine CMS objects to the
 * server upsert payloads using the /edit/<siteId> URL, and that a failed network
 * call is swallowed (best-effort — the local IndexedDB write already happened, so
 * the engine must never see a throw).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const colUpsert = vi.fn();
const entUpsert = vi.fn();
const colListQuery = vi.fn();
const entListQuery = vi.fn();

vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({
    cms: {
      collections: { upsert: { mutate: colUpsert }, delete: { mutate: vi.fn() }, list: { query: colListQuery } },
      entries: { upsert: { mutate: entUpsert }, delete: { mutate: vi.fn() }, list: { query: entListQuery } },
    },
  }),
}));
vi.mock("../../shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000" }));

const loadCollections = vi.fn();
const saveCollection = vi.fn();
const saveContentItem = vi.fn();
vi.mock("../../engine/cms/CollectionStorage", () => ({
  isStorageAvailable: () => true,
  loadCollections: (...a: unknown[]) => loadCollections(...a),
  saveCollection: (...a: unknown[]) => saveCollection(...a),
  saveContentItem: (...a: unknown[]) => saveContentItem(...a),
}));

import { syncCollectionUpsert, syncEntryUpsert, hydrateCmsFromServer } from "../cmsSync";

beforeEach(() => {
  window.history.replaceState({}, "", "/edit/site-123");
  [colUpsert, entUpsert, colListQuery, entListQuery, loadCollections, saveCollection, saveContentItem].forEach((m) =>
    m.mockReset(),
  );
});

describe("cmsSync", () => {
  it("maps a collection to the upsert payload with the URL siteId", async () => {
    await syncCollectionUpsert({
      id: "c1", name: "Posts", slug: "posts", fields: [], createdAt: "", updatedAt: "",
    } as never);
    expect(colUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "c1", siteId: "site-123", name: "Posts", slug: "posts" }),
    );
  });

  it("maps content status published → PUBLISHED, else DRAFT", async () => {
    await syncEntryUpsert({ id: "e1", collectionId: "c1", data: { t: 1 }, status: "published", createdAt: "", updatedAt: "" } as never);
    expect(entUpsert).toHaveBeenCalledWith(expect.objectContaining({ id: "e1", siteId: "site-123", status: "PUBLISHED" }));
    await syncEntryUpsert({ id: "e2", collectionId: "c1", data: {}, status: "draft", createdAt: "", updatedAt: "" } as never);
    expect(entUpsert).toHaveBeenLastCalledWith(expect.objectContaining({ id: "e2", status: "DRAFT" }));
  });

  it("swallows a failed sync (best-effort) — never throws into the engine", async () => {
    colUpsert.mockRejectedValueOnce(new Error("network down"));
    await expect(
      syncCollectionUpsert({ id: "c1", name: "X", slug: "x", fields: [], createdAt: "", updatedAt: "" } as never),
    ).resolves.toBeUndefined();
  });

  it("no-ops when not on an /edit/<siteId> URL", async () => {
    window.history.replaceState({}, "", "/dashboard");
    await syncCollectionUpsert({ id: "c1", name: "X", slug: "x", fields: [], createdAt: "", updatedAt: "" } as never);
    expect(colUpsert).not.toHaveBeenCalled();
  });
});

describe("hydrateCmsFromServer", () => {
  it("writes server collections + entries to local storage, skipping ids already local", async () => {
    colListQuery.mockResolvedValueOnce([
      { id: "srv-new", name: "Posts", slug: "posts", description: null, icon: null, displayField: null, fields: [], createdAt: new Date(0), updatedAt: new Date(0) },
      { id: "local-1", name: "Pages", slug: "pages", description: null, icon: null, displayField: null, fields: [], createdAt: new Date(0), updatedAt: new Date(0) },
    ]);
    loadCollections.mockResolvedValueOnce([{ id: "local-1" }]); // already local → skip
    entListQuery.mockResolvedValueOnce([
      { id: "e1", data: { t: 1 }, status: "PUBLISHED", createdAt: new Date(0), updatedAt: new Date(0) },
    ]);
    await hydrateCmsFromServer();
    // only the non-local collection is written
    expect(saveCollection).toHaveBeenCalledTimes(1);
    expect(saveCollection.mock.calls[0][0]).toMatchObject({ id: "srv-new", slug: "posts" });
    // its entry, with status mapped back to engine casing
    expect(saveContentItem.mock.calls[0][0]).toMatchObject({ id: "e1", collectionId: "srv-new", status: "published" });
  });

  it("no-ops when the server has no collections", async () => {
    colListQuery.mockResolvedValueOnce([]);
    await hydrateCmsFromServer();
    expect(saveCollection).not.toHaveBeenCalled();
  });
});
