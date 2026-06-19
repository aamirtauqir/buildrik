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

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspace: {
      findUnique: (...a: unknown[]) => wsFindUnique(...a),
      update: (...a: unknown[]) => wsUpdate(...a),
    },
    site: {
      findFirst: (...a: unknown[]) => siteFindFirst(...a),
      findMany: (...a: unknown[]) => siteFindMany(...a),
      update: (...a: unknown[]) => siteUpdate(...a),
    },
  },
}));

import {
  getSharedTheme,
  captureSharedTheme,
  pushSharedTheme,
  setSiteThemeLock,
  ThemeError,
} from "@server/services/theme.service";

beforeEach(() => {
  [wsFindUnique, wsUpdate, siteFindFirst, siteFindMany, siteUpdate].forEach((m) => m.mockReset());
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
