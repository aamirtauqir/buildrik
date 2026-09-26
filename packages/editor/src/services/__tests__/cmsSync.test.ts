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
const loadContentItems = vi.fn(async (_collectionId: string): Promise<unknown[]> => []);
const storageAvailable = vi.fn(() => true);
vi.mock("../../engine/cms/CollectionStorage", () => ({
  isStorageAvailable: () => storageAvailable(),
  loadCollections: (...a: unknown[]) => loadCollections(...a),
  saveCollection: (...a: unknown[]) => saveCollection(...a),
  saveContentItem: (...a: unknown[]) => saveContentItem(...a),
  loadContentItems: (id: string) => loadContentItems(id),
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
import { recordServerStamp } from "../syncRetryQueue";

beforeEach(() => {
  window.history.replaceState({}, "", "/edit/site-123");
  [colUpsert, colDelete, entUpsert, entDelete, colListQuery, entListQuery, loadCollections, saveCollection, saveContentItem].forEach((m) =>
    m.mockReset(),
  );
  storageAvailable.mockReset().mockReturnValue(true);
  loadContentItems.mockReset().mockResolvedValue([]);
  localStorage.removeItem("bk-sync-stamps-v1");
  localStorage.removeItem("bk-sync-stamp-migrations-v1");
  // The server answers an upsert with its row — updatedAt on ITS clock.
  [colUpsert, entUpsert].forEach((m) => m.mockResolvedValue({ updatedAt: new Date(0) }));
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
    colUpsert.mockResolvedValueOnce({ updatedAt: new Date(0) });
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
    colUpsert.mockResolvedValue({ updatedAt: new Date(0) });
    colDelete.mockResolvedValue(undefined);
    entUpsert.mockResolvedValue({ updatedAt: new Date(0) });
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

    colUpsert.mockResolvedValue({ updatedAt: new Date(0) });
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

/* Round 2: a mirror that resolved but returned no row (an older server, a
   mock) reached the server. Reading `row.updatedAt` off undefined threw inside
   the queued op, so it counted as a FAILED mirror and sat in the retry queue
   forever — replayed, "failing" again, on every reconnect. */
describe("cmsSync — a mirror answered without a row", () => {
  it("is a success, not a queued failure, and records no stamp", async () => {
    const onErr = vi.fn();
    const off = onCmsSyncError(onErr);
    colUpsert.mockResolvedValueOnce(undefined);
    entUpsert.mockResolvedValueOnce(undefined);
    await syncCollectionUpsert({ id: "nr", name: "N", slug: "n", fields: [], createdAt: "", updatedAt: "x" } as never);
    await syncEntryUpsert({ id: "nr-e", collectionId: "nr", data: {}, status: "draft", createdAt: "", updatedAt: "x" } as never);
    expect(onErr).not.toHaveBeenCalled();
    expect(getCmsSyncPendingCount()).toBe(0);
    expect(localStorage.getItem("bk-sync-stamps-v1")).toBeNull();
    off();
  });
});

describe("hydrateCmsFromServer", () => {
  /* C-4 / PD-36: server-first, decided on the SERVER's clock. The additive
     pass this replaced skipped every collection already local — so a
     teammate's edit to an entry in a collection this browser had seen never
     arrived. A local row is overwritten only when the server confirmed it
     (a stamp), it has not changed locally since, and the server's own
     updatedAt moved past the stamp. */
  const col = (id: string, updatedAt: number) => ({
    id, name: id, slug: id, description: null, icon: null, displayField: null, fields: [],
    createdAt: new Date(0), updatedAt: new Date(updatedAt),
  });
  const T = (ms: number) => new Date(ms).toISOString();
  /** This site's one-time pre-stamp pass already ran in this browser. */
  const migrated = () => localStorage.setItem("bk-sync-stamp-migrations-v1", JSON.stringify(["cms:site-123"]));
  const migrations = (): string[] => JSON.parse(localStorage.getItem("bk-sync-stamp-migrations-v1") ?? "[]");
  const stamps = (): Record<string, { server: string; local: string }> =>
    JSON.parse(localStorage.getItem("bk-sync-stamps-v1") ?? "{}");
  const entry = (id: string, data: Record<string, unknown>, updatedAt: number) => ({
    id, data, status: "DRAFT", createdAt: new Date(0), updatedAt: new Date(updatedAt),
  });

  /* Round 2 #3: rows hydrated or mirrored before stamps existed have none, and
     one never edited again would never be mirrored → never stamped → hidden
     from every teammate edit forever. */
  describe("unstamped rows (C-4 round 2)", () => {
    it("first hydrate for this site: the old updatedAt comparison runs ONCE — an older unstamped row takes the server's copy and is stamped", async () => {
      colListQuery.mockResolvedValueOnce([col("c", 0)]);
      loadCollections.mockResolvedValueOnce([{ id: "c", updatedAt: T(0) }]);
      recordServerStamp("collection:c", T(0), T(0));
      loadContentItems.mockResolvedValueOnce([{ id: "old", data: { t: "stale" }, status: "draft", updatedAt: T(1000) }]);
      entListQuery.mockResolvedValueOnce([entry("old", { t: "teammate" }, 5000)]);
      await hydrateCmsFromServer();
      expect(saveContentItem.mock.calls[0][0]).toMatchObject({ id: "old", data: { t: "teammate" } });
      expect(stamps()["entry:old"]).toBeDefined();
      expect(migrations()).toContain("cms:site-123");
    });

    it("the one-time pass keeps a NEWER unstamped local row, unstamped (never confirmed, stays local)", async () => {
      colListQuery.mockResolvedValueOnce([col("c", 0)]);
      loadCollections.mockResolvedValueOnce([{ id: "c", updatedAt: T(0) }]);
      recordServerStamp("collection:c", T(0), T(0));
      loadContentItems.mockResolvedValueOnce([{ id: "mine", data: { t: "mine" }, status: "draft", updatedAt: T(9000) }]);
      entListQuery.mockResolvedValueOnce([entry("mine", { t: "server" }, 5000)]);
      await hydrateCmsFromServer();
      expect(saveContentItem).not.toHaveBeenCalled();
      expect(stamps()["entry:mine"]).toBeUndefined();
    });

    it("after the pass, an unstamped row that differs from the server stays local", async () => {
      migrated();
      colListQuery.mockResolvedValueOnce([col("c", 0)]);
      loadCollections.mockResolvedValueOnce([{ id: "c", updatedAt: T(0) }]);
      recordServerStamp("collection:c", T(0), T(0));
      loadContentItems.mockResolvedValueOnce([{ id: "e", data: { t: "mine" }, status: "draft", updatedAt: T(1) }]);
      entListQuery.mockResolvedValueOnce([entry("e", { t: "server" }, 5000)]);
      await hydrateCmsFromServer();
      expect(saveContentItem).not.toHaveBeenCalled();
    });

    it("an unstamped row whose content equals the server copy is adopted — a later teammate edit then arrives", async () => {
      migrated();
      colListQuery.mockResolvedValue([col("c", 0)]);
      loadCollections.mockResolvedValue([{ id: "c", updatedAt: T(0) }]);
      recordServerStamp("collection:c", T(0), T(0));
      // Same content, both key orders; local clock says nothing useful.
      loadContentItems.mockResolvedValue([{ id: "e", data: { a: 1, b: 2 }, status: "draft", updatedAt: T(1) }]);
      entListQuery.mockResolvedValueOnce([entry("e", { b: 2, a: 1 }, 3000)]);
      await hydrateCmsFromServer();
      expect(saveContentItem).not.toHaveBeenCalled();
      expect(stamps()["entry:e"]).toEqual({ server: T(3000), local: T(1) });
      entListQuery.mockResolvedValueOnce([entry("e", { a: 1, b: 3 }, 4000)]);
      await hydrateCmsFromServer();
      expect(saveContentItem.mock.calls[0][0]).toMatchObject({ id: "e", data: { a: 1, b: 3 } });
    });

    /* Round 3: a collection with a queued mirror used to `continue` past its
       ENTRY loop too, while the scope was still marked done — its unstamped
       entries never got the pass and a teammate's edit stayed hidden. */
    it("a queued collection mirror skips only the collection write — its entries still get the pass, and the scope stays due", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      colUpsert.mockRejectedValueOnce(new Error("offline"));
      await syncCollectionUpsert({ id: "c", name: "Mine", slug: "c", fields: [], createdAt: "", updatedAt: T(0) } as never);
      colListQuery.mockResolvedValueOnce([{ ...col("c", 9000), name: "Theirs" }]);
      loadCollections.mockResolvedValueOnce([{ id: "c", updatedAt: T(0) }]);
      loadContentItems.mockResolvedValueOnce([{ id: "e", data: { t: "stale" }, status: "draft", updatedAt: T(1000) }]);
      entListQuery.mockResolvedValueOnce([entry("e", { t: "teammate" }, 5000)]);
      await hydrateCmsFromServer();
      expect(saveCollection).not.toHaveBeenCalled(); // the queued local change wins
      expect(saveContentItem.mock.calls[0][0]).toMatchObject({ id: "e", data: { t: "teammate" } });
      expect(migrations()).not.toContain("cms:site-123"); // skipped a row → pass re-runs
      // Once the mirror drains, the next hydrate completes the pass.
      await retryCmsSync();
      colListQuery.mockResolvedValueOnce([col("c", 0)]);
      loadCollections.mockResolvedValueOnce([{ id: "c", updatedAt: T(0) }]);
      entListQuery.mockResolvedValueOnce([]);
      await hydrateCmsFromServer();
      expect(migrations()).toContain("cms:site-123");
      warn.mockRestore();
    });

    it("an unstamped collection equal to the server's is adopted too", async () => {
      migrated();
      const server = { ...col("c", 3000), name: "Posts" };
      colListQuery.mockResolvedValueOnce([server]);
      loadCollections.mockResolvedValueOnce([
        { id: "c", siteId: "site-123", name: "Posts", slug: "c", fields: [], createdAt: T(0), updatedAt: T(1) },
      ]);
      entListQuery.mockResolvedValue([]);
      await hydrateCmsFromServer();
      expect(saveCollection).not.toHaveBeenCalled();
      expect(stamps()["collection:c"]).toEqual({ server: T(3000), local: T(1) });
    });
  });

  it("writes a missing collection, re-reads the entries of one already local", async () => {
    colListQuery.mockResolvedValueOnce([col("srv-new", 0), col("local-1", 0)]);
    loadCollections.mockResolvedValueOnce([{ id: "local-1", updatedAt: T(0) }]);
    recordServerStamp("collection:local-1", T(0), T(0));
    recordServerStamp("entry:e2", T(1000), T(1000));
    // D-11: collections now reconcile concurrently, so which one's
    // `entries.list.query` fires first is not guaranteed — key the mock
    // response on `collectionId` rather than call order.
    entListQuery.mockImplementation(async ({ collectionId }: { collectionId: string }) =>
      collectionId === "srv-new"
        ? [{ id: "e1", data: { t: 1 }, status: "PUBLISHED", createdAt: new Date(0), updatedAt: new Date(0) }]
        : [{ id: "e2", data: { t: "server" }, status: "DRAFT", createdAt: new Date(0), updatedAt: new Date(5000) }],
    );
    loadContentItems.mockImplementation(async (id: string) =>
      id === "local-1" ? [{ id: "e2", data: { t: "stale" }, updatedAt: T(1000) }] : [],
    );
    await hydrateCmsFromServer();
    // only the non-local collection is written (local-1 is unchanged on the server)
    expect(saveCollection).toHaveBeenCalledTimes(1);
    expect(saveCollection.mock.calls[0][0]).toMatchObject({ id: "srv-new", slug: "srv-new" });
    // D-11: collections reconcile concurrently now, so entry writes across
    // DIFFERENT collections are no longer guaranteed to land in array order —
    // assert set membership, not call index.
    const savedEntries = saveContentItem.mock.calls.map((c) => c[0]);
    // its entry, with status mapped back to engine casing …
    expect(savedEntries).toContainEqual(
      expect.objectContaining({ id: "e1", collectionId: "srv-new", status: "published" }),
    );
    // … AND the newer server copy of an entry in the already-local collection
    expect(savedEntries).toContainEqual(
      expect.objectContaining({ id: "e2", collectionId: "local-1", data: { t: "server" } }),
    );
  });

  it("client clock AHEAD: a confirmed local copy stamped far in the future still takes the server's newer edit", async () => {
    const future = T(Date.parse("2099-01-01T00:00:00Z"));
    recordServerStamp("collection:c", T(1000), future); // confirmed at server t=1000; local clock way ahead
    colListQuery.mockResolvedValueOnce([{ ...col("c", 2000), name: "Renamed by a teammate" }]);
    loadCollections.mockResolvedValueOnce([{ id: "c", updatedAt: future }]);
    entListQuery.mockResolvedValue([]);
    await hydrateCmsFromServer();
    expect(saveCollection.mock.calls[0][0]).toMatchObject({ id: "c", name: "Renamed by a teammate" });
  });

  it("client clock BEHIND: an unconfirmed local edit with an OLD timestamp is not overwritten", async () => {
    recordServerStamp("collection:c", T(1000), T(10)); // confirmed copy had local t=10
    colListQuery.mockResolvedValueOnce([col("c", 9000)]);
    // edited locally since (t=20 on a clock far behind the server's) — not yet on the server
    loadCollections.mockResolvedValueOnce([{ id: "c", updatedAt: T(20) }]);
    entListQuery.mockResolvedValue([]);
    await hydrateCmsFromServer();
    expect(saveCollection).not.toHaveBeenCalled();
  });

  it("a local row the server never confirmed (no stamp — e.g. its mirror failed before a reload) is kept", async () => {
    migrated();
    colListQuery.mockResolvedValueOnce([col("c", 9000)]);
    loadCollections.mockResolvedValueOnce([{ id: "c", updatedAt: T(1) }]);
    entListQuery.mockResolvedValue([]);
    await hydrateCmsFromServer();
    expect(saveCollection).not.toHaveBeenCalled();
  });

  it("a successful mirror stamps the row with the server's updatedAt", async () => {
    colUpsert.mockResolvedValueOnce({ updatedAt: new Date(7000) });
    await syncCollectionUpsert({ id: "m", name: "M", slug: "m", fields: [], createdAt: "", updatedAt: T(42) } as never);
    // unchanged on the server since → keep; moved on → take it
    colListQuery.mockResolvedValueOnce([col("m", 7000)]);
    loadCollections.mockResolvedValueOnce([{ id: "m", updatedAt: T(42) }]);
    entListQuery.mockResolvedValue([]);
    await hydrateCmsFromServer();
    expect(saveCollection).not.toHaveBeenCalled();
    colListQuery.mockResolvedValueOnce([col("m", 8000)]);
    loadCollections.mockResolvedValueOnce([{ id: "m", updatedAt: T(42) }]);
    await hydrateCmsFromServer();
    expect(saveCollection).toHaveBeenCalledTimes(1);
  });

  it("never overwrites an entry whose local change is still queued for the server", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    entUpsert.mockRejectedValueOnce(new Error("offline"));
    await syncEntryUpsert({ id: "queued", collectionId: "c", data: { t: "mine" }, status: "draft", createdAt: "", updatedAt: T(0) } as never);
    recordServerStamp("entry:queued", T(0), T(0));
    colListQuery.mockResolvedValueOnce([col("c", 0)]);
    loadCollections.mockResolvedValueOnce([{ id: "c", updatedAt: T(0) }]);
    loadContentItems.mockResolvedValueOnce([{ id: "queued", updatedAt: T(0) }]);
    entListQuery.mockResolvedValueOnce([
      { id: "queued", data: { t: "server" }, status: "DRAFT", createdAt: new Date(0), updatedAt: new Date(99999) },
    ]);
    await hydrateCmsFromServer();
    expect(saveContentItem).not.toHaveBeenCalled();
    await retryCmsSync();
    warn.mockRestore();
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
      /* Hydration writes straight into IndexedDB, past CollectionManager, so it
         has to stamp the site itself — otherwise the row lands unscoped and
         keeps showing on every other site in this browser. */
      siteId: "site-123",
      name: "Posts",
      slug: "posts",
      description: "Blog posts",
      icon: undefined,
      displayField: "title",
      fields: [{ id: "f1", name: "title", type: "text", slug: "f1" }], // slugless stored field gets slug = id
      pageSlugPattern: undefined,
      pageSeoTitle: undefined,
      pageSeoDescription: undefined,
      pageTemplatePath: undefined,
      createdAt: "2026-07-01T00:00:00.000Z", // Date → ISO
      updatedAt: "2026-07-02T00:00:00.000Z", // string passes through
    });
  });
});

/* C-4 minor (Lrt round 1): the verify seed stored fields as { id, name, type }
   with no slug. RecordsTable no longer crashes on that, but every cell read
   data[undefined] and showed blank. Hydration normalizes slug ?? id. */
describe("hydrateCmsFromServer · slugless stored fields", () => {
  it("fills a missing field slug from its id", async () => {
    colListQuery.mockResolvedValueOnce([
      {
        id: "c", name: "Posts", slug: "posts", description: null, icon: null, displayField: null,
        fields: [{ id: "title", name: "Title", type: "text" }, { id: "b", name: "Body", slug: "body", type: "richtext" }],
        createdAt: new Date(0), updatedAt: new Date(0),
      },
    ]);
    loadCollections.mockResolvedValueOnce([]);
    entListQuery.mockResolvedValueOnce([]);
    await hydrateCmsFromServer();
    const saved = saveCollection.mock.calls[0][0] as { fields: Array<{ slug: string }> };
    expect(saved.fields.map((f) => f.slug)).toEqual(["title", "body"]);
  });
});
