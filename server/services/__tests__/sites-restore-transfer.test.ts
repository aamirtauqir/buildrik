/**
 * sites.service — Settings Phase B.
 *
 * BE-6 `restoreSite` (PD-6, Q-B8): inside the 30-day window a deleted site
 * comes back as a DRAFT, the forms its delete switched off come back on (the
 * ids its `site.deleted` entry recorded — no others), its share links stay
 * revoked, and the plan's site limit applies again. `listDeletedSites` lists
 * the window, newest first, with each site's purge date.
 * BE-8 `transferSite` (Q-B5): the site's creator OR the workspace OWNER may
 * hand a site on; an ADMIN who did not create it may not.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { db, assertSiteQuota } = vi.hoisted(() => {
  const db = {
    site: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    activityLog: { findFirst: vi.fn() },
    formBlock: { updateMany: vi.fn() },
    shareLink: { updateMany: vi.fn() },
    workspaceMember: { findFirst: vi.fn() },
    sitePermission: { upsert: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops)),
  };
  return { db, assertSiteQuota: vi.fn() };
});

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/server/services/site-quota", () => ({ assertSiteQuota }));
vi.mock("@/server/services/email.service", () => ({ sendSiteTransferredEmail: vi.fn().mockResolvedValue(undefined) }));

import { listDeletedSites, restoreSite, transferSite } from "@/server/services/sites.service";

const DAY = 24 * 60 * 60 * 1000;

beforeEach(() => {
  vi.clearAllMocks();
  db.site.update.mockImplementation(async ({ where, data }) => ({ id: where.id, publishedPassword: null, ...data }));
  db.formBlock.updateMany.mockResolvedValue({ count: 2 });
  assertSiteQuota.mockResolvedValue(undefined);
});

describe("restoreSite (BE-6)", () => {
  const deletedSite = (daysAgo: number) => ({ deletedAt: new Date(Date.now() - daysAgo * DAY), workspaceId: "ws1" });

  it("brings the site back as a draft with exactly the recorded forms on — share links untouched", async () => {
    db.site.findUnique.mockResolvedValue(deletedSite(3));
    db.activityLog.findFirst.mockResolvedValue({ metadata: { formBlockIds: ["f1", "f2", 7] } });

    const result = await restoreSite("s1", "u1");

    expect(db.site.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { deletedAt: null, status: "DRAFT" } });
    expect(db.formBlock.updateMany).toHaveBeenCalledWith({
      where: { siteId: "s1", id: { in: ["f1", "f2"] } },
      data: { isActive: true },
    });
    expect(db.shareLink.updateMany).not.toHaveBeenCalled();
    expect(db.activityLog.findFirst).toHaveBeenCalledWith({
      where: { workspaceId: "ws1", siteId: "s1", action: "site.deleted" },
      orderBy: { createdAt: "desc" },
      select: { metadata: true },
    });
    expect(result).toMatchObject({ reactivatedFormBlockIds: ["f1", "f2"], reactivatedForms: 2 });
    expect(result.site).not.toHaveProperty("publishedPassword");
  });

  it("switches no form on when the delete recorded none", async () => {
    db.site.findUnique.mockResolvedValue(deletedSite(1));
    db.activityLog.findFirst.mockResolvedValue(null);
    await restoreSite("s1", "u1");
    expect(db.formBlock.updateMany).toHaveBeenCalledWith({ where: { siteId: "s1", id: { in: [] } }, data: { isActive: true } });
  });

  it("refuses past the window, a live site, an unknown site, and a full plan", async () => {
    db.site.findUnique.mockResolvedValue(deletedSite(31));
    await expect(restoreSite("s1", "u1")).rejects.toThrow("RESTORE_WINDOW_PASSED");

    db.site.findUnique.mockResolvedValue({ deletedAt: null, workspaceId: "ws1" });
    await expect(restoreSite("s1", "u1")).rejects.toThrow("SITE_NOT_DELETED");

    db.site.findUnique.mockResolvedValue(null);
    await expect(restoreSite("s1", "u1")).rejects.toThrow("SITE_NOT_FOUND");

    db.site.findUnique.mockResolvedValue(deletedSite(2));
    assertSiteQuota.mockRejectedValue(new Error("SITE_LIMIT"));
    await expect(restoreSite("s1", "u1")).rejects.toThrow("SITE_LIMIT");
    expect(db.site.update).not.toHaveBeenCalled();
  });
});

describe("listDeletedSites (BE-6)", () => {
  it("lists the window, scoped, newest first, with each purge date", async () => {
    const deletedAt = new Date("2026-10-01T00:00:00.000Z");
    db.site.findMany.mockResolvedValue([{ id: "s1", name: "A", slug: "a", deletedAt }]);

    const rows = await listDeletedSites("ws1", { id: { in: ["s1"] } });

    const where = db.site.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ workspaceId: "ws1", id: { in: ["s1"] } });
    expect(Date.now() - where.deletedAt.gte.getTime()).toBeGreaterThanOrEqual(30 * DAY - 1000);
    expect(db.site.findMany.mock.calls[0][0].orderBy).toEqual({ deletedAt: "desc" });
    expect(rows).toEqual([
      { id: "s1", name: "A", slug: "a", deletedAt, purgeAt: new Date("2026-10-31T00:00:00.000Z") },
    ]);
  });
});

describe("transferSite (BE-8, Q-B5)", () => {
  const site = { id: "s1", name: "A", createdBy: "creator", workspaceId: "ws1", deletedAt: null };

  beforeEach(() => {
    db.site.findUnique.mockResolvedValue(site);
    db.user.findUnique.mockResolvedValue(null);
  });

  function members(caller: { role: string } | null) {
    db.workspaceMember.findFirst.mockImplementation(async ({ where }) => {
      if (where.userId === "new-owner") return { id: "m-new" };
      return caller ? { id: "m-caller", role: caller.role, _count: { sitePermissions: 0 } } : null;
    });
  }

  it("the workspace OWNER may transfer a site somebody else created", async () => {
    members({ role: "OWNER" });
    await expect(transferSite("s1", "new-owner", "the-owner")).resolves.toEqual({ success: true });
    expect(db.site.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { createdBy: "new-owner" } });
  });

  it("the creator still may", async () => {
    members({ role: "EDITOR" });
    await expect(transferSite("s1", "new-owner", "creator")).resolves.toEqual({ success: true });
  });

  it("an ADMIN who did not create it may not", async () => {
    members({ role: "ADMIN" });
    await expect(transferSite("s1", "new-owner", "an-admin")).rejects.toThrow("NOT_OWNER");
    expect(db.site.update).not.toHaveBeenCalled();
  });
});
