import { describe, it, expect, vi, beforeEach } from "vitest";

const siteFindUnique = vi.fn();
const upsert = vi.fn();
const findMany = vi.fn();
const deleteMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findUnique: (...a: unknown[]) => siteFindUnique(...a) },
    userTemplate: {
      upsert: (...a: unknown[]) => upsert(...a),
      findMany: (...a: unknown[]) => findMany(...a),
      deleteMany: (...a: unknown[]) => deleteMany(...a),
    },
  },
}));

import {
  upsertUserTemplate,
  listUserTemplates,
  deleteUserTemplate,
} from "@server/services/user-template.service";

beforeEach(() => [siteFindUnique, upsert, findMany, deleteMany].forEach((m) => m.mockReset()));

describe("user-template.service", () => {
  it("resolves the workspace from the site and upserts on (workspaceId, templateId)", async () => {
    siteFindUnique.mockResolvedValueOnce({ workspaceId: "ws1" });
    upsert.mockResolvedValueOnce({});
    const res = await upsertUserTemplate({
      siteId: "s1", templateId: "user-1", name: "Hero", html: "<p>", css: null, thumbnail: null,
    });
    expect(res).toEqual({ templateId: "user-1" });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId_templateId: { workspaceId: "ws1", templateId: "user-1" } },
        create: expect.objectContaining({ workspaceId: "ws1", templateId: "user-1", name: "Hero", html: "<p>" }),
      })
    );
  });

  it("no-ops the write when the site (and thus workspace) is not found", async () => {
    siteFindUnique.mockResolvedValueOnce(null);
    const res = await upsertUserTemplate({ siteId: "gone", templateId: "user-1", name: "X", html: "" });
    expect(res).toEqual({ templateId: "user-1" });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("lists templates for the site's workspace (with html)", async () => {
    siteFindUnique.mockResolvedValueOnce({ workspaceId: "ws1" });
    findMany.mockResolvedValueOnce([]);
    await listUserTemplates("s1");
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { workspaceId: "ws1" },
        select: expect.objectContaining({ templateId: true, html: true }),
      })
    );
  });

  it("list returns [] when the site is not found", async () => {
    siteFindUnique.mockResolvedValueOnce(null);
    expect(await listUserTemplates("gone")).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("delete uses deleteMany scoped to the resolved workspace", async () => {
    siteFindUnique.mockResolvedValueOnce({ workspaceId: "ws1" });
    deleteMany.mockResolvedValueOnce({ count: 1 });
    expect(await deleteUserTemplate("s1", "user-1")).toEqual({ ok: true });
    expect(deleteMany).toHaveBeenCalledWith({ where: { workspaceId: "ws1", templateId: "user-1" } });
  });
});
