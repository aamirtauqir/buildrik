/**
 * C0.5 — the persisted CMS outbox (`bk-cms-outbox-v1`). Live 2026-10-02: a
 * record save still queued when the tab reloaded stayed in that browser's
 * IndexedDB only — the server kept the old value, nothing re-sent it, and
 * publish read 0 pending. Each "page load" here is a fresh module instance
 * (`vi.resetModules`) over the same localStorage, which is exactly what a
 * reload keeps and what it loses.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
vi.mock("../../shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000", IS_DEV_BUILD: false }));

const saveContentItem = vi.fn();
const loadContentItems = vi.fn(async (_id: string): Promise<unknown[]> => []);
vi.mock("../../engine/cms/CollectionStorage", () => ({
  isStorageAvailable: () => true,
  loadCollections: async () => [],
  saveCollection: vi.fn(),
  saveContentItem: (...a: unknown[]) => saveContentItem(...a),
  loadContentItems: (id: string) => loadContentItems(id),
  loadContentItem: vi.fn(),
  deleteContentItem: vi.fn(),
  deleteCollection: vi.fn(),
}));

const OUTBOX = "bk-cms-outbox-v1";

/** A fresh page load: module state (the in-memory queue) gone, storage kept. */
async function pageLoad() {
  vi.resetModules();
  const sync = await import("../cmsSync");
  const queue = await import("../syncRetryQueue");
  return { ...sync, ...queue };
}

const outbox = (): Record<string, Array<{ key: string; op: string }>> =>
  JSON.parse(localStorage.getItem(OUTBOX) ?? "{}");
const keysFor = (siteId: string) => (outbox()[siteId] ?? []).map((o) => o.key);

const item = (id: string, data: Record<string, unknown> = { t: 1 }, updatedAt = "L1") =>
  ({ id, collectionId: "c1", data, status: "draft", createdAt: "L0", updatedAt }) as never;
const collection = (id: string) =>
  ({ id, name: "Posts", slug: "posts", fields: [], createdAt: "L0", updatedAt: "L1" }) as never;

const offline = () => new Error("Failed to fetch");
const conflict = () =>
  Object.assign(new Error("CMS_CONFLICT:This record was changed elsewhere."), { data: { code: "BAD_REQUEST" } });

