/**
 * Shared-theme push (E2-T5b). Verifies workspace-scoped capture (IDOR guard on
 * the source site), the NO_THEME guard, and the core push contract: locked
 * sites skipped, unlocked sites get the theme + a bumped dsSchemaVersion, and a
 * single site failure never aborts the rest (partial-fail tolerant).
 *
 * A-3: the theme is the site's design TOKENS (`projectSettings.designTokens`),
 * never `projectStyles` (the editor's per-element CSS rules, which push used to
 * overwrite wholesale).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const wsFindUnique = vi.fn();
const wsUpdate = vi.fn();
const siteFindFirst = vi.fn();
const siteFindMany = vi.fn();
const siteUpdate = vi.fn();
const siteUpdateMany = vi.fn();
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
    // $transaction: an op array (mocked ops are already-resolved values) or an
    // interactive callback handed the same mocked client.
    $transaction: (arg: unknown): Promise<unknown> =>
      typeof arg === "function"
        ? (arg as (tx: unknown) => Promise<unknown>)({
            site: { updateMany: (...a: unknown[]) => siteUpdateMany(...a) },
            siteThemeSnapshot: {
              create: (...a: unknown[]) => snapCreate(...a),
              delete: (...a: unknown[]) => snapDelete(...a),
            },
          })
        : Promise.all(arg as Promise<unknown>[]),
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
  [wsFindUnique, wsUpdate, siteFindFirst, siteFindMany, siteUpdate, siteUpdateMany, snapCreate, snapFindMany, snapFindFirst, snapDelete, snapDeleteMany, presetUpsert, presetFindMany, presetFindFirst, presetDeleteMany].forEach(
    (m) => m.mockReset(),
  );
  snapCreate.mockResolvedValue({ id: "snap" });
  siteUpdateMany.mockResolvedValue({ count: 1 });
  snapFindMany.mockResolvedValue([]); // pruneSnapshots: under cap → no-op
});

describe("getSharedTheme", () => {
  it("returns null when no theme captured", async () => {
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: null, sharedThemeUpdatedAt: null });
    await expect(getSharedTheme("w1")).resolves.toBeNull();
  });

  it("returns styles + updatedAt when present", async () => {
    const at = new Date("2026-06-19T00:00:00Z");
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: { designTokens: [{ id: "t" }] }, sharedThemeUpdatedAt: at });
    await expect(getSharedTheme("w1")).resolves.toEqual({ styles: { designTokens: [{ id: "t" }] }, updatedAt: at });
  });
});

describe("captureSharedTheme", () => {
  it("refuses a source site outside the workspace (no workspace write)", async () => {
    siteFindFirst.mockResolvedValueOnce(null);
    await expect(captureSharedTheme("w1", "other-site")).rejects.toBeInstanceOf(ThemeError);
    expect(wsUpdate).not.toHaveBeenCalled();
  });

  /* A brand-new site has no `projectStyles` — `createSite` never seeds it. This
     used to write `Prisma.DbNull`, which `getSharedTheme` read back as null, so
     the UI toasted "Theme captured" and then still showed "No shared theme
     captured yet" with Push disabled. A new user's first agency action reported
     success over a no-op. */
  it("refuses a source site with no styles, and writes nothing", async () => {
    siteFindFirst.mockResolvedValueOnce({ projectSettings: null });
    await expect(captureSharedTheme("w1", "s1")).rejects.toBeInstanceOf(ThemeError);
    expect(wsUpdate).not.toHaveBeenCalled();
  });

  it("writes the source site's design tokens (not its element styles) to the shared theme", async () => {
    siteFindFirst.mockResolvedValueOnce({
      projectSettings: { designTokens: [{ id: "c", value: "#fff" }], designPresets: [{ id: "p" }], seo: { metaTitle: "x" } },
    });
    wsUpdate.mockResolvedValueOnce({});
    await captureSharedTheme("w1", "s1");
    expect(siteFindFirst.mock.calls[0][0].where).toEqual({ id: "s1", workspaceId: "w1" });
    expect(siteFindFirst.mock.calls[0][0].select).toEqual({ projectSettings: true });
    expect(wsUpdate.mock.calls[0][0].data.sharedTheme).toEqual({
      designTokens: [{ id: "c", value: "#fff" }],
      designPresets: [{ id: "p" }],
    });
  });
});

