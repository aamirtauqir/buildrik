/**
 * Shared-theme push (E2-T5b). Verifies workspace-scoped capture (IDOR guard on
 * the source site), the NO_THEME guard, and the core push contract: locked
 * sites skipped, unlocked sites get the theme + a bumped dsSchemaVersion, and a
 * single site failure never aborts the rest (partial-fail tolerant).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const wsFindUnique = vi.fn();
const wsUpdate = vi.fn();
const siteFindFirst = vi.fn();
const siteFindMany = vi.fn();
const siteUpdate = vi.fn();
const snapCreate = vi.fn();
const snapFindMany = vi.fn();
const snapFindFirst = vi.fn();
const snapDelete = vi.fn();
const snapDeleteMany = vi.fn();
const presetUpsert = vi.fn();
const presetFindMany = vi.fn();
const presetFindFirst = vi.fn();
const presetDeleteMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    // $transaction runs the op array; mocked ops are already-resolved values.
    $transaction: (ops: unknown[]) => Promise.all(ops as Promise<unknown>[]),
    workspace: {
      findUnique: (...a: unknown[]) => wsFindUnique(...a),
      update: (...a: unknown[]) => wsUpdate(...a),
    },
    site: {
      findFirst: (...a: unknown[]) => siteFindFirst(...a),
      findMany: (...a: unknown[]) => siteFindMany(...a),
      update: (...a: unknown[]) => siteUpdate(...a),
    },
    siteThemeSnapshot: {
      create: (...a: unknown[]) => snapCreate(...a),
      findMany: (...a: unknown[]) => snapFindMany(...a),
      findFirst: (...a: unknown[]) => snapFindFirst(...a),
      delete: (...a: unknown[]) => snapDelete(...a),
      deleteMany: (...a: unknown[]) => snapDeleteMany(...a),
    },
    workspacePreset: {
      upsert: (...a: unknown[]) => presetUpsert(...a),
      findMany: (...a: unknown[]) => presetFindMany(...a),
      findFirst: (...a: unknown[]) => presetFindFirst(...a),
      deleteMany: (...a: unknown[]) => presetDeleteMany(...a),
    },
  },
}));

import {
  getSharedTheme,
  captureSharedTheme,
  pushSharedTheme,
  setSiteThemeLock,
  previewSharedThemePush,
  rollbackSiteTheme,
  listSiteThemeSnapshots,
  saveWorkspacePreset,
  applyWorkspacePreset,
  deleteWorkspacePreset,
  ThemeError,
} from "@server/services/theme.service";

beforeEach(() => {
  [wsFindUnique, wsUpdate, siteFindFirst, siteFindMany, siteUpdate, snapCreate, snapFindMany, snapFindFirst, snapDelete, snapDeleteMany, presetUpsert, presetFindMany, presetFindFirst, presetDeleteMany].forEach(
    (m) => m.mockReset(),
  );
  snapCreate.mockResolvedValue({ id: "snap" });
  snapFindMany.mockResolvedValue([]); // pruneSnapshots: under cap → no-op
});

describe("getSharedTheme", () => {
  it("returns null when no theme captured", async () => {
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: null, sharedThemeUpdatedAt: null });
    await expect(getSharedTheme("w1")).resolves.toBeNull();
  });

  it("returns styles + updatedAt when present", async () => {
    const at = new Date("2026-06-19T00:00:00Z");
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: [{ id: "t" }], sharedThemeUpdatedAt: at });
    await expect(getSharedTheme("w1")).resolves.toEqual({ styles: [{ id: "t" }], updatedAt: at });
  });
});

describe("captureSharedTheme", () => {
  it("refuses a source site outside the workspace (no workspace write)", async () => {
    siteFindFirst.mockResolvedValueOnce(null);
    await expect(captureSharedTheme("w1", "other-site")).rejects.toBeInstanceOf(ThemeError);
    expect(wsUpdate).not.toHaveBeenCalled();
  });

  it("writes the source site's projectStyles to the workspace shared theme", async () => {
    siteFindFirst.mockResolvedValueOnce({ projectStyles: [{ id: "c", value: "#fff" }] });
    wsUpdate.mockResolvedValueOnce({});
    await captureSharedTheme("w1", "s1");
    expect(siteFindFirst.mock.calls[0][0].where).toEqual({ id: "s1", workspaceId: "w1" });
    expect(wsUpdate.mock.calls[0][0].data.sharedTheme).toEqual([{ id: "c", value: "#fff" }]);
  });
});

describe("pushSharedTheme", () => {
  it("throws NO_THEME when nothing has been captured", async () => {
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: null, sharedThemeUpdatedAt: null });
    await expect(pushSharedTheme("w1")).rejects.toMatchObject({ code: "NO_THEME" });
    expect(siteFindMany).not.toHaveBeenCalled();
  });

  it("skips locked sites, pushes unlocked (bumping dsSchemaVersion), survives a single failure", async () => {
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: [{ id: "t" }], sharedThemeUpdatedAt: new Date() });
    siteFindMany.mockResolvedValueOnce([
      { id: "locked", name: "Locked", themeLocked: true, dsSchemaVersion: 5 },
      { id: "ok", name: "Ok", themeLocked: false, dsSchemaVersion: 2 },
      { id: "boom", name: "Boom", themeLocked: false, dsSchemaVersion: 0 },
    ]);
    siteUpdate.mockImplementation((args: { where: { id: string } }) =>
      args.where.id === "boom" ? Promise.reject(new Error("db down")) : Promise.resolve({}),
    );

    const results = await pushSharedTheme("w1");

    expect(results).toEqual([
      { siteId: "locked", name: "Locked", status: "skipped-locked" },
      { siteId: "ok", name: "Ok", status: "pushed" },
      { siteId: "boom", name: "Boom", status: "failed", error: "db down" },
    ]);
    // locked site never written; the pushed site bumped its version 2 → 3.
    const updatedIds = siteUpdate.mock.calls.map((c) => c[0].where.id);
    expect(updatedIds).toEqual(["ok", "boom"]);
    expect(siteUpdate.mock.calls[0][0].data.dsSchemaVersion).toBe(3);
  });

  it("scopes targets to the passed siteIds", async () => {
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: [{ id: "t" }], sharedThemeUpdatedAt: new Date() });
    siteFindMany.mockResolvedValueOnce([]);
    await pushSharedTheme("w1", ["a", "b"]);
    expect(siteFindMany.mock.calls[0][0].where).toMatchObject({
      workspaceId: "w1",
      id: { in: ["a", "b"] },
    });
  });
});

describe("setSiteThemeLock", () => {
  it("refuses a site outside the workspace", async () => {
    siteFindFirst.mockResolvedValueOnce(null);
    await expect(setSiteThemeLock("w1", "x", true)).rejects.toBeInstanceOf(ThemeError);
    expect(siteUpdate).not.toHaveBeenCalled();
  });
});

describe("pushSharedTheme — D2 snapshot", () => {
  it("snapshots each unlocked site's current tokens before overwriting", async () => {
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: [{ id: "t" }], sharedThemeUpdatedAt: new Date() });
    siteFindMany.mockResolvedValueOnce([
      { id: "locked", name: "L", themeLocked: true, dsSchemaVersion: 5, projectStyles: [{ old: 1 }] },
      { id: "ok", name: "Ok", themeLocked: false, dsSchemaVersion: 2, projectStyles: [{ old: 2 }] },
    ]);
    siteUpdate.mockResolvedValue({});
    await pushSharedTheme("w1");
    // locked site is NOT snapshotted (never overwritten); unlocked is.
    expect(snapCreate).toHaveBeenCalledOnce();
    expect(snapCreate.mock.calls[0][0].data).toMatchObject({
      siteId: "ok",
      workspaceId: "w1",
      prevStyles: [{ old: 2 }],
      prevDsSchemaVersion: 2,
    });
  });
});

describe("previewSharedThemePush (D1)", () => {
  it("throws NO_THEME when nothing captured", async () => {
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: null, sharedThemeUpdatedAt: null });
    await expect(previewSharedThemePush("w1")).rejects.toMatchObject({ code: "NO_THEME" });
  });

  it("flags willChange per site and marks locked sites skipped, writing nothing", async () => {
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: [{ id: "t", v: "new" }], sharedThemeUpdatedAt: new Date() });
    siteFindMany.mockResolvedValueOnce([
      { id: "same", name: "Same", themeLocked: false, projectStyles: [{ id: "t", v: "new" }] },
      { id: "diff", name: "Diff", themeLocked: false, projectStyles: [{ id: "t", v: "old" }] },
      { id: "lock", name: "Lock", themeLocked: true, projectStyles: [{ id: "t", v: "old" }] },
    ]);
    const res = await previewSharedThemePush("w1");
    expect(res).toEqual([
      { siteId: "same", name: "Same", status: "would-push", willChange: false },
      { siteId: "diff", name: "Diff", status: "would-push", willChange: true },
      { siteId: "lock", name: "Lock", status: "skipped-locked", willChange: false },
    ]);
    expect(siteUpdate).not.toHaveBeenCalled();
  });
});

describe("rollbackSiteTheme (D2)", () => {
  it("refuses a site outside the workspace", async () => {
    siteFindFirst.mockResolvedValueOnce(null);
    await expect(rollbackSiteTheme("w1", "x")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws NO_THEME when there is no snapshot to roll back to", async () => {
    siteFindFirst.mockResolvedValueOnce({ id: "s1", dsSchemaVersion: 4 });
    snapFindFirst.mockResolvedValueOnce(null);
    await expect(rollbackSiteTheme("w1", "s1")).rejects.toMatchObject({ code: "NO_THEME" });
  });

  it("restores prev tokens, bumps version, consumes the snapshot", async () => {
    siteFindFirst.mockResolvedValueOnce({ id: "s1", dsSchemaVersion: 4 });
    snapFindFirst.mockResolvedValueOnce({ id: "snap1", prevStyles: [{ was: 1 }], createdAt: new Date("2026-06-20T00:00:00Z") });
    siteUpdate.mockResolvedValue({});
    snapDelete.mockResolvedValue({});
    const res = await rollbackSiteTheme("w1", "s1");
    expect(siteUpdate.mock.calls[0][0].data).toMatchObject({ projectStyles: [{ was: 1 }], dsSchemaVersion: 5 });
    expect(snapDelete.mock.calls[0][0].where).toEqual({ id: "snap1" });
    expect(res.rolledBackTo).toBeInstanceOf(Date);
  });
});

describe("listSiteThemeSnapshots (D2)", () => {
  it("refuses a site outside the workspace", async () => {
    siteFindFirst.mockResolvedValueOnce(null);
    await expect(listSiteThemeSnapshots("w1", "x")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns the history newest-first, scoped to the workspace", async () => {
    siteFindFirst.mockResolvedValueOnce({ id: "s1" });
    snapFindMany.mockResolvedValueOnce([{ id: "a", createdAt: new Date() }]);
    const res = await listSiteThemeSnapshots("w1", "s1");
    expect(res).toHaveLength(1);
    expect(snapFindMany.mock.calls[0][0].where).toEqual({ siteId: "s1", workspaceId: "w1" });
  });
});

describe("workspace presets (D4)", () => {
  it("saveWorkspacePreset refuses a source site outside the workspace", async () => {
    siteFindFirst.mockResolvedValueOnce(null);
    await expect(saveWorkspacePreset("w1", "Brand A", "other")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(presetUpsert).not.toHaveBeenCalled();
  });

  it("saveWorkspacePreset upserts the site's tokens under the name", async () => {
    siteFindFirst.mockResolvedValueOnce({ projectStyles: [{ id: "t", v: 1 }] });
    presetUpsert.mockResolvedValueOnce({});
    const res = await saveWorkspacePreset("w1", "Brand A", "s1", "u1");
    expect(res).toEqual({ name: "Brand A" });
    expect(presetUpsert.mock.calls[0][0].where).toEqual({ workspaceId_name: { workspaceId: "w1", name: "Brand A" } });
    expect(presetUpsert.mock.calls[0][0].create).toMatchObject({ workspaceId: "w1", name: "Brand A", createdBy: "u1" });
  });

  it("applyWorkspacePreset copies a preset's tokens into the shared theme", async () => {
    presetFindFirst.mockResolvedValueOnce({ styles: [{ id: "t", v: 2 }] });
    wsUpdate.mockResolvedValueOnce({});
    await applyWorkspacePreset("w1", "p1");
    expect(presetFindFirst.mock.calls[0][0].where).toEqual({ id: "p1", workspaceId: "w1" });
    expect(wsUpdate.mock.calls[0][0].data.sharedTheme).toEqual([{ id: "t", v: 2 }]);
  });

  it("applyWorkspacePreset throws NOT_FOUND for a missing preset", async () => {
    presetFindFirst.mockResolvedValueOnce(null);
    await expect(applyWorkspacePreset("w1", "ghost")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(wsUpdate).not.toHaveBeenCalled();
  });

  it("deleteWorkspacePreset is workspace-scoped + no-op safe", async () => {
    presetDeleteMany.mockResolvedValueOnce({ count: 0 });
    const res = await deleteWorkspacePreset("w1", "p1");
    expect(res).toEqual({ ok: true });
    expect(presetDeleteMany.mock.calls[0][0].where).toEqual({ id: "p1", workspaceId: "w1" });
  });
});
