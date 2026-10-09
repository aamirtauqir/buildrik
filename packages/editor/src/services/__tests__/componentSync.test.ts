/**
 * Component-master sync (#4/27). The editor mirrors COMPONENT_CREATED/UPDATED/
 * DELETED to the server and hydrates server components into the local cache.
 * Mirrors are best-effort (never throw) and surface failures (not silent).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const upsert = vi.fn();
const del = vi.fn();
const list = vi.fn();
const get = vi.fn();
const library = vi.fn();
const libraryGet = vi.fn();

vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({
    siteComponents: {
      upsert: { mutate: upsert },
      delete: { mutate: del },
      list: { query: list },
      get: { query: get },
      library: { query: library },
      libraryGet: { query: libraryGet },
    },
  }),
}));
vi.mock("../../shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000", IS_DEV_BUILD: false }));

const loadComponents = vi.fn();
const saveComponent = vi.fn();
vi.mock("../../engine/components/ComponentStorage", () => ({
  loadComponents: (...a: unknown[]) => loadComponents(...a),
  saveComponent: (...a: unknown[]) => saveComponent(...a),
}));

import {
  mirrorComponentUpsert,
  mirrorComponentDelete,
  hydrateComponentsFromServer,
  getComponentHydrationStatus,
  onComponentSyncError,
  retryComponentSync,
  getComponentSyncPendingCount,
  fetchComponentLibrary,
  fetchLibraryComponent,
} from "../componentSync";
import { recordServerStamp } from "../syncRetryQueue";

beforeEach(async () => {
  window.history.replaceState({}, "", "/edit/site-123");
  [upsert, del, list, get, loadComponents, saveComponent].forEach((m) => m.mockReset());
  localStorage.removeItem("bk-sync-stamps-v1");
  localStorage.removeItem("bk-sync-stamp-migrations-v1");
  // The server answers an upsert with its row's updatedAt (C-4 stamps).
  upsert.mockResolvedValue({ componentId: "x", updatedAt: new Date(0) });
  // The retry queue is module-level shared state; flush anything a prior test
  // left queued (reset mocks now resolve) so each test starts from empty, then
  // clear the call history the flush incurred so per-test counts start at 0.
  await retryComponentSync();
  [upsert, del].forEach((m) => m.mockClear());
});

const comp = (id: string, name = "Card") => ({ id, name }) as never;
/** This site's one-time pre-stamp pass already ran in this browser. */
const migrated = () => localStorage.setItem("bk-sync-stamp-migrations-v1", JSON.stringify(["component:site-123"]));
const stamps = (): Record<string, { server: string; local: string }> =>
  JSON.parse(localStorage.getItem("bk-sync-stamps-v1") ?? "{}");

/* Masters hydrated or mirrored before stamps existed have none. */
describe("componentSync — a mirror answered without a row", () => {
  it("is a success, not a queued failure, and records no stamp", async () => {
    const onErr = vi.fn();
    const off = onComponentSyncError(onErr);
    upsert.mockResolvedValueOnce(undefined);
    await mirrorComponentUpsert(comp("nr"));
    expect(onErr).not.toHaveBeenCalled();
    expect(getComponentSyncPendingCount()).toBe(0);
    expect(localStorage.getItem("bk-sync-stamps-v1")).toBeNull();
    off();
  });
});