describe("pushSharedTheme", () => {
  it("throws NO_THEME when nothing has been captured", async () => {
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: null, sharedThemeUpdatedAt: null });
    await expect(pushSharedTheme("w1")).rejects.toMatchObject({ code: "NO_THEME" });
    expect(siteFindMany).not.toHaveBeenCalled();
  });

  it("skips locked sites, pushes unlocked (bumping dsSchemaVersion), survives a single failure", async () => {
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: { designTokens: [{ id: "t" }] }, sharedThemeUpdatedAt: new Date() });
    siteFindMany.mockResolvedValueOnce([
      { id: "locked", name: "Locked", themeLocked: true, dsSchemaVersion: 5 },
      { id: "ok", name: "Ok", themeLocked: false, dsSchemaVersion: 2 },
      { id: "boom", name: "Boom", themeLocked: false, dsSchemaVersion: 0 },
    ]);
    siteUpdateMany.mockImplementation((args: { where: { id: string } }) =>
      args.where.id === "boom" ? Promise.reject(new Error("db down")) : Promise.resolve({ count: 1 }),
    );

    const results = await pushSharedTheme("w1");

    expect(results).toEqual([
      { siteId: "locked", name: "Locked", status: "skipped-locked" },
      { siteId: "ok", name: "Ok", status: "pushed" },
      { siteId: "boom", name: "Boom", status: "failed", error: "db down" },
    ]);
    // locked site never written; the pushed site bumped its version 2 → 3.
    const updatedIds = siteUpdateMany.mock.calls.map((c) => c[0].where.id);
    expect(updatedIds).toEqual(["ok", "boom"]);
    expect(siteUpdateMany.mock.calls[0][0].data.dsSchemaVersion).toBe(3);
  });

  it("writes the tokens into projectSettings, keeps every other setting, never touches projectStyles", async () => {
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: { designTokens: [{ id: "t", v: "new" }] }, sharedThemeUpdatedAt: new Date() });
    siteFindMany.mockResolvedValueOnce([
      { id: "ok", name: "Ok", themeLocked: false, dsSchemaVersion: 1, projectSettings: { designTokens: [{ id: "t", v: "old" }], seo: { metaTitle: "Keep" } } },
    ]);
    await pushSharedTheme("w1");
    const data = siteUpdateMany.mock.calls[0][0].data;
    expect(data.projectSettings).toEqual({ designTokens: [{ id: "t", v: "new" }], seo: { metaTitle: "Keep" } });
    expect("projectStyles" in data).toBe(false);
    expect(data.lastEditedAt).toBeInstanceOf(Date); // an open editor gets SAVE_CONFLICT, not a silent overwrite
  });

  it("refuses a shared theme captured in the old projectStyles shape, writing nothing", async () => {
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: [{ id: "rule", selector: "[data-buildrik-id=a]" }], sharedThemeUpdatedAt: new Date() });
    await expect(pushSharedTheme("w1")).rejects.toMatchObject({ code: "NO_THEME" });
    expect(siteFindMany).not.toHaveBeenCalled();
    expect(siteUpdateMany).not.toHaveBeenCalled();
  });

  /* Review M3: projectSettings is merged from the row read before the loop;
     an editor save landing in between would be reverted by a blind update. */
  it("writes with a CAS on the lastEditedAt it read; a site saved meanwhile fails with no snapshot", async () => {
    const read = new Date("2026-09-26T10:00:00.000Z");
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: { designTokens: [{ id: "t" }] }, sharedThemeUpdatedAt: new Date() });
    siteFindMany.mockResolvedValueOnce([
      { id: "raced", name: "Raced", themeLocked: false, dsSchemaVersion: 1, projectSettings: {}, lastEditedAt: read },
    ]);
    siteUpdateMany.mockResolvedValueOnce({ count: 0 });
    const res = await pushSharedTheme("w1");
    expect(siteUpdateMany.mock.calls[0][0].where).toEqual({ id: "raced", lastEditedAt: read });
    expect(res[0]).toMatchObject({ siteId: "raced", status: "failed" });
    expect(snapCreate).not.toHaveBeenCalled();
  });

  it("scopes targets to the passed siteIds", async () => {
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: { designTokens: [{ id: "t" }] }, sharedThemeUpdatedAt: new Date() });
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
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: { designTokens: [{ id: "t" }] }, sharedThemeUpdatedAt: new Date() });
    siteFindMany.mockResolvedValueOnce([
      { id: "locked", name: "L", themeLocked: true, dsSchemaVersion: 5, projectSettings: { designTokens: [{ old: 1 }] } },
      { id: "ok", name: "Ok", themeLocked: false, dsSchemaVersion: 2, projectSettings: { designTokens: [{ old: 2 }] } },
    ]);
    await pushSharedTheme("w1");
    // locked site is NOT snapshotted (never overwritten); unlocked is.
    expect(snapCreate).toHaveBeenCalledOnce();
    expect(snapCreate.mock.calls[0][0].data).toMatchObject({
      siteId: "ok",
      workspaceId: "w1",
      prevStyles: { designTokens: [{ old: 2 }] },
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
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: { designTokens: [{ id: "t", v: "new" }] }, sharedThemeUpdatedAt: new Date() });
    siteFindMany.mockResolvedValueOnce([
      { id: "same", name: "Same", themeLocked: false, projectSettings: { designTokens: [{ id: "t", v: "new" }] } },
      { id: "diff", name: "Diff", themeLocked: false, projectSettings: { designTokens: [{ id: "t", v: "old" }] } },
      { id: "lock", name: "Lock", themeLocked: true, projectSettings: { designTokens: [{ id: "t", v: "old" }] } },
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

  it("restores prev tokens into projectSettings, bumps version, consumes the snapshot", async () => {
    siteFindFirst.mockResolvedValueOnce({
      id: "s1", dsSchemaVersion: 4, lastEditedAt: new Date("2026-06-01T00:00:00Z"),
      projectSettings: { designTokens: [{ now: 1 }], seo: { metaTitle: "Keep" } },
    });
    snapFindFirst.mockResolvedValueOnce({ id: "snap1", prevStyles: { designTokens: [{ was: 1 }] }, createdAt: new Date("2026-06-20T00:00:00Z") });
    siteUpdateMany.mockResolvedValue({ count: 1 });
    snapDelete.mockResolvedValue({});
    const res = await rollbackSiteTheme("w1", "s1");
    // CAS on the lastEditedAt read (round 2), like push.
    expect(siteUpdateMany.mock.calls[0][0].where).toEqual({ id: "s1", lastEditedAt: new Date("2026-06-01T00:00:00Z") });
    expect(siteUpdateMany.mock.calls[0][0].data).toMatchObject({
      projectSettings: { designTokens: [{ was: 1 }], seo: { metaTitle: "Keep" } },
      dsSchemaVersion: 5,
    });
    expect(snapDelete.mock.calls[0][0].where).toEqual({ id: "snap1" });
    expect(res.rolledBackTo).toBeInstanceOf(Date);
  });

  /* Round 2: rollback merged into the projectSettings it read and wrote it
     back blind — an editor save landing in between was silently reverted.
     Now a CAS like push; a lost race fails clearly and keeps the snapshot. */
  it("a site edited since the read is not overwritten — CONFLICT, snapshot kept", async () => {
    siteFindFirst.mockResolvedValueOnce({ id: "s1", dsSchemaVersion: 4, lastEditedAt: new Date(1), projectSettings: {} });
    snapFindFirst.mockResolvedValueOnce({ id: "snap1", prevStyles: { designTokens: [] }, createdAt: new Date() });
    siteUpdateMany.mockResolvedValueOnce({ count: 0 });
    await expect(rollbackSiteTheme("w1", "s1")).rejects.toMatchObject({ code: "CONFLICT" });
    expect(snapDelete).not.toHaveBeenCalled();
    expect(siteUpdate).not.toHaveBeenCalled();
  });
});

