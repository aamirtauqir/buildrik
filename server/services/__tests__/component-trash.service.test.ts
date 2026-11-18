/**
 * Component trash (design-2l9 K18–K20, K42): list, restore, permanent delete
 * and the 30-day retention purge. Same owner decisions as page trash
 * (2026-10-30): EDITOR+ lists and restores, ADMIN purges.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkSiteRole = vi.fn();
vi.mock("@/server/services/permission.service", () => ({
  checkSiteRole: (...a: unknown[]) => checkSiteRole(...a),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    siteComponent: { findMany: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  listComponentTrash,
  restoreComponents,
  purgeComponents,
  purgeExpiredComponentTrash,
  ComponentTrashError,
} from "@/server/services/component-trash.service";
import { purgeComponentsSchema } from "@buildrik/shared/schemas/site-component";

const DAY = 24 * 60 * 60 * 1000;
const m = vi.mocked;
const trash = { instances: [{ record: { elementId: "e1", componentId: "c_footer" }, fingerprint: "f1" }], pageCount: 1 };

beforeEach(() => {
  vi.clearAllMocks();
  checkSiteRole.mockResolvedValue(undefined);
  m(prisma.user.findMany).mockResolvedValue([] as never);
});

describe("listComponentTrash", () => {
  it("is EDITOR+, inside the 30-day window, newest first, with who deleted it and what was detached", async () => {
    const at = new Date();
    m(prisma.siteComponent.findMany).mockResolvedValue([
      { componentId: "c_footer", name: "Footer", deletedAt: at, deletedById: "u_1", trash },
      { componentId: "c_price", name: "Old pricing", deletedAt: at, deletedById: "u_2", trash: null },
    ] as never);
    m(prisma.user.findMany).mockResolvedValue([{ id: "u_2", fullName: "Ana Ruiz", displayName: "Ana" }] as never);
    const before = Date.now();
    const out = await listComponentTrash("u_1", "s_1");

    expect(checkSiteRole).toHaveBeenCalledWith(prisma, "u_1", "s_1", "EDITOR");
    const args = m(prisma.siteComponent.findMany).mock.calls[0][0]!;
    expect(args.orderBy).toEqual({ deletedAt: "desc" });
    const since = (args.where as { deletedAt: { gte: Date } }).deletedAt.gte.getTime();
    expect(before - since).toBeGreaterThanOrEqual(30 * DAY - 1000);
    expect(out).toEqual([
      { componentId: "c_footer", name: "Footer", deletedAt: at, deletedBy: { id: "u_1", name: null, isYou: true }, detached: { instances: 1, pages: 1 } },
      { componentId: "c_price", name: "Old pricing", deletedAt: at, deletedBy: { id: "u_2", name: "Ana", isYou: false }, detached: null },
    ]);
  });

  it("an empty trash asks nothing else", async () => {
    m(prisma.siteComponent.findMany).mockResolvedValue([] as never);
    expect(await listComponentTrash("u_1", "s_1")).toEqual([]);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});

describe("restoreComponents", () => {
  it("takes the found ones out of the trash and answers their definitions with the detach record", async () => {
    m(prisma.siteComponent.findMany).mockResolvedValue([
      { componentId: "c_footer", payload: { id: "c_footer" }, trash },
    ] as never);
    m(prisma.siteComponent.updateMany).mockResolvedValue({ count: 1 } as never);
    const out = await restoreComponents("u_1", { siteId: "s_1", componentIds: ["c_footer", "c_gone"] });

    expect(checkSiteRole).toHaveBeenCalledWith(prisma, "u_1", "s_1", "EDITOR");
    expect(m(prisma.siteComponent.findMany).mock.calls[0][0]!.where).toEqual({
      siteId: "s_1", componentId: { in: ["c_footer", "c_gone"] }, deletedAt: { not: null },
    });
    expect(m(prisma.siteComponent.updateMany).mock.calls[0][0]).toEqual({
      where: { siteId: "s_1", componentId: { in: ["c_footer"] }, deletedAt: { not: null } },
      data: { deletedAt: null, deletedById: null },
    });
    expect(out).toEqual([{ componentId: "c_footer", payload: { id: "c_footer" }, trash }]);
  });

  it("a stored record that is not the shape restores without re-linking", async () => {
    m(prisma.siteComponent.findMany).mockResolvedValue([{ componentId: "c1", payload: {}, trash: { junk: 1 } }] as never);
    m(prisma.siteComponent.updateMany).mockResolvedValue({ count: 1 } as never);
    expect((await restoreComponents("u_1", { siteId: "s_1", componentIds: ["c1"] }))[0].trash).toBeNull();
  });

  it("none left in the trash is NOT_FOUND and writes nothing", async () => {
    m(prisma.siteComponent.findMany).mockResolvedValue([] as never);
    await expect(restoreComponents("u_1", { siteId: "s_1", componentIds: ["c1"] })).rejects.toBeInstanceOf(ComponentTrashError);
    expect(prisma.siteComponent.updateMany).not.toHaveBeenCalled();
  });
});

describe("purgeComponents", () => {
  it("is ADMIN and only deletes rows already in the trash", async () => {
    m(prisma.siteComponent.deleteMany).mockResolvedValue({ count: 2 } as never);
    expect(await purgeComponents("u_1", { siteId: "s_1", componentIds: ["a", "b"], confirm: "DELETE" })).toEqual({ deleted: 2 });
    expect(checkSiteRole).toHaveBeenCalledWith(prisma, "u_1", "s_1", "ADMIN");
    expect(m(prisma.siteComponent.deleteMany).mock.calls[0][0]!.where).toEqual({
      siteId: "s_1", componentId: { in: ["a", "b"] }, deletedAt: { not: null },
    });
  });

  it("a refused role deletes nothing", async () => {
    checkSiteRole.mockRejectedValue(new Error("FORBIDDEN"));
    await expect(purgeComponents("u_1", { siteId: "s_1", componentIds: ["a"], confirm: "DELETE" })).rejects.toThrow();
    expect(prisma.siteComponent.deleteMany).not.toHaveBeenCalled();
  });

  it("the schema demands the typed DELETE (board 217:42370)", () => {
    expect(purgeComponentsSchema.safeParse({ siteId: "s", componentIds: ["a"], confirm: "delete" }).success).toBe(false);
    expect(purgeComponentsSchema.safeParse({ siteId: "s", componentIds: ["a"], confirm: "DELETE" }).success).toBe(true);
  });
});

describe("purgeExpiredComponentTrash", () => {
  it("deletes trashed masters older than 30 days", async () => {
    m(prisma.siteComponent.deleteMany).mockResolvedValue({ count: 4 } as never);
    const now = new Date("2026-11-30T00:00:00Z");
    expect(await purgeExpiredComponentTrash(now)).toEqual({ deleted: 4 });
    expect(m(prisma.siteComponent.deleteMany).mock.calls[0][0]!.where).toEqual({
      deletedAt: { not: null, lt: new Date(now.getTime() - 30 * DAY) },
    });
  });
});
