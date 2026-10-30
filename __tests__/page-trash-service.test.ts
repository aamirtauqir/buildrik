/**
 * Page trash (design-2l9 A-21): list, restore, permanent delete and the
 * 30-day retention purge. Owner decisions 2026-10-30: EDITOR+ restores,
 * ADMIN purges, a restore over the plan's page limit is refused.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

const checkSiteRole = vi.fn();
vi.mock("@/server/services/permission.service", () => ({
  checkSiteRole: (...a: unknown[]) => checkSiteRole(...a),
}));

vi.mock("@/lib/prisma", () => {
  const prisma = {
    page: { findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    site: { findUnique: vi.fn(), update: vi.fn() },
    user: { findMany: vi.fn() },
    pageFolder: { findMany: vi.fn() },
    formBlock: { deleteMany: vi.fn() },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  return { prisma };
});

import { prisma } from "@/lib/prisma";
import {
  listPageTrash,
  restorePage,
  purgePage,
  purgeExpiredPageTrash,
  tombstoneSlug,
  PageTrashError,
} from "@/server/services/page-trash.service";

const DAY = 24 * 60 * 60 * 1000;
const m = vi.mocked;

beforeEach(() => {
  vi.clearAllMocks();
  checkSiteRole.mockResolvedValue(undefined);
  m(prisma.site.findUnique).mockResolvedValue({ workspace: { plan: "FREE" } } as never);
  m(prisma.page.update).mockImplementation((async (a: { data: { slug: string } }) => ({ id: "p_about", slug: a.data.slug })) as never);
  m(prisma.site.update).mockResolvedValue({} as never);
});

describe("tombstoneSlug", () => {
  it("frees the slug and stays inside the 100-char column", () => {
    expect(tombstoneSlug("about", "p1")).toBe("about~deleted~p1");
    const long = tombstoneSlug("a".repeat(100), "c".repeat(25));
    expect(long.length).toBe(100);
    expect(long.endsWith("~deleted~" + "c".repeat(25))).toBe(true);
  });
});

describe("listPageTrash", () => {
  it("is EDITOR+, inside the 30-day window, with who deleted it and the caller's folder", async () => {
    m(prisma.page.findMany).mockResolvedValue([
      { id: "p_about", name: "About", slug: "about~deleted~p_about", trashedSlug: "about", deletedAt: new Date(), deletedById: "u_1" },
    ] as never);
    m(prisma.user.findMany).mockResolvedValue([{ id: "u_1", fullName: "Ana Ruiz", displayName: null }] as never);
    m(prisma.pageFolder.findMany).mockResolvedValue([{ name: "Client projects", pageIds: ["p_about"] }] as never);

    const list = await listPageTrash("u_1", "s_1");

    expect(checkSiteRole).toHaveBeenCalledWith(prisma, "u_1", "s_1", "EDITOR");
    const where = m(prisma.page.findMany).mock.calls[0][0]!.where as { deletedAt: { gte: Date } };
    expect(Date.now() - where.deletedAt.gte.getTime()).toBeGreaterThanOrEqual(30 * DAY - 1000);
    expect(list).toEqual([
      expect.objectContaining({ id: "p_about", slug: "about", deletedBy: { id: "u_1", name: "Ana Ruiz", isYou: true }, folderName: "Client projects" }),
    ]);
    expect(m(prisma.pageFolder.findMany).mock.calls[0][0]!.where).toEqual({ userId: "u_1", siteId: "s_1" });
  });

  it("refuses a VIEWER", async () => {
    checkSiteRole.mockRejectedValue(new Error("FORBIDDEN"));
    await expect(listPageTrash("u_v", "s_1")).rejects.toThrow("FORBIDDEN");
    expect(prisma.page.findMany).not.toHaveBeenCalled();
  });
});

describe("restorePage", () => {
  const trashed = { id: "p_about", name: "About", slug: "about~deleted~p_about", trashedSlug: "about", isHomePage: false };

  it("checks EDITOR, restores the original URL at the end of the list and counts the page", async () => {
    m(prisma.page.findFirst).mockResolvedValue(trashed as never);
    m(prisma.page.findMany).mockResolvedValue([{ slug: "index", isHomePage: true }, { slug: "work", isHomePage: false }] as never);

    const page = await restorePage("u_1", { siteId: "s_1", pageId: "p_about" });

    expect(checkSiteRole).toHaveBeenCalledWith(prisma, "u_1", "s_1", "EDITOR");
    expect(m(prisma.page.findFirst).mock.calls[0][0]!.where).toEqual({ id: "p_about", siteId: "s_1", deletedAt: { not: null } });
    expect(m(prisma.page.findMany).mock.calls[0][0]!.where).toEqual({ siteId: "s_1", deletedAt: null });
    expect(m(prisma.page.update).mock.calls[0][0]).toMatchObject({
      where: { id: "p_about" },
      data: { deletedAt: null, deletedById: null, trashedSlug: null, slug: "about", position: 2, isHomePage: false },
    });
    expect(prisma.site.update).toHaveBeenCalledWith({ where: { id: "s_1" }, data: { pages: { increment: 1 } } });
    expect(page.slug).toBe("about");
  });

  it("refuses a VIEWER before reading anything", async () => {
    checkSiteRole.mockRejectedValue(new Error("FORBIDDEN"));
    await expect(restorePage("u_v", { siteId: "s_1", pageId: "p_about" })).rejects.toThrow("FORBIDDEN");
    expect(prisma.page.update).not.toHaveBeenCalled();
  });

  it("refuses over the plan's page limit", async () => {
    m(prisma.page.findFirst).mockResolvedValue(trashed as never);
    m(prisma.page.findMany).mockResolvedValue(Array.from({ length: 10 }, (_, i) => ({ slug: `p${i}`, isHomePage: i === 0 })) as never);

    const err = await restorePage("u_1", { siteId: "s_1", pageId: "p_about" }).catch((e) => e);
    expect(err).toBeInstanceOf(PageTrashError);
    expect(err.code).toBe("PAGE_LIMIT");
    expect(err.message).toBe("Delete a page or upgrade to restore.");
    expect(prisma.page.update).not.toHaveBeenCalled();
  });

  it("answers SLUG_TAKEN with the first free slug when another page took the URL", async () => {
    m(prisma.page.findFirst).mockResolvedValue(trashed as never);
    m(prisma.page.findMany).mockResolvedValue([{ slug: "about", isHomePage: false }, { slug: "about-2", isHomePage: false }] as never);

    const err = await restorePage("u_1", { siteId: "s_1", pageId: "p_about" }).catch((e) => e);
    expect(err.code).toBe("SLUG_TAKEN");
    expect(err.suggestedSlug).toBe("about-3");
    expect(prisma.page.update).not.toHaveBeenCalled();
  });

  it("restores with the new slug the user chose", async () => {
    m(prisma.page.findFirst).mockResolvedValue(trashed as never);
    m(prisma.page.findMany).mockResolvedValue([{ slug: "about", isHomePage: true }] as never);

    await restorePage("u_1", { siteId: "s_1", pageId: "p_about", slug: "about-2" });
    expect(m(prisma.page.update).mock.calls[0][0]!.data).toMatchObject({ slug: "about-2", slugManuallySet: true });
  });

  it("turns a unique-key race into SLUG_TAKEN", async () => {
    m(prisma.page.findFirst).mockResolvedValue(trashed as never);
    m(prisma.page.findMany).mockResolvedValue([] as never);
    m(prisma.$transaction).mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("unique", { code: "P2002", clientVersion: "5" }),
    );
    const err = await restorePage("u_1", { siteId: "s_1", pageId: "p_about" }).catch((e) => e);
    expect(err.code).toBe("SLUG_TAKEN");
    expect(err.suggestedSlug).toBe("about-2");
  });

  it("gives the home role back only when no live page holds it", async () => {
    m(prisma.page.findFirst).mockResolvedValue({ ...trashed, isHomePage: true } as never);
    m(prisma.page.findMany).mockResolvedValue([{ slug: "index", isHomePage: true }] as never);
    await restorePage("u_1", { siteId: "s_1", pageId: "p_about" });
    expect(m(prisma.page.update).mock.calls[0][0]!.data).toMatchObject({ isHomePage: false });
  });

  it("is NOT_FOUND for a live page or one from another site", async () => {
    m(prisma.page.findFirst).mockResolvedValue(null);
    await expect(restorePage("u_1", { siteId: "s_1", pageId: "p_x" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("purgePage", () => {
  it("is ADMIN only", async () => {
    checkSiteRole.mockRejectedValue(new Error("FORBIDDEN"));
    await expect(purgePage("u_e", { siteId: "s_1", pageId: "p_about", confirmName: "About" })).rejects.toThrow("FORBIDDEN");
    expect(checkSiteRole).toHaveBeenCalledWith(prisma, "u_e", "s_1", "ADMIN");
    expect(prisma.page.delete).not.toHaveBeenCalled();
  });

  it("needs the page's name typed", async () => {
    m(prisma.page.findFirst).mockResolvedValue({ id: "p_about", name: "About" } as never);
    await expect(purgePage("u_a", { siteId: "s_1", pageId: "p_about", confirmName: "about" })).rejects.toMatchObject({ code: "CONFIRM_MISMATCH" });
    expect(prisma.page.delete).not.toHaveBeenCalled();
  });

  it("deletes the trashed row and its form blocks", async () => {
    m(prisma.page.findFirst).mockResolvedValue({ id: "p_about", name: "About" } as never);
    await purgePage("u_a", { siteId: "s_1", pageId: "p_about", confirmName: "About" });
    expect(m(prisma.page.findFirst).mock.calls[0][0]!.where).toEqual({ id: "p_about", siteId: "s_1", deletedAt: { not: null } });
    expect(prisma.formBlock.deleteMany).toHaveBeenCalledWith({ where: { pageId: "p_about" } });
    expect(prisma.page.delete).toHaveBeenCalledWith({ where: { id: "p_about" } });
  });
});

describe("purgeExpiredPageTrash", () => {
  it("removes pages trashed more than 30 days ago, with their form blocks", async () => {
    const now = new Date("2026-11-30T00:00:00Z");
    m(prisma.page.findMany).mockResolvedValue([{ id: "p_old" }] as never);
    m(prisma.formBlock.deleteMany).mockResolvedValue({ count: 1 } as never);
    m(prisma.page.deleteMany).mockResolvedValue({ count: 1 } as never);

    expect(await purgeExpiredPageTrash(now)).toEqual({ deleted: 1 });
    const where = m(prisma.page.findMany).mock.calls[0][0]!.where as { deletedAt: { not: null; lt: Date } };
    expect(where.deletedAt.not).toBeNull();
    expect(where.deletedAt.lt.toISOString()).toBe("2026-10-31T00:00:00.000Z");
    expect(prisma.formBlock.deleteMany).toHaveBeenCalledWith({ where: { pageId: { in: ["p_old"] } } });
    expect(prisma.page.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ["p_old"] }, deletedAt: { not: null } } });
  });

  it("does nothing when nothing expired", async () => {
    m(prisma.page.findMany).mockResolvedValue([] as never);
    expect(await purgeExpiredPageTrash()).toEqual({ deleted: 0 });
    expect(prisma.page.deleteMany).not.toHaveBeenCalled();
  });
});

/* The restore race: a save built before a restore (an autosave in flight,
   another tab) reaches the server after it. Its snapshot lacks the page, so it
   would move the page straight back to the trash. Rows live in memory here and
   the tx answers the where clause trashPages sends, so the race is replayed
   in the order it happens. */