beforeEach(() => {
  window.history.replaceState({}, "", "/edit/site-A");
  localStorage.clear();
  [colUpsert, colDelete, entUpsert, entDelete, colListQuery, entListQuery, saveContentItem].forEach((m) => m.mockReset());
  loadContentItems.mockReset().mockResolvedValue([]);
  [colUpsert, entUpsert].forEach((m) => m.mockResolvedValue({ updatedAt: "2026-10-02T12:00:00.000Z" }));
  [colDelete, entDelete].forEach((m) => m.mockResolvedValue({ ok: true }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CMS outbox — persisted before the request, removed on the server's answer", () => {
  it("the op is in storage before the network call is made", async () => {
    const { syncEntryUpsert } = await pageLoad();
    let atSend: string[] = [];
    entUpsert.mockImplementationOnce(async () => {
      atSend = keysFor("site-A");
      return { updatedAt: "2026-10-02T12:00:00.000Z" };
    });
    await syncEntryUpsert(item("e1"));
    expect(atSend).toEqual(["entryUpsert:e1"]);
  });

  it("a confirmed write leaves the outbox", async () => {
    const { syncEntryUpsert } = await pageLoad();
    await expect(syncEntryUpsert(item("e1"))).resolves.toBe(true);
    expect(keysFor("site-A")).toEqual([]);
  });

  it("a failed write stays, and leaves once a retry lands", async () => {
    const { syncEntryUpsert, retryCmsSync } = await pageLoad();
    entUpsert.mockRejectedValueOnce(offline());
    await syncEntryUpsert(item("e1"));
    expect(keysFor("site-A")).toEqual(["entryUpsert:e1"]);
    await retryCmsSync();
    expect(keysFor("site-A")).toEqual([]);
  });

  it("an older request's success does not clear a newer payload for the same row", async () => {
    const { syncEntryUpsert } = await pageLoad();
    let release!: () => void;
    entUpsert.mockImplementationOnce(
      () => new Promise((r) => (release = () => r({ updatedAt: "2026-10-02T12:00:00.000Z" }))),
    );
    const first = syncEntryUpsert(item("e1", { t: 1 }));
    await vi.waitFor(() => expect(entUpsert).toHaveBeenCalledTimes(1));
    entUpsert.mockRejectedValueOnce(offline());
    const second = syncEntryUpsert(item("e1", { t: 2 }, "L2"));
    release();
    await Promise.all([first, second]);
    const ops = outbox()["site-A"] as unknown as Array<{ key: string; item: { data: unknown } }>;
    expect(ops).toHaveLength(1);
    expect(ops[0].item.data).toEqual({ t: 2 });
  });

  it("GONE is a definitive answer — the op leaves", async () => {
    const { syncEntryUpsert } = await pageLoad();
    entUpsert.mockRejectedValueOnce(new Error("CMS_GONE:This record was deleted."));
    await syncEntryUpsert(item("e1"));
    expect(keysFor("site-A")).toEqual([]);
  });

  it("a delete supersedes a pending upsert of the same row", async () => {
    const { syncEntryUpsert, syncEntryDelete } = await pageLoad();
    entUpsert.mockRejectedValueOnce(offline());
    await syncEntryUpsert(item("e1"));
    entDelete.mockRejectedValueOnce(offline());
    await syncEntryDelete("e1");
    expect(keysFor("site-A")).toEqual(["entryDelete:e1"]);
  });

  it("a later write keeps its target's place in line (collection stays ahead of its entries)", async () => {
    const { syncCollectionUpsert, syncEntryUpsert } = await pageLoad();
    colUpsert.mockRejectedValue(offline());
    entUpsert.mockRejectedValue(offline());
    await syncCollectionUpsert(collection("c1"));
    await syncEntryUpsert(item("e1"));
    await syncCollectionUpsert(collection("c1"));
    expect(keysFor("site-A")).toEqual(["collectionUpsert:c1", "entryUpsert:e1"]);
  });
});

describe("CMS outbox — survives a reload", () => {
  it("an edit queued at reload reaches the server on the next load", async () => {
    const first = await pageLoad();
    entUpsert.mockRejectedValueOnce(offline());
    await first.syncEntryUpsert(item("e1", { title: "queued-then-reload" }));

    const second = await pageLoad();
    expect(second.cmsSyncBlocker()).toMatch(/^1 CMS change hasn't reached the server yet/);
    expect(second.totalPendingMirrors()).toBe(1);
    await second.flushCmsOutbox();
    expect(entUpsert).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "e1", siteId: "site-A", data: { title: "queued-then-reload" } }),
    );
    expect(keysFor("site-A")).toEqual([]);
    expect(second.cmsSyncBlocker()).toBeNull();
    expect(second.totalPendingMirrors()).toBe(0);
  });

  it("an edit still IN FLIGHT at reload is replayed too", async () => {
    const first = await pageLoad();
    entUpsert.mockImplementationOnce(() => new Promise(() => {}));
    void first.syncEntryUpsert(item("e1"));
    await vi.waitFor(() => expect(entUpsert).toHaveBeenCalledTimes(1));
    expect(keysFor("site-A")).toEqual(["entryUpsert:e1"]);

    const second = await pageLoad();
    await second.flushCmsOutbox();
    expect(entUpsert).toHaveBeenCalledTimes(2);
    expect(keysFor("site-A")).toEqual([]);
  });

  it("replays collections before their entries, deletes last", async () => {
    localStorage.setItem(
      OUTBOX,
      JSON.stringify({
        "site-A": [
          { key: "collectionDelete:c9", op: "collectionDelete", id: "c9", seq: "1" },
          { key: "entryDelete:e8", op: "entryDelete", id: "e8", seq: "2" },
          { key: "entryUpsert:e1", op: "entryUpsert", item: item("e1"), seq: "3" },
          { key: "collectionUpsert:c1", op: "collectionUpsert", collection: collection("c1"), seq: "4" },
        ],
      }),
    );
    const order: string[] = [];
    colUpsert.mockImplementation(async () => (order.push("colUpsert"), { updatedAt: "2026-10-02T12:00:00.000Z" }));
    entUpsert.mockImplementation(async () => (order.push("entUpsert"), { updatedAt: "2026-10-02T12:00:00.000Z" }));
    entDelete.mockImplementation(async () => (order.push("entDelete"), { ok: true }));
    colDelete.mockImplementation(async () => (order.push("colDelete"), { ok: true }));
    const { flushCmsOutbox } = await pageLoad();
    await flushCmsOutbox();
    expect(order).toEqual(["colUpsert", "entUpsert", "entDelete", "colDelete"]);
    expect(outbox()).toEqual({});
  });

  it("a replay that fails again stays persisted and queued", async () => {
    const first = await pageLoad();
    entUpsert.mockRejectedValueOnce(offline());
    await first.syncEntryUpsert(item("e1"));
    const second = await pageLoad();
    entUpsert.mockRejectedValueOnce(offline());
    await second.flushCmsOutbox();
    expect(keysFor("site-A")).toEqual(["entryUpsert:e1"]);
    expect(second.getCmsSyncPendingCount()).toBe(1);
  });

  it("one site's outbox never replays into another", async () => {
    const first = await pageLoad();
    entUpsert.mockRejectedValueOnce(offline());
    await first.syncEntryUpsert(item("e1"));

    window.history.replaceState({}, "", "/edit/site-B");
    const second = await pageLoad();
    expect(second.cmsSyncBlocker()).toBeNull();
    await second.flushCmsOutbox();
    expect(entUpsert).toHaveBeenCalledTimes(1);
    expect(keysFor("site-A")).toEqual(["entryUpsert:e1"]);
  });

  it("hydration does not overwrite a row still in the outbox", async () => {
    const first = await pageLoad();
    first.recordServerStamp("entry:e1", "2026-10-01T00:00:00.000Z", "L0");
    entUpsert.mockRejectedValueOnce(offline());
    await first.syncEntryUpsert(item("e1", { title: "mine" }));

    const second = await pageLoad();
    colListQuery.mockResolvedValueOnce([
      {
        id: "c1", name: "Posts", slug: "posts", description: null, icon: null, displayField: null, fields: [],
        createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z",
        pageSlugPattern: null, pageSeoTitle: null, pageSeoDescription: null, pageTemplatePath: null,
      },
    ]);
    entListQuery.mockResolvedValueOnce([
      { id: "e1", data: { title: "server" }, status: "DRAFT", createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-10-02T00:00:00.000Z" },
    ]);
    loadContentItems.mockResolvedValueOnce([{ ...(item("e1", { title: "mine" }, "L0") as object) }]);
    await second.hydrateCmsFromServer();
    expect(saveContentItem).not.toHaveBeenCalled();
  });
});

describe("CMS outbox — conflicts are never silently overwritten", () => {
  it("a CONFLICT stays in the outbox, and its replay still sends the precondition", async () => {
    const first = await pageLoad();
    first.recordServerStamp("entry:e1", "2026-10-01T00:00:00.000Z", "L0");
    entUpsert.mockRejectedValueOnce(conflict());
    await first.syncEntryUpsert(item("e1"));
    expect(keysFor("site-A")).toEqual(["entryUpsert:e1"]);

    const second = await pageLoad();
    const seen: string[] = [];
    second.onCmsConflict((c) => seen.push(c.id));
    entUpsert.mockRejectedValueOnce(conflict());
    await second.flushCmsOutbox();
    expect(entUpsert).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "e1", expectedUpdatedAt: "2026-10-01T00:00:00.000Z" }),
    );
    expect(seen).toEqual(["e1"]);
    expect(keysFor("site-A")).toEqual(["entryUpsert:e1"]);
  });

  it("Keep mine sends without a precondition and clears the outbox", async () => {
    const { recordServerStamp, syncEntryUpsert, onCmsConflict } = await pageLoad();
    recordServerStamp("entry:e1", "2026-10-01T00:00:00.000Z", "L0");
    let choice: { keepMine(): Promise<unknown> } | null = null;
    onCmsConflict((c) => (choice = c));
    entUpsert.mockRejectedValueOnce(conflict());
    await syncEntryUpsert(item("e1"));
    await choice!.keepMine();
    expect(entUpsert.mock.calls.at(-1)?.[0].expectedUpdatedAt).toBeNull();
    expect(keysFor("site-A")).toEqual([]);
  });

  it("Use theirs drops the outbox op and writes the server's copy over this device's", async () => {
    const { recordServerStamp, syncEntryUpsert, onCmsConflict } = await pageLoad();
    recordServerStamp("entry:e1", "2026-10-01T00:00:00.000Z", "L0");
    let choice: { useTheirs(): Promise<void> } | null = null;
    onCmsConflict((c) => (choice = c));
    entUpsert.mockRejectedValueOnce(conflict());
    await syncEntryUpsert(item("e1", { title: "mine" }));

    colListQuery.mockResolvedValueOnce([
      {
        id: "c1", name: "Posts", slug: "posts", description: null, icon: null, displayField: null, fields: [],
        createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-09-01T00:00:00.000Z",
        pageSlugPattern: null, pageSeoTitle: null, pageSeoDescription: null, pageTemplatePath: null,
      },
    ]);
    entListQuery.mockResolvedValueOnce([
      { id: "e1", data: { title: "theirs" }, status: "DRAFT", createdAt: "2026-09-01T00:00:00.000Z", updatedAt: "2026-10-02T00:00:00.000Z" },
    ]);
    loadContentItems.mockResolvedValueOnce([item("e1", { title: "mine" })]);
    await choice!.useTheirs();
    expect(keysFor("site-A")).toEqual([]);
    expect(saveContentItem).toHaveBeenCalledWith(expect.objectContaining({ id: "e1", data: { title: "theirs" } }));
  });
});