describe("componentSync — unstamped masters (C-4)", () => {
  it("first hydrate for this site: an older unstamped master takes the server's copy once (one get) and is stamped", async () => {
    list.mockResolvedValueOnce([{ componentId: "old", updatedAt: new Date(9000) }]);
    loadComponents.mockResolvedValueOnce([{ id: "old", name: "Stale", updatedAt: 1000 }]);
    get.mockResolvedValueOnce({ id: "old", name: "Teammate's", updatedAt: 8000 });
    await expect(hydrateComponentsFromServer()).resolves.toBe(1);
    expect(get).toHaveBeenCalledTimes(1);
    expect(saveComponent.mock.calls[0][0]).toMatchObject({ name: "Teammate's" });
    expect(stamps()["component:old"]).toBeDefined();
    expect(JSON.parse(localStorage.getItem("bk-sync-stamp-migrations-v1") ?? "[]")).toContain("component:site-123");
  });

  it("after the pass, an unstamped master equal to the server's is adopted (one get) — the next server edit arrives", async () => {
    migrated();
    const same = { id: "m", name: "Card", tree: { a: 1 }, updatedAt: 5 };
    list.mockResolvedValueOnce([{ componentId: "m", updatedAt: new Date(3000) }]);
    loadComponents.mockResolvedValue([same]);
    get.mockResolvedValueOnce({ ...same });
    await expect(hydrateComponentsFromServer()).resolves.toBe(0);
    expect(get).toHaveBeenCalledTimes(1);
    expect(stamps()["component:m"]).toEqual({ server: new Date(3000).toISOString(), local: "5" });
    list.mockResolvedValueOnce([{ componentId: "m", updatedAt: new Date(4000) }]);
    get.mockResolvedValueOnce({ ...same, name: "Renamed", updatedAt: 6 });
    await expect(hydrateComponentsFromServer()).resolves.toBe(1);
  });

  it("a master skipped for a queued mirror leaves the scope due, so the pass re-runs", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    upsert.mockRejectedValueOnce(new Error("offline"));
    await mirrorComponentUpsert({ id: "q", name: "Mine", updatedAt: 1 } as never);
    list.mockResolvedValueOnce([{ componentId: "q", updatedAt: new Date(9000) }]);
    loadComponents.mockResolvedValueOnce([{ id: "q", name: "Mine", updatedAt: 1 }]);
    await expect(hydrateComponentsFromServer()).resolves.toBe(0);
    const marks = () => JSON.parse(localStorage.getItem("bk-sync-stamp-migrations-v1") ?? "[]");
    expect(marks()).not.toContain("component:site-123");
    await retryComponentSync();
    list.mockResolvedValueOnce([]);
    await hydrateComponentsFromServer();
    expect(marks()).toContain("component:site-123");
    warn.mockRestore();
  });

  it("after the pass, an unstamped master that differs stays local and unstamped", async () => {
    migrated();
    list.mockResolvedValueOnce([{ componentId: "d", updatedAt: new Date(3000) }]);
    loadComponents.mockResolvedValueOnce([{ id: "d", name: "Mine", updatedAt: 5 }]);
    get.mockResolvedValueOnce({ id: "d", name: "Theirs", updatedAt: 9 });
    await expect(hydrateComponentsFromServer()).resolves.toBe(0);
    expect(saveComponent).not.toHaveBeenCalled();
    expect(stamps()["component:d"]).toBeUndefined();
  });
});

describe("componentSync", () => {
  it("mirrors an upsert to siteComponents.upsert with the URL siteId", async () => {
    await mirrorComponentUpsert(comp("c1", "Hero"));
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: "site-123",
        componentId: "c1",
        name: "Hero",
        payload: expect.objectContaining({ id: "c1" }),
      })
    );
  });

  it("mirrors a deletion to siteComponents.delete", async () => {
    await mirrorComponentDelete("c9");
    expect(del).toHaveBeenCalledWith({ siteId: "site-123", componentId: "c9" });
  });

  it("a failed upsert notifies subscribers + never throws", async () => {
    upsert.mockRejectedValueOnce(new Error("network down"));
    const heard: number[] = [];
    const off = onComponentSyncError(() => heard.push(1));
    await expect(mirrorComponentUpsert(comp("c1"))).resolves.toBeUndefined();
    expect(heard).toEqual([1]);
    off();
  });

  /* C-4 / PD-36: server-first on the SERVER's clock (stamps) — the additive
     pass skipped every id already local, so a teammate's edit to a shared
     master never arrived. */
  it("hydrate writes missing masters and server-moved confirmed ones; keeps unconfirmed and unchanged ones", async () => {
    migrated();
    recordServerStamp("component:moved", new Date(1000), 50);   // confirmed, local unchanged (50), server moved to 9000
    recordServerStamp("component:same", new Date(1000), 60);    // confirmed, server unchanged
    recordServerStamp("component:edited", new Date(1000), 70);  // confirmed, then edited locally (71)
    list.mockResolvedValueOnce([
      { componentId: "srv1", updatedAt: new Date(1000) },
      { componentId: "moved", updatedAt: new Date(9000) },
      { componentId: "same", updatedAt: new Date(1000) },
      { componentId: "edited", updatedAt: new Date(9000) },
      { componentId: "never", updatedAt: new Date(9000) },     // local, no stamp
    ]);
    loadComponents.mockResolvedValueOnce([
      { id: "moved", updatedAt: 50 },
      { id: "same", updatedAt: 60 },
      { id: "edited", updatedAt: 71 },
      { id: "never", updatedAt: 1 },
    ]);
    get
      .mockResolvedValueOnce({ id: "srv1", name: "Server one", updatedAt: 5 })
      .mockResolvedValueOnce({ id: "moved", name: "Edited on server", updatedAt: 6 });
    await expect(hydrateComponentsFromServer()).resolves.toBe(2);
    expect(saveComponent.mock.calls.map((c) => c[0].id)).toEqual(["srv1", "moved"]);
    expect(saveComponent.mock.calls[0][1]).toBe("site-123"); // projectId
    expect(getComponentHydrationStatus()).toBe("ready");
  });

  it("client clock ahead or behind does not matter — only the stamp does", async () => {
    upsert.mockResolvedValueOnce({ componentId: "c", updatedAt: new Date(1000) });
    // local clock far AHEAD of the server's
    await mirrorComponentUpsert({ id: "c", name: "Card", updatedAt: Date.parse("2099-01-01") } as never);
    list.mockResolvedValueOnce([{ componentId: "c", updatedAt: new Date(2000) }]);
    loadComponents.mockResolvedValueOnce([{ id: "c", updatedAt: Date.parse("2099-01-01") }]);
    get.mockResolvedValueOnce({ id: "c", updatedAt: 1 });
    await expect(hydrateComponentsFromServer()).resolves.toBe(1);
  });

  it("a failed hydrate says so through the status", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    list.mockRejectedValueOnce(new Error("offline"));
    await expect(hydrateComponentsFromServer()).resolves.toBe(0);
    expect(getComponentHydrationStatus()).toBe("error");
    warn.mockRestore();
  });

  it("no-ops when not on an /edit/<siteId> URL", async () => {
    window.history.replaceState({}, "", "/dashboard");
    await mirrorComponentUpsert(comp("c1"));
    expect(upsert).not.toHaveBeenCalled();
    await mirrorComponentDelete("c9");
    expect(del).not.toHaveBeenCalled();
  });

  it("resolves the siteId from the legacy ?siteId= URL", async () => {
    window.history.replaceState({}, "", "/?siteId=legacy-7");
    await mirrorComponentUpsert(comp("c1", "Hero"));
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ siteId: "legacy-7" }));
  });
});