describe("rollbackSiteTheme — a snapshot from the old projectStyles push", () => {
  it("restores the element rules that push overwrote", async () => {
    siteFindFirst.mockResolvedValueOnce({ id: "s1", dsSchemaVersion: 4, projectSettings: {} });
    snapFindFirst.mockResolvedValueOnce({ id: "old", prevStyles: [{ selector: "[data-buildrik-id=a]" }], createdAt: new Date() });
    siteUpdateMany.mockResolvedValue({ count: 1 });
    snapDelete.mockResolvedValue({});
    await rollbackSiteTheme("w1", "s1");
    expect(siteUpdateMany.mock.calls[0][0].data).toMatchObject({ projectStyles: [{ selector: "[data-buildrik-id=a]" }] });
    expect("projectSettings" in siteUpdateMany.mock.calls[0][0].data).toBe(false);
  });

  /* S-1 class carry-over: a legacy snapshot's prevStyles is written straight
     back to the site on rollback. If it predates the allowlist sanitizer (or
     was frozen from a row that skipped it), rolling back must not resurrect
     an unsafe rule verbatim. */
  it("sanitizes an unsafe rule out of a legacy snapshot instead of restoring it verbatim", async () => {
    siteFindFirst.mockResolvedValueOnce({ id: "s1", dsSchemaVersion: 4, projectSettings: {} });
    snapFindFirst.mockResolvedValueOnce({
      id: "old",
      prevStyles: [
        { selector: "[data-buildrik-id=a]" },
        { selector: "</style><script>alert(1)</script>" },
      ],
      createdAt: new Date(),
    });
    siteUpdateMany.mockResolvedValue({ count: 1 });
    snapDelete.mockResolvedValue({});
    await rollbackSiteTheme("w1", "s1");
    expect(siteUpdateMany.mock.calls[0][0].data.projectStyles).toEqual([
      { selector: "[data-buildrik-id=a]" },
    ]);
  });
});

