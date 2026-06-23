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
} from "../versionSync";

beforeEach(() => {
  window.history.replaceState({}, "", "/edit/site-123");
  [create, del, list, get, loadVersions, saveVersion].forEach((m) => m.mockReset());
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
  });
});