// AUDIT P1-1 (2026-07-16) — FIXED: componentSync now shares cmsSync's retry
// queue (SyncRetryQueue). A failed mirror is queued (not dropped), notified,
// and replayed on reconnect ('online') / retryComponentSync().
describe("componentSync failure semantics (audit P1-1 — retry queue)", () => {
  it("a failed upsert warns, notifies, and queues (no auto-retry until reconnect)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    upsert.mockRejectedValueOnce(new Error("network down"));
    const heard: number[] = [];
    const off = onComponentSyncError(() => heard.push(1));
    await mirrorComponentUpsert(comp("c1"));
    expect(upsert).toHaveBeenCalledTimes(1); // queued, not re-fired synchronously
    expect(heard).toEqual([1]);
    expect(getComponentSyncPendingCount()).toBe(1); // kept for retry, not dropped
    expect(warn).toHaveBeenCalledWith(
      "[component-sync] upsert mirror failed (kept locally)",
      expect.any(Error)
    );
    off();
    warn.mockRestore();
  });

  it("BUG P1-1 FIXED: a queued failed mirror is replayed on retry, then clears", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    upsert.mockRejectedValueOnce(new Error("network down"));
    await mirrorComponentUpsert(comp("c1", "Hero"));
    expect(getComponentSyncPendingCount()).toBe(1);

    // upsert now resolves (reset default) — retry re-sends the SAME payload.
    await retryComponentSync();
    expect(upsert).toHaveBeenCalledTimes(2);
    expect(upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({ siteId: "site-123", componentId: "c1", name: "Hero" })
    );
    expect(getComponentSyncPendingCount()).toBe(0);
    warn.mockRestore();
  });

  it("BUG P1-1 FIXED: the window 'online' event auto-drains the queue", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    upsert.mockRejectedValueOnce(new Error("offline"));
    await mirrorComponentUpsert(comp("c1"));
    expect(getComponentSyncPendingCount()).toBe(1);

    window.dispatchEvent(new Event("online")); // upsert resolves now → flush
    await vi.waitFor(() => expect(getComponentSyncPendingCount()).toBe(0));
    warn.mockRestore();
  });

  it("BUG FIXED: mirrorComponentDelete failure fires onComponentSyncError + queues", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    del.mockRejectedValueOnce(new Error("network down"));
    const heard: number[] = [];
    const off = onComponentSyncError(() => heard.push(1));
    await expect(mirrorComponentDelete("c9")).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith("[component-sync] delete mirror failed", expect.any(Error));
    expect(heard).toEqual([1]); // delete failures now surface to the toast layer
    expect(getComponentSyncPendingCount()).toBe(1);

    await retryComponentSync(); // del resolves now → drains
    expect(del).toHaveBeenLastCalledWith({ siteId: "site-123", componentId: "c9" });
    expect(getComponentSyncPendingCount()).toBe(0);
    off();
    warn.mockRestore();
  });

  it("a delete drops a pending upsert for the same component (no resurrection on retry)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    upsert.mockRejectedValueOnce(new Error("down"));
    await mirrorComponentUpsert(comp("cx"));
    expect(getComponentSyncPendingCount()).toBe(1);

    await mirrorComponentDelete("cx"); // del resolves (reset default)
    expect(getComponentSyncPendingCount()).toBe(0); // pending upsert dropped

    upsert.mockClear();
    await retryComponentSync();
    expect(upsert).not.toHaveBeenCalled(); // deleted master never resurrected
    warn.mockRestore();
  });

  it("a throwing subscriber does not break the sync layer or other subscribers", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    upsert.mockRejectedValueOnce(new Error("down"));
    const heard: number[] = [];
    const offBad = onComponentSyncError(() => {
      throw new Error("subscriber exploded");
    });
    const offGood = onComponentSyncError(() => heard.push(2));
    await expect(mirrorComponentUpsert(comp("c1"))).resolves.toBeUndefined();
    expect(heard).toEqual([2]);
    offBad();
    offGood();
    warn.mockRestore();
  });
});