/* The record sheet and the publish gate need to tell a CONFLICT (the server
   answered: someone else changed it) from a save that never got an answer
   (QA 2026-10-02). */
describe("CMS conflict — pending until a choice is made", () => {
  it("a conflicted entry is pending; Keep mine that lands clears it", async () => {
    const { recordServerStamp, syncEntryUpsert, onCmsConflict, isCmsConflictPending } = await pageLoad();
    recordServerStamp("entry:e1", "2026-10-01T00:00:00.000Z", "L0");
    let choice: { keepMine(): Promise<unknown> } | null = null;
    onCmsConflict((c) => (choice = c));
    entUpsert.mockRejectedValueOnce(conflict());
    await expect(syncEntryUpsert(item("e1"))).resolves.toBe(false);
    expect(isCmsConflictPending("entry", "e1")).toBe(true);
    await choice!.keepMine();
    expect(isCmsConflictPending("entry", "e1")).toBe(false);
  });

  it("Use theirs clears it; a save that never got an answer is not a conflict", async () => {
    const { recordServerStamp, syncEntryUpsert, onCmsConflict, isCmsConflictPending } = await pageLoad();
    recordServerStamp("entry:e1", "2026-10-01T00:00:00.000Z", "L0");
    let choice: { useTheirs(): Promise<void> } | null = null;
    onCmsConflict((c) => (choice = c));
    entUpsert.mockRejectedValueOnce(conflict());
    await syncEntryUpsert(item("e1"));
    colListQuery.mockResolvedValueOnce([]);
    await choice!.useTheirs();
    expect(isCmsConflictPending("entry", "e1")).toBe(false);

    entUpsert.mockRejectedValueOnce(offline());
    await expect(syncEntryUpsert(item("e2"))).resolves.toBe(false);
    expect(isCmsConflictPending("entry", "e2")).toBe(false);
  });
});

