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

vi.mock("../api-client", () => ({
  getBuildrikClient: () => ({
    siteComponents: {
      upsert: { mutate: upsert },
      delete: { mutate: del },
      list: { query: list },
      get: { query: get },
    },
  }),
}));
vi.mock("../../shared/utils/runtimeEnv", () => ({ DASHBOARD_URL: "http://localhost:3000" }));

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
  onComponentSyncError,
  retryComponentSync,
  getComponentSyncPendingCount,
} from "../componentSync";

beforeEach(async () => {
  window.history.replaceState({}, "", "/edit/site-123");
  [upsert, del, list, get, loadComponents, saveComponent].forEach((m) => m.mockReset());
  // The retry queue is module-level shared state; flush anything a prior test
  // left queued (reset mocks now resolve) so each test starts from empty, then
  // clear the call history the flush incurred so per-test counts start at 0.
  await retryComponentSync();
  [upsert, del].forEach((m) => m.mockClear());
});

const comp = (id: string, name = "Card") => ({ id, name }) as never;

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

  it("hydrate writes server components not already local, skipping existing ids", async () => {
    list.mockResolvedValueOnce([{ componentId: "srv1" }, { componentId: "local1" }]);
    loadComponents.mockResolvedValueOnce([{ id: "local1" }]); // already local → skip
    get.mockResolvedValueOnce({ id: "srv1", name: "Server one" });
    await hydrateComponentsFromServer();
    expect(get).toHaveBeenCalledTimes(1);
    expect(saveComponent).toHaveBeenCalledTimes(1);
    expect(saveComponent.mock.calls[0][0]).toMatchObject({ id: "srv1" });
    expect(saveComponent.mock.calls[0][1]).toBe("site-123"); // projectId
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