describe("componentSync hydrate edge paths", () => {
  it("returns the number of components added", async () => {
    list.mockResolvedValueOnce([{ componentId: "a" }, { componentId: "b" }]);
    loadComponents.mockResolvedValueOnce([]);
    get.mockResolvedValueOnce({ id: "a" }).mockResolvedValueOnce({ id: "b" });
    await expect(hydrateComponentsFromServer()).resolves.toBe(2);
    expect(saveComponent).toHaveBeenCalledTimes(2);
  });

  it("skips a component whose payload fetch returns null (not counted, not saved)", async () => {
    list.mockResolvedValueOnce([{ componentId: "a" }]);
    loadComponents.mockResolvedValueOnce([]);
    get.mockResolvedValueOnce(null);
    await expect(hydrateComponentsFromServer()).resolves.toBe(0);
    expect(saveComponent).not.toHaveBeenCalled();
  });

  it("short-circuits without reading local storage when the server has no components", async () => {
    list.mockResolvedValueOnce([]);
    await expect(hydrateComponentsFromServer()).resolves.toBe(0);
    expect(loadComponents).not.toHaveBeenCalled();
  });

  it("a failed hydrate warns + resolves 0 — never throws into editor open", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    list.mockRejectedValueOnce(new Error("offline"));
    await expect(hydrateComponentsFromServer()).resolves.toBe(0);
    expect(warn).toHaveBeenCalledWith("[component-sync] hydrate from server failed", expect.any(Error));
    warn.mockRestore();
  });

  it("no-ops (returns 0) when unauthenticated/outside the editor URL", async () => {
    window.history.replaceState({}, "", "/dashboard");
    await expect(hydrateComponentsFromServer()).resolves.toBe(0);
    expect(list).not.toHaveBeenCalled();
  });
});

describe("componentSync — G2-118 scope + library", () => {
  it("sends the master's page scope; a site-wide master sends null", async () => {
    await mirrorComponentUpsert({ id: "c1", name: "Hero", pageId: "page-home" } as never);
    expect(upsert).toHaveBeenLastCalledWith(expect.objectContaining({ componentId: "c1", pageId: "page-home" }));
    await mirrorComponentUpsert(comp("c2"));
    expect(upsert).toHaveBeenLastCalledWith(expect.objectContaining({ componentId: "c2", pageId: null }));
  });

  it("reads the library for the URL site, and [] when the read fails", async () => {
    library.mockResolvedValueOnce([{ componentId: "b", name: "Button", siteCount: 2, onThisSite: false, updatedAt: new Date() }]);
    await expect(fetchComponentLibrary()).resolves.toEqual([{ componentId: "b", name: "Button", siteCount: 2, onThisSite: false }]);
    expect(library).toHaveBeenCalledWith({ siteId: "site-123" });
    library.mockRejectedValueOnce(new Error("offline"));
    await expect(fetchComponentLibrary()).resolves.toEqual([]);
  });

  it("fetches one library master's definition for this site", async () => {
    libraryGet.mockResolvedValueOnce({ id: "b", name: "Button" });
    await expect(fetchLibraryComponent("b")).resolves.toEqual({ id: "b", name: "Button" });
    expect(libraryGet).toHaveBeenCalledWith({ siteId: "site-123", componentId: "b" });
  });
});