/* 8139:217560 — the record sheet offers the choice itself, so a claimed
   row's conflict skips the shell's toast; released unresolved, it goes back. */
describe("CMS conflict — a claimed row", () => {
  it("goes to the claimant, not the listeners; an unresolved release hands it back", async () => {
    const { recordServerStamp, syncEntryUpsert, onCmsConflict, claimCmsConflict } = await pageLoad();
    recordServerStamp("entry:e1", "2026-10-01T00:00:00.000Z", "L0");
    const toast = vi.fn();
    onCmsConflict(toast);
    const sheet = vi.fn();
    const release = claimCmsConflict("entry", "e1", sheet);
    entUpsert.mockRejectedValueOnce(conflict());
    await syncEntryUpsert(item("e1"));
    expect(sheet).toHaveBeenCalledTimes(1);
    expect(toast).not.toHaveBeenCalled();
    release(sheet.mock.calls[0][0]);
    expect(toast).toHaveBeenCalledWith(sheet.mock.calls[0][0]);
  });

  it("Keep mine reports whether it landed", async () => {
    const { recordServerStamp, syncEntryUpsert, claimCmsConflict } = await pageLoad();
    recordServerStamp("entry:e1", "2026-10-01T00:00:00.000Z", "L0");
    let choice: { keepMine(): Promise<boolean> } | null = null;
    claimCmsConflict("entry", "e1", (c) => (choice = c));
    entUpsert.mockRejectedValueOnce(conflict());
    await syncEntryUpsert(item("e1"));
    await expect(choice!.keepMine()).resolves.toBe(true);
  });
});

