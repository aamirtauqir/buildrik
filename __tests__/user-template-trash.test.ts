/**
 * Saved-template trash (design-2l9 B6-T24…T33): delete moves a saved template
 * to "Recently deleted" for 30 days; restore brings back the same templateId;
 * permanent delete is ADMIN with the name typed back; the cron purges the rest.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkSiteRole = vi.fn();
vi.mock("@/server/services/permission.service", () => ({
  checkSiteRole: (...a: unknown[]) => checkSiteRole(...a),
}));
vi.mock("@/lib/sanitize-blocks", () => ({ sanitizeTemplateHtml: (h: string) => h }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findUnique: vi.fn() },
    userTemplate: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  deleteUserTemplate,
  listUserTemplates,
  listUserTemplateTrash,
  restoreUserTemplate,
  purgeUserTemplate,
  purgeExpiredUserTemplateTrash,
  UserTemplateTrashError,
} from "@/server/services/user-template.service";

const DAY = 24 * 60 * 60 * 1000;
const m = vi.mocked;

beforeEach(() => {
  vi.clearAllMocks();
  checkSiteRole.mockResolvedValue(undefined);
  m(prisma.site.findUnique).mockResolvedValue({ workspaceId: "w1" } as never);
});

describe("saved-template trash", () => {
  it("delete marks the row instead of removing it; the live list skips it", async () => {
    await deleteUserTemplate("s1", "user-1");
    expect(prisma.userTemplate.updateMany).toHaveBeenCalledWith({
      where: { workspaceId: "w1", templateId: "user-1", deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prisma.userTemplate.deleteMany).not.toHaveBeenCalled();
    m(prisma.userTemplate.findMany).mockResolvedValue([] as never);
    await listUserTemplates("s1");
    expect(m(prisma.userTemplate.findMany).mock.calls[0][0]).toMatchObject({ where: { workspaceId: "w1", deletedAt: null } });
  });

  it("the trash lists only the last 30 days", async () => {
    m(prisma.userTemplate.findMany).mockResolvedValue([{ templateId: "user-1", name: "Fieldwork home", html: "", deletedAt: new Date() }] as never);
    const rows = await listUserTemplateTrash("s1");
    expect(rows).toHaveLength(1);
    const gte = (m(prisma.userTemplate.findMany).mock.calls[0][0] as { where: { deletedAt: { gte: Date } } }).where.deletedAt.gte;
    expect(Date.now() - gte.getTime()).toBeGreaterThanOrEqual(30 * DAY - 1000);
    expect(Date.now() - gte.getTime()).toBeLessThan(30 * DAY + 1000);
  });

  it("restore clears deletedAt on the same row (same templateId)", async () => {
    m(prisma.userTemplate.findFirst).mockResolvedValue({ id: "row1" } as never);
    m(prisma.userTemplate.update).mockResolvedValue({ templateId: "user-1", name: "Fieldwork home" } as never);
    await expect(restoreUserTemplate({ siteId: "s1", templateId: "user-1" })).resolves.toMatchObject({ templateId: "user-1" });
    expect(m(prisma.userTemplate.update).mock.calls[0][0]).toMatchObject({ where: { id: "row1" }, data: { deletedAt: null } });
  });

  it("restore of something no longer in the trash is NOT_FOUND", async () => {
    m(prisma.userTemplate.findFirst).mockResolvedValue(null as never);
    await expect(restoreUserTemplate({ siteId: "s1", templateId: "user-1" })).rejects.toBeInstanceOf(UserTemplateTrashError);
  });

  it("permanent delete is ADMIN and needs the exact name", async () => {
    m(prisma.userTemplate.findFirst).mockResolvedValue({ id: "row1", name: "Fieldwork home" } as never);
    await expect(purgeUserTemplate("u1", { siteId: "s1", templateId: "user-1", confirmName: "Fieldwork" })).rejects.toMatchObject({ code: "CONFIRM_MISMATCH" });
    expect(prisma.userTemplate.delete).not.toHaveBeenCalled();
    await purgeUserTemplate("u1", { siteId: "s1", templateId: "user-1", confirmName: " Fieldwork home " });
    expect(checkSiteRole).toHaveBeenCalledWith(prisma, "u1", "s1", "ADMIN");
    expect(prisma.userTemplate.delete).toHaveBeenCalledWith({ where: { id: "row1" } });
  });

  it("the retention purge removes rows deleted more than 30 days ago", async () => {
    m(prisma.userTemplate.deleteMany).mockResolvedValue({ count: 2 } as never);
    const now = new Date("2026-11-02T00:00:00Z");
    await expect(purgeExpiredUserTemplateTrash(now)).resolves.toEqual({ deleted: 2 });
    expect(m(prisma.userTemplate.deleteMany).mock.calls[0][0]).toEqual({
      where: { deletedAt: { not: null, lt: new Date(now.getTime() - 30 * DAY) } },
    });
  });
});
