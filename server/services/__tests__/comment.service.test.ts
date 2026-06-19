/**
 * Client comment service (E7). Verifies create defaults, site-scoped list, and
 * the resolve guards: NOT_FOUND when the comment isn't on that site (IDOR), and
 * that RESOLVED stamps resolver/timestamp while reopening (OPEN) clears them.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const create = vi.fn();
const findMany = vi.fn();
const findFirst = vi.fn();
const update = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comment: {
      create: (...a: unknown[]) => create(...a),
      findMany: (...a: unknown[]) => findMany(...a),
      findFirst: (...a: unknown[]) => findFirst(...a),
      update: (...a: unknown[]) => update(...a),
    },
  },
}));

import {
  createComment,
  listComments,
  resolveComment,
  CommentError,
} from "@server/services/comment.service";

beforeEach(() => {
  [create, findMany, findFirst, update].forEach((m) => m.mockReset());
});

describe("createComment", () => {
  it("creates an OPEN comment with pin defaults", async () => {
    create.mockResolvedValueOnce({ id: "c1" });
    await createComment("s1", "u1", { siteId: "s1", body: "fix the hero", x: 0.5, y: 0.25 });
    expect(create).toHaveBeenCalledWith({
      data: { siteId: "s1", authorId: "u1", body: "fix the hero", pageId: null, x: 0.5, y: 0.25, targetSelector: null, status: "OPEN" },
    });
  });
});

describe("listComments", () => {
  it("scopes by site, optional status, oldest first", async () => {
    findMany.mockResolvedValueOnce([]);
    await listComments("s1", "OPEN");
    expect(findMany).toHaveBeenCalledWith({ where: { siteId: "s1", status: "OPEN" }, orderBy: { createdAt: "asc" } });
  });
});

describe("resolveComment", () => {
  it("resolves a comment on the site (stamps resolver + time)", async () => {
    findFirst.mockResolvedValueOnce({ id: "c1" });
    update.mockResolvedValueOnce({ id: "c1", status: "RESOLVED" });
    await resolveComment("s1", "c1", "RESOLVED", "admin");
    expect(findFirst).toHaveBeenCalledWith({ where: { id: "c1", siteId: "s1" }, select: { id: true } });
    expect(update.mock.calls[0][0].data).toMatchObject({ status: "RESOLVED", resolvedById: "admin" });
  });

  it("reopening (OPEN) clears the resolver + time", async () => {
    findFirst.mockResolvedValueOnce({ id: "c1" });
    update.mockResolvedValueOnce({ id: "c1", status: "OPEN" });
    await resolveComment("s1", "c1", "OPEN", "admin");
    expect(update.mock.calls[0][0].data).toEqual({ status: "OPEN", resolvedById: null, resolvedAt: null });
  });

  it("refuses a comment that isn't on the site (NOT_FOUND, no update)", async () => {
    findFirst.mockResolvedValueOnce(null);
    await expect(resolveComment("s1", "other", "RESOLVED", "admin")).rejects.toBeInstanceOf(CommentError);
    expect(update).not.toHaveBeenCalled();
  });
});