/* QA 2026-10-02: a publish blocked by an open conflict said "Retry the
   sync, then publish." — a retry cannot settle a conflict, the choice does. */
describe("publish gate — names the conflict case", () => {
  it("a conflict alone asks for the choice; with an unsent change too, both are named", async () => {
    const { recordServerStamp, syncEntryUpsert, cmsSyncBlocker } = await pageLoad();
    recordServerStamp("entry:e1", "2026-10-01T00:00:00.000Z", "L0");
    entUpsert.mockRejectedValueOnce(conflict());
    await syncEntryUpsert(item("e1"));
    expect(cmsSyncBlocker()).toBe("1 CMS change is waiting for you to choose Keep mine or Use theirs.");

    entUpsert.mockRejectedValueOnce(offline());
    await syncEntryUpsert(item("e2"));
    expect(cmsSyncBlocker()).toBe(
      "1 CMS change hasn't reached the server yet. Retry the sync, then publish. " +
        "1 CMS change is waiting for you to choose Keep mine or Use theirs.",
    );
  });
});

describe("CMS outbox — storage unavailable", () => {
  it("a throwing localStorage degrades to the in-memory queue and never throws", async () => {
    const { syncEntryUpsert, retryCmsSync, getCmsSyncPendingCount, cmsSyncBlocker, flushCmsOutbox } = await pageLoad();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    entUpsert.mockRejectedValueOnce(offline());
    await expect(syncEntryUpsert(item("e1"))).resolves.toBe(false);
    expect(getCmsSyncPendingCount()).toBe(1);
    expect(cmsSyncBlocker()).toMatch(/^1 CMS change/);
    await expect(flushCmsOutbox()).resolves.toBeUndefined();
    await retryCmsSync();
    expect(getCmsSyncPendingCount()).toBe(0);
    expect(cmsSyncBlocker()).toBeNull();
  });
});
