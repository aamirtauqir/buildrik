/**
 * Version-history sync (#3/26). The editor mirrors VERSION_CREATED/DELETED to
 * the server and hydrates server versions into the local cache. Mirrors must be
 * best-effort (never throw into the engine) and surface failures (not silent).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const create = vi.fn();
const del = vi.fn();
const list = vi.fn();
const get = vi.fn();

vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({
    siteVersions: {
      create: { mutate: create },
      delete: { mutate: del },
      list: { query: list },
      get: { query: get },
    },
  }),
}));
vi.mock("../../shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000" }));

const loadVersions = vi.fn();
const saveVersion = vi.fn();
vi.mock("../../engine/storage/VersionHistoryStorage", () => ({
  loadVersions: (...a: unknown[]) => loadVersions(...a),
  saveVersion: (...a: unknown[]) => saveVersion(...a),
}));

import {
  mirrorVersionCreate,
  mirrorVersionDelete,
  hydrateVersionsFromServer,
  onVersionSyncError,
  retryVersionSync,
  getVersionSyncPendingCount,
} from "../versionSync";

beforeEach(async () => {
  window.history.replaceState({}, "", "/edit/site-123");
  [create, del, list, get, loadVersions, saveVersion].forEach((m) => m.mockReset());
  // The retry queue is module-level shared state; flush anything a prior test
  // left queued (reset mocks now resolve) so each test starts from empty, then
  // clear the call history the flush incurred so per-test counts start at 0.
  await retryVersionSync();
  [create, del].forEach((m) => m.mockClear());
});

const ver = (id: string, name = "V") =>
  ({ id, name, snapshot: {}, createdAt: 0, isAutoCheckpoint: false }) as never;

describe("versionSync", () => {
  it("mirrors a created version to siteVersions.create with the URL siteId", async () => {
    await mirrorVersionCreate(ver("v1", "First"), false);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: "site-123",
        versionId: "v1",
        name: "First",
        isAuto: false,
        payload: expect.objectContaining({ id: "v1" }),
      })
    );
  });

  it("mirrors a deletion to siteVersions.delete", async () => {
    await mirrorVersionDelete("v9");
    expect(del).toHaveBeenCalledWith({ siteId: "site-123", versionId: "v9" });
  });

  it("a failed create notifies subscribers + never throws (best-effort)", async () => {
    create.mockRejectedValueOnce(new Error("network down"));
    const heard: number[] = [];
    const off = onVersionSyncError(() => heard.push(1));
    await expect(mirrorVersionCreate(ver("v1"), true)).resolves.toBeUndefined();
    expect(heard).toEqual([1]);
    off();
  });

  it("hydrate writes server versions not already local, skipping existing ids", async () => {
    list.mockResolvedValueOnce([{ versionId: "srv1" }, { versionId: "local1" }]);
    loadVersions.mockResolvedValueOnce([{ id: "local1" }]); // already local → skip
    get.mockResolvedValueOnce({ id: "srv1", name: "Server one", snapshot: {}, createdAt: 0 });
    await hydrateVersionsFromServer();
    expect(get).toHaveBeenCalledTimes(1);
    expect(saveVersion).toHaveBeenCalledTimes(1);
    expect(saveVersion.mock.calls[0][0]).toMatchObject({ id: "srv1", projectId: "site-123" });
  });

  it("no-ops when not on an /edit/<siteId> URL", async () => {
    window.history.replaceState({}, "", "/dashboard");
    await mirrorVersionCreate(ver("v1"), false);
    expect(create).not.toHaveBeenCalled();
    await mirrorVersionDelete("v9");
    expect(del).not.toHaveBeenCalled();
  });

  it("resolves the siteId from the legacy ?siteId= URL", async () => {
    window.history.replaceState({}, "", "/?siteId=legacy-7");
    await mirrorVersionCreate(ver("v1"), false);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ siteId: "legacy-7" }));
  });
});

// AUDIT P1-1 (2026-07-16) — FIXED: versionSync now shares cmsSync's retry queue
// (SyncRetryQueue). A failed mirror is queued (not dropped), notified, and
// replayed on reconnect ('online') / retryVersionSync().
describe("versionSync failure semantics (audit P1-1 — retry queue)", () => {
  it("a failed create warns, notifies, and queues (no auto-retry until reconnect)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    create.mockRejectedValueOnce(new Error("network down"));
    const heard: number[] = [];
    const off = onVersionSyncError(() => heard.push(1));
    await mirrorVersionCreate(ver("v1"), false);
    expect(create).toHaveBeenCalledTimes(1); // queued, not re-fired synchronously
    expect(heard).toEqual([1]);
    expect(getVersionSyncPendingCount()).toBe(1); // kept for retry, not dropped
    expect(warn).toHaveBeenCalledWith(
      "[version-sync] create mirror failed (kept locally)",
      expect.any(Error)
    );
    off();
    warn.mockRestore();
  });

  it("BUG P1-1 FIXED: a queued failed mirror is replayed on retry, then clears", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    create.mockRejectedValueOnce(new Error("network down"));
    await mirrorVersionCreate(ver("v1", "First"), false);
    expect(getVersionSyncPendingCount()).toBe(1);

    // create now resolves (reset default) — retry re-sends the SAME payload.
    await retryVersionSync();
    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenLastCalledWith(
      expect.objectContaining({ siteId: "site-123", versionId: "v1", name: "First" })
    );
    expect(getVersionSyncPendingCount()).toBe(0);
    warn.mockRestore();
  });

  it("BUG P1-1 FIXED: the window 'online' event auto-drains the queue", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    create.mockRejectedValueOnce(new Error("offline"));
    await mirrorVersionCreate(ver("v1"), false);
    expect(getVersionSyncPendingCount()).toBe(1);

    window.dispatchEvent(new Event("online")); // create resolves now → flush
    await vi.waitFor(() => expect(getVersionSyncPendingCount()).toBe(0));
    warn.mockRestore();
  });

  it("BUG FIXED: mirrorVersionDelete failure fires onVersionSyncError + queues", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    del.mockRejectedValueOnce(new Error("network down"));
    const heard: number[] = [];
    const off = onVersionSyncError(() => heard.push(1));
    await expect(mirrorVersionDelete("v9")).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith("[version-sync] delete mirror failed", expect.any(Error));
    expect(heard).toEqual([1]); // delete failures now surface to the toast layer
    expect(getVersionSyncPendingCount()).toBe(1);

    await retryVersionSync(); // del resolves now → drains
    expect(del).toHaveBeenLastCalledWith({ siteId: "site-123", versionId: "v9" });
    expect(getVersionSyncPendingCount()).toBe(0);
    off();
    warn.mockRestore();
  });

  it("a delete drops a pending create for the same version (no resurrection on retry)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    create.mockRejectedValueOnce(new Error("down"));
    await mirrorVersionCreate(ver("vx"), false);
    expect(getVersionSyncPendingCount()).toBe(1);

    await mirrorVersionDelete("vx"); // del resolves (reset default)
    expect(getVersionSyncPendingCount()).toBe(0); // pending create dropped

    create.mockClear();
    await retryVersionSync();
    expect(create).not.toHaveBeenCalled(); // deleted version never resurrected
    warn.mockRestore();
  });

  it("an unsubscribed listener stops receiving failures", async () => {
    create.mockRejectedValue(new Error("down"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const heard: number[] = [];
    const off = onVersionSyncError(() => heard.push(1));
    await mirrorVersionCreate(ver("v1"), false);
    off();
    await mirrorVersionCreate(ver("v2"), false);
    expect(heard).toEqual([1]);
    create.mockReset();
    warn.mockRestore();
  });

  it("a throwing subscriber does not break the sync layer or other subscribers", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    create.mockRejectedValueOnce(new Error("down"));
    const heard: number[] = [];
    const offBad = onVersionSyncError(() => {
      throw new Error("subscriber exploded");
    });
    const offGood = onVersionSyncError(() => heard.push(2));
    await expect(mirrorVersionCreate(ver("v1"), false)).resolves.toBeUndefined();
    expect(heard).toEqual([2]);
    offBad();
    offGood();
    warn.mockRestore();
  });
});

describe("versionSync hydrate edge paths", () => {
  it("returns the number of versions added", async () => {
    list.mockResolvedValueOnce([{ versionId: "a" }, { versionId: "b" }]);
    loadVersions.mockResolvedValueOnce([]);
    get.mockResolvedValueOnce({ id: "a" }).mockResolvedValueOnce({ id: "b" });
    await expect(hydrateVersionsFromServer()).resolves.toBe(2);
    expect(saveVersion).toHaveBeenCalledTimes(2);
  });

  it("skips a version whose payload fetch returns null (not counted, not saved)", async () => {
    list.mockResolvedValueOnce([{ versionId: "a" }]);
    loadVersions.mockResolvedValueOnce([]);
    get.mockResolvedValueOnce(null);
    await expect(hydrateVersionsFromServer()).resolves.toBe(0);
    expect(saveVersion).not.toHaveBeenCalled();
  });

  it("short-circuits without reading local storage when the server has no versions", async () => {
    list.mockResolvedValueOnce([]);
    await expect(hydrateVersionsFromServer()).resolves.toBe(0);
    expect(loadVersions).not.toHaveBeenCalled();
  });

  it("a failed hydrate warns + resolves 0 — never throws into editor open", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    list.mockRejectedValueOnce(new Error("offline"));
    await expect(hydrateVersionsFromServer()).resolves.toBe(0);
    expect(warn).toHaveBeenCalledWith("[version-sync] hydrate from server failed", expect.any(Error));
    warn.mockRestore();
  });

  it("no-ops (returns 0) when unauthenticated/outside the editor URL", async () => {
    window.history.replaceState({}, "", "/dashboard");
    await expect(hydrateVersionsFromServer()).resolves.toBe(0);
    expect(list).not.toHaveBeenCalled();
  });
});