describe("rollbackSiteTheme — presets (review M3)", () => {
  it("a site that had no designPresets before the push has none after rollback", async () => {
    siteFindFirst.mockResolvedValueOnce({
      id: "s1", dsSchemaVersion: 4,
      projectSettings: { designTokens: [{ pushed: 1 }], designPresets: [{ pushed: "preset" }], seo: { metaTitle: "Keep" } },
    });
    snapFindFirst.mockResolvedValueOnce({ id: "snap", prevStyles: { designTokens: [{ was: 1 }] }, createdAt: new Date() });
    siteUpdateMany.mockResolvedValue({ count: 1 });
    snapDelete.mockResolvedValue({});
    await rollbackSiteTheme("w1", "s1");
    expect(siteUpdateMany.mock.calls[0][0].data.projectSettings).toEqual({
      designTokens: [{ was: 1 }],
      seo: { metaTitle: "Keep" },
    });
  });

  it("the push snapshot records presets even when the site had no tokens yet", async () => {
    wsFindUnique.mockResolvedValueOnce({ sharedTheme: { designTokens: [{ id: "t" }] }, sharedThemeUpdatedAt: new Date() });
    siteFindMany.mockResolvedValueOnce([
      { id: "p", name: "P", themeLocked: false, dsSchemaVersion: 0, projectSettings: { designPresets: [{ id: "mine" }] }, lastEditedAt: new Date() },
    ]);
    await pushSharedTheme("w1");
    expect(snapCreate.mock.calls[0][0].data.prevStyles).toEqual({ designTokens: [], designPresets: [{ id: "mine" }] });
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
    siteFindFirst.mockResolvedValueOnce({ projectSettings: { designTokens: [{ id: "t", v: 1 }] } });
    presetUpsert.mockResolvedValueOnce({});
    const res = await saveWorkspacePreset("w1", "Brand A", "s1", "u1");
    expect(res).toEqual({ name: "Brand A" });
    expect(presetUpsert.mock.calls[0][0].where).toEqual({ workspaceId_name: { workspaceId: "w1", name: "Brand A" } });
    expect(presetUpsert.mock.calls[0][0].create).toMatchObject({
      workspaceId: "w1",
      name: "Brand A",
      createdBy: "u1",
      styles: { designTokens: [{ id: "t", v: 1 }] },
    });
  });

  it("applyWorkspacePreset copies a preset's tokens into the shared theme", async () => {
    presetFindFirst.mockResolvedValueOnce({ styles: { designTokens: [{ id: "t", v: 2 }] } });
    wsUpdate.mockResolvedValueOnce({});
    await applyWorkspacePreset("w1", "p1");
    expect(presetFindFirst.mock.calls[0][0].where).toEqual({ id: "p1", workspaceId: "w1" });
    expect(wsUpdate.mock.calls[0][0].data.sharedTheme).toEqual({ designTokens: [{ id: "t", v: 2 }] });
  });

  it("applyWorkspacePreset refuses a preset saved in the old projectStyles shape", async () => {
    presetFindFirst.mockResolvedValueOnce({ styles: [{ selector: "[data-buildrik-id=a]" }] });
    await expect(applyWorkspacePreset("w1", "old")).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(wsUpdate).not.toHaveBeenCalled();
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