describe("trashPages — a save based before a restore", () => {
  type Row = { id: string; siteId: string; slug: string; deletedAt: Date | null; restoredAt: Date | null };
  type Where = {
    id: { in: string[] };
    siteId: string;
    deletedAt: null;
    OR?: Array<{ restoredAt: null } | { restoredAt: { lte: Date } }>;
  };
  const memoryTx = (rows: Row[]) => ({
    page: {
      findMany: async ({ where }: { where: Where }) =>
        rows.filter(
          (r) =>
            where.id.in.includes(r.id) &&
            r.siteId === where.siteId &&
            r.deletedAt === null &&
            (!where.OR ||
              where.OR.some((c) =>
                c.restoredAt === null ? r.restoredAt === null : r.restoredAt !== null && r.restoredAt <= c.restoredAt.lte,
              )),
        ),
      update: async ({ where, data }: { where: { id: string }; data: Partial<Row> }) =>
        Object.assign(rows.find((r) => r.id === where.id)!, data),
    },
  });

  it("leaves a page restored after the save's base live; a later save still trashes it", async () => {
    const { trashPages } = await import("@/server/services/page-trash.service");
    const base = new Date("2026-10-31T10:00:00Z"); // the racing save's expectedLastEditedAt
    const restoredAt = new Date("2026-10-31T10:00:05Z"); // the restore, after that save was built
    const rows: Row[] = [
      { id: "p_about", siteId: "s_1", slug: "about", deletedAt: null, restoredAt },
      { id: "p_old", siteId: "s_1", slug: "old", deletedAt: null, restoredAt: null },
    ];
    const tx = memoryTx(rows) as never;

    await trashPages(tx, "s_1", ["p_about", "p_old"], "u_1", base);
    expect(rows[0]).toMatchObject({ deletedAt: null, slug: "about" }); // the race: not re-trashed
    expect(rows[1].deletedAt).toBeInstanceOf(Date); // an ordinary removal still trashes

    // The restoring editor deletes it again; its save is based after the restore.
    await trashPages(tx, "s_1", ["p_about"], "u_1", new Date("2026-10-31T10:01:00Z"));
    expect(rows[0]).toMatchObject({ slug: "about~deleted~p_about" });
    expect(rows[0].deletedAt).toBeInstanceOf(Date);
  });

  it("restore stamps restoredAt", async () => {
    m(prisma.page.findFirst).mockResolvedValue({ id: "p_about", name: "About", slug: "about~deleted~p_about", trashedSlug: "about", isHomePage: false } as never);
    m(prisma.page.findMany).mockResolvedValue([] as never);
    await restorePage("u_1", { siteId: "s_1", pageId: "p_about" });
    expect(m(prisma.page.update).mock.calls[0][0]!.data).toMatchObject({ restoredAt: expect.any(Date) });
  });
});
