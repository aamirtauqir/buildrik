/**
 * CMS sync mapping (E7). Verifies the editor maps engine CMS objects to the
 * server upsert payloads using the /edit/<siteId> URL, and that a failed network
 * call is swallowed (best-effort — the local IndexedDB write already happened, so
 * the engine must never see a throw).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const colUpsert = vi.fn();
const colDelete = vi.fn();
const entUpsert = vi.fn();
const entDelete = vi.fn();
const colListQuery = vi.fn();
const entListQuery = vi.fn();

vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({
    cms: {
      collections: { upsert: { mutate: colUpsert }, delete: { mutate: colDelete }, list: { query: colListQuery } },
      entries: { upsert: { mutate: entUpsert }, delete: { mutate: entDelete }, list: { query: entListQuery } },
    },
  }),
}));
vi.mock("../../shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000" }));

const loadCollections = vi.fn();
const saveCollection = vi.fn();
const saveContentItem = vi.fn();
const storageAvailable = vi.fn(() => true);
vi.mock("../../engine/cms/CollectionStorage", () => ({
  isStorageAvailable: () => storageAvailable(),
  loadCollections: (...a: unknown[]) => loadCollections(...a),
  saveCollection: (...a: unknown[]) => saveCollection(...a),
  saveContentItem: (...a: unknown[]) => saveContentItem(...a),
}));

import {
  syncCollectionUpsert,
  syncCollectionDelete,
  syncEntryUpsert,
  syncEntryDelete,
  hydrateCmsFromServer,
  onCmsSyncError,
  retryCmsSync,
  getCmsSyncPendingCount,
} from "../cmsSync";

beforeEach(() => {
  window.history.replaceState({}, "", "/edit/site-123");
  [colUpsert, colDelete, entUpsert, entDelete, colListQuery, entListQuery, loadCollections, saveCollection, saveContentItem].forEach((m) =>
    m.mockReset(),
  );
  storageAvailable.mockReset().mockReturnValue(true);
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

  it("resolves the siteId from the legacy ?siteId= URL", async () => {
    window.history.replaceState({}, "", "/?siteId=legacy-7");
    await syncCollectionUpsert({ id: "c1", name: "X", slug: "x", fields: [], createdAt: "", updatedAt: "" } as never);
    expect(colUpsert).toHaveBeenCalledWith(expect.objectContaining({ siteId: "legacy-7" }));
  });

  it("maps a collection delete to { siteId, id }", async () => {
    colDelete.mockResolvedValueOnce(undefined);
    await syncCollectionDelete("c9");
    expect(colDelete).toHaveBeenCalledWith({ siteId: "site-123", id: "c9" });
  });

  it("maps an entry delete to { siteId, id }", async () => {
    entDelete.mockResolvedValueOnce(undefined);
    await syncEntryDelete("e9");
    expect(entDelete).toHaveBeenCalledWith({ siteId: "site-123", id: "e9" });
  });

  it("maps optional collection fields to explicit nulls in the upsert payload", async () => {
    colUpsert.mockResolvedValueOnce(undefined);
    await syncCollectionUpsert({
      id: "c1", name: "Posts", slug: "posts", fields: [], createdAt: "", updatedAt: "",
    } as never);
    expect(colUpsert).toHaveBeenCalledWith({
      id: "c1",
      siteId: "site-123",
      name: "Posts",
      slug: "posts",
      description: null,
      icon: null,
      displayField: null,
      fields: [],
      pageSlugPattern: null,
      pageSeoTitle: null,
      pageSeoDescription: null,
      pageTemplatePath: null,
    });
  });
});

describe("cmsSync retry queue (#5/#6 — no silent drop)", () => {
  const drain = async () => {
    // Flush any leftover queued ops from prior tests with succeeding mutates,
    // so each test starts from an empty queue (module-level shared state).
    colUpsert.mockResolvedValue(undefined);
    colDelete.mockResolvedValue(undefined);
    entUpsert.mockResolvedValue(undefined);
    entDelete.mockResolvedValue(undefined);
    await retryCmsSync();
  };

  it("queues a failed upsert + notifies subscribers, then clears on a successful retry", async () => {
    await drain();
    const events: number[] = [];
    const off = onCmsSyncError(({ pending }) => events.push(pending));

    colUpsert.mockRejectedValueOnce(new Error("network down"));
    await syncCollectionUpsert({
      id: "cq", name: "Q", slug: "q", fields: [], createdAt: "", updatedAt: "",
    } as never);

    expect(getCmsSyncPendingCount()).toBe(1);
    expect(events).toEqual([1]); // subscriber heard the failure — not silent

    // colUpsert now resolves (set in drain's mockResolvedValue); retry flushes.
    await retryCmsSync();
    expect(getCmsSyncPendingCount()).toBe(0);
    off();
  });

  it("does NOT notify on a successful sync", async () => {
    await drain();
    const events: number[] = [];
    const off = onCmsSyncError(({ pending }) => events.push(pending));

    colUpsert.mockResolvedValue(undefined);
    await syncCollectionUpsert({
      id: "ok", name: "OK", slug: "ok", fields: [], createdAt: "", updatedAt: "",
    } as never);

    expect(events).toEqual([]);
    expect(getCmsSyncPendingCount()).toBe(0);
    off();
  });

  it("queues a failed entry delete + notifies with the pending count, then drains on retry", async () => {
    await drain();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const events: number[] = [];
    const off = onCmsSyncError(({ pending }) => events.push(pending));

    entDelete.mockRejectedValueOnce(new Error("network down"));
    await expect(syncEntryDelete("e-del")).resolves.toBeUndefined();

    expect(getCmsSyncPendingCount()).toBe(1);
    expect(events).toEqual([1]);

    // entDelete now resolves (drain's mockResolvedValue); retry replays the SAME op.
    await retryCmsSync();
    expect(entDelete).toHaveBeenLastCalledWith({ siteId: "site-123", id: "e-del" });
    expect(getCmsSyncPendingCount()).toBe(0);
    off();
    warn.mockRestore();
  });

  it("latest-wins: repeated failures for the same target hold ONE queue slot with the newest payload", async () => {
    await drain();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    colUpsert.mockRejectedValueOnce(new Error("down"));
    await syncCollectionUpsert({ id: "cq", name: "First", slug: "q", fields: [], createdAt: "", updatedAt: "" } as never);
    colUpsert.mockRejectedValueOnce(new Error("still down"));
    await syncCollectionUpsert({ id: "cq", name: "Second", slug: "q", fields: [], createdAt: "", updatedAt: "" } as never);

    expect(getCmsSyncPendingCount()).toBe(1); // one slot per target, not two

    await retryCmsSync(); // colUpsert resolves now (drain's default)
    expect(colUpsert).toHaveBeenLastCalledWith(expect.objectContaining({ id: "cq", name: "Second" }));
    expect(getCmsSyncPendingCount()).toBe(0);
    warn.mockRestore();
  });

  it("a delete drops the pending upsert for the same collection (deletion wins — no resurrection on retry)", async () => {
    await drain();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    colUpsert.mockRejectedValueOnce(new Error("down"));
    await syncCollectionUpsert({ id: "cx", name: "Doomed", slug: "x", fields: [], createdAt: "", updatedAt: "" } as never);
    expect(getCmsSyncPendingCount()).toBe(1);

    await syncCollectionDelete("cx"); // colDelete resolves (drain default)
    expect(getCmsSyncPendingCount()).toBe(0); // pending upsert dropped, delete succeeded

    colUpsert.mockClear();
    await retryCmsSync();
    expect(colUpsert).not.toHaveBeenCalled(); // deleted collection never resurrected
    warn.mockRestore();
  });

  it("an entry delete drops the pending upsert for the same entry", async () => {
    await drain();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    entUpsert.mockRejectedValueOnce(new Error("down"));
    await syncEntryUpsert({ id: "ex", collectionId: "c1", data: {}, status: "draft", createdAt: "", updatedAt: "" } as never);
    expect(getCmsSyncPendingCount()).toBe(1);

    await syncEntryDelete("ex");
    expect(getCmsSyncPendingCount()).toBe(0);

    entUpsert.mockClear();
    await retryCmsSync();
    expect(entUpsert).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("queues a failed COLLECTION delete + notifies, then drains on retry", async () => {
    await drain();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const events: number[] = [];
    const off = onCmsSyncError(({ pending }) => events.push(pending));

    colDelete.mockRejectedValueOnce(new Error("network down"));
    await expect(syncCollectionDelete("c-del")).resolves.toBeUndefined();
    expect(getCmsSyncPendingCount()).toBe(1);
    expect(events).toEqual([1]);

    await retryCmsSync(); // colDelete resolves now (drain default)
    expect(colDelete).toHaveBeenLastCalledWith({ siteId: "site-123", id: "c-del" });
    expect(getCmsSyncPendingCount()).toBe(0);
    off();
    warn.mockRestore();
  });

  it("retry replays a queued ENTRY upsert with the original payload", async () => {
    await drain();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    entUpsert.mockRejectedValueOnce(new Error("down"));
    await syncEntryUpsert({ id: "eq", collectionId: "c1", data: { title: "kept" }, status: "published", createdAt: "", updatedAt: "" } as never);
    expect(getCmsSyncPendingCount()).toBe(1);

    await retryCmsSync(); // entUpsert resolves now (drain default)
    expect(entUpsert).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "eq", data: { title: "kept" }, status: "PUBLISHED" }),
    );
    expect(getCmsSyncPendingCount()).toBe(0);
    warn.mockRestore();
  });

  it("the window 'online' event auto-drains the queue (reconnect retry)", async () => {
    await drain();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    colUpsert.mockRejectedValueOnce(new Error("offline"));
    await syncCollectionUpsert({ id: "conn", name: "Reconnect", slug: "r", fields: [], createdAt: "", updatedAt: "" } as never);
    expect(getCmsSyncPendingCount()).toBe(1);

    // colUpsert resolves again (drain default) — going back online must flush.
    window.dispatchEvent(new Event("online"));
    await vi.waitFor(() => expect(getCmsSyncPendingCount()).toBe(0));
    expect(colUpsert).toHaveBeenLastCalledWith(expect.objectContaining({ id: "conn" }));
    warn.mockRestore();
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

  it("no-ops when local CMS storage is unavailable (never queries the server)", async () => {
    storageAvailable.mockReturnValue(false);
    await hydrateCmsFromServer();
    expect(colListQuery).not.toHaveBeenCalled();
    expect(saveCollection).not.toHaveBeenCalled();
  });

  it("no-ops when unauthenticated/outside the editor URL", async () => {
    window.history.replaceState({}, "", "/dashboard");
    await hydrateCmsFromServer();
    expect(colListQuery).not.toHaveBeenCalled();
  });

  it("a failed hydrate warns + never throws into editor open", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    colListQuery.mockRejectedValueOnce(new Error("offline"));
    await expect(hydrateCmsFromServer()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith("[cms-sync] hydrate from server failed", expect.any(Error));
    warn.mockRestore();
  });

  it("normalizes Date timestamps to ISO strings and nullable fields to undefined", async () => {
    colListQuery.mockResolvedValueOnce([
      {
        id: "srv-1", name: "Posts", slug: "posts", description: "Blog posts", icon: null,
        displayField: "title", fields: [{ id: "f1", name: "title", type: "text" }],
        createdAt: new Date("2026-07-01T00:00:00.000Z"), updatedAt: "2026-07-02T00:00:00.000Z",
        pageSlugPattern: null, pageSeoTitle: null, pageSeoDescription: null, pageTemplatePath: null,
      },
    ]);
    loadCollections.mockResolvedValueOnce([]);
    entListQuery.mockResolvedValueOnce([]);
    await hydrateCmsFromServer();
    expect(saveCollection).toHaveBeenCalledWith({
      id: "srv-1",
      name: "Posts",
      slug: "posts",
      description: "Blog posts",
      icon: undefined,
      displayField: "title",
      fields: [{ id: "f1", name: "title", type: "text" }],
      pageSlugPattern: undefined,
      pageSeoTitle: undefined,
      pageSeoDescription: undefined,
      pageTemplatePath: undefined,
      createdAt: "2026-07-01T00:00:00.000Z", // Date → ISO
      updatedAt: "2026-07-02T00:00:00.000Z", // string passes through
    });
  });
});
