/**
 * SA-07 router coverage gap (flagged, never closed, in
 * .superpowers/sdd/2026-09-27-settings-p0-fixes/task-6-report.md): the
 * service-level tests in __tests__/sites-delete.test.ts cover deleteSite's
 * and bulkAction's take-down behaviour, but nothing asserted that the
 * ROUTER actually records a `site.deleted` activity entry — for a single
 * delete, or once per successfully-deleted id in a bulk delete, and not at
 * all for a failed delete or for archive/unarchive bulk actions.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { deleteSite, bulkAction, recordForSite } = vi.hoisted(() => ({
  deleteSite: vi.fn(),
  bulkAction: vi.fn(),
  recordForSite: vi.fn(),
}));

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({ extractBearer: () => null, verifyApiToken: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/services/permission.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/permission.service")>()),
  checkSiteRole: vi.fn(),
  checkWorkspaceRole: vi.fn(),
}));
vi.mock("@/server/trpc/workspace-ctx", () => ({ resolveWorkspaceId: vi.fn().mockResolvedValue("ws_1") }));
vi.mock("@/server/services/activity-log.service", () => ({ recordForSite, record: vi.fn() }));
vi.mock("@/server/services/sites.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/sites.service")>()),
  deleteSite,
  bulkAction,
}));

import { sitesRouter } from "@/server/trpc/routers/sites";

const ctx = { session: { user: { id: "u_1" } }, prisma: {} } as never;

beforeEach(() => {
  deleteSite.mockReset().mockResolvedValue({ success: true, deactivatedFormBlockIds: ["f1"] });
  bulkAction.mockReset();
  recordForSite.mockReset();
});

describe("sites router logs site.deleted activity (SA-07 router coverage)", () => {
  it("records one site.deleted entry after a successful single delete", async () => {
    await sitesRouter.createCaller(ctx).delete({ id: "s1", confirmName: "A" });

    expect(recordForSite).toHaveBeenCalledTimes(1);
    expect(recordForSite).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: "s1",
        actorId: "u_1",
        action: "site.deleted",
        targetType: "site",
        targetId: "s1",
      })
    );
  });

  it("does not log when the single delete throws NAME_MISMATCH", async () => {
    deleteSite.mockRejectedValue(new Error("NAME_MISMATCH"));

    await expect(
      sitesRouter.createCaller(ctx).delete({ id: "s1", confirmName: "wrong" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(recordForSite).not.toHaveBeenCalled();
  });

  it("records one site.deleted entry per succeeded id in a bulk delete, and none for failed ids", async () => {
    bulkAction.mockResolvedValue({ succeeded: ["s1", "s2"], failed: ["s3"] });

    const result = await sitesRouter.createCaller(ctx).bulk({ action: "delete", siteIds: ["s1", "s2", "s3"] });

    expect(recordForSite).toHaveBeenCalledTimes(2);
    expect(recordForSite).toHaveBeenCalledWith(expect.objectContaining({ siteId: "s1", action: "site.deleted" }));
    expect(recordForSite).toHaveBeenCalledWith(expect.objectContaining({ siteId: "s2", action: "site.deleted" }));
    expect(recordForSite).not.toHaveBeenCalledWith(expect.objectContaining({ siteId: "s3" }));
    expect(result).toEqual({ succeeded: ["s1", "s2"], failed: ["s3"] });
  });

  it("does not log activity for a bulk archive action", async () => {
    bulkAction.mockResolvedValue({ succeeded: ["s1"], failed: [] });

    await sitesRouter.createCaller(ctx).bulk({ action: "archive", siteIds: ["s1"] });

    expect(recordForSite).not.toHaveBeenCalled();
  });

  it("does not log anything when a bulk delete succeeds for no ids", async () => {
    bulkAction.mockResolvedValue({ succeeded: [], failed: ["s1"] });

    await sitesRouter.createCaller(ctx).bulk({ action: "delete", siteIds: ["s1"] });

    expect(recordForSite).not.toHaveBeenCalled();
  });
});
