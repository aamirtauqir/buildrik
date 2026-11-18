/**
 * REA 2026-10-20 #11a — Undo after a record delete must bring back THE SAME
 * record. Re-creating it under a new id broke every reference and binding to
 * the old one, and re-upserting the old id is refused as GONE (the row is a
 * tombstone). `restoreEntry` clears the tombstone instead.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cmsEntry: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
    site: { update: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { restoreEntry } from "@/server/services/cms.service";

const entry = (over: Record<string, unknown> = {}) => ({
  id: "e1",
  collectionId: "c1",
  deletedAt: new Date("2026-10-20T10:00:00Z"),
  data: { name: "Pasta", slug: "pasta" },
  status: "PUBLISHED",
  collection: { deletedAt: null, fields: [{ slug: "slug", type: "slug", name: "Slug" }], pageSlugPattern: null },
  ...over,
});

describe("restoreEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.cmsEntry.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.cmsEntry.count).mockResolvedValue(0 as never);
    vi.mocked(prisma.cmsEntry.update).mockImplementation((async (a: { where: { id: string } }) => ({ ...entry(), deletedAt: null, id: a.where.id })) as never);
  });

  it("clears the tombstone on the same id and bumps cmsEditedAt", async () => {
    vi.mocked(prisma.cmsEntry.findFirst).mockResolvedValue(entry() as never);
    const row = await restoreEntry("s1", "e1");
    expect(prisma.cmsEntry.update).toHaveBeenCalledWith({ where: { id: "e1" }, data: { deletedAt: null } });
    expect(row?.id).toBe("e1");
    expect(prisma.site.update).toHaveBeenCalled();
  });

  it("is a no-op on a record that was never deleted (the delete had not reached the server)", async () => {
    vi.mocked(prisma.cmsEntry.findFirst).mockResolvedValue(entry({ deletedAt: null }) as never);
    await restoreEntry("s1", "e1");
    expect(prisma.cmsEntry.update).not.toHaveBeenCalled();
  });

  it("is NOT_FOUND for a record of another site or none at all", async () => {
    vi.mocked(prisma.cmsEntry.findFirst).mockResolvedValue(null as never);
    await expect(restoreEntry("s1", "e1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("is GONE when its collection was deleted", async () => {
    vi.mocked(prisma.cmsEntry.findFirst).mockResolvedValue(
      entry({ collection: { deletedAt: new Date(), fields: [], pageSlugPattern: null } }) as never,
    );
    await expect(restoreEntry("s1", "e1")).rejects.toMatchObject({ code: "GONE" });
  });

  it("refuses a published record whose slug another live record took meanwhile", async () => {
    vi.mocked(prisma.cmsEntry.findFirst).mockResolvedValue(entry() as never);
    vi.mocked(prisma.cmsEntry.findMany).mockResolvedValue([
      { id: "e2", data: { name: "Pasta 2", slug: "pasta" }, status: "PUBLISHED" },
    ] as never);
    await expect(restoreEntry("s1", "e1")).rejects.toMatchObject({ code: "INVALID" });
    expect(prisma.cmsEntry.update).not.toHaveBeenCalled();
  });
});
