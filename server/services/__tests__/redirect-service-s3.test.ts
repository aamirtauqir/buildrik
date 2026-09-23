/**
 * redirect.service — the S3 additions (Clone 4254:75736 / 4254:75747).
 *
 * `matchQuery` and `notes` reach the row with their defaults when the caller
 * omits them, and one path gets one rule: a duplicate `fromPath` is refused
 * as REDIRECT_EXISTS on create and on a rename — never on an edit that keeps
 * its own path. No unique index backs this, so the service is the gate.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    redirect: { count: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { createRedirect, updateRedirect } from "@server/services/redirect.service";

beforeEach(() => {
  Object.values(db.redirect).forEach((fn) => fn.mockReset());
  db.redirect.count.mockResolvedValue(0);
  db.redirect.findFirst.mockResolvedValue(null);
  db.redirect.create.mockImplementation(async ({ data }) => ({ id: "r-new", ...data }));
  db.redirect.update.mockImplementation(async ({ where, data }) => ({ id: where.id, ...data }));
});

describe("createRedirect", () => {
  it("stores matchQuery and notes, defaulting to false / null when omitted", async () => {
    await createRedirect("s1", { fromPath: "/old-menu", toUrl: "/menu", type: "301", matchQuery: true, notes: "Retired in March" }, "PRO");
    expect(db.redirect.create).toHaveBeenCalledWith({
      data: { siteId: "s1", fromPath: "/old-menu", toUrl: "/menu", type: "301", matchQuery: true, notes: "Retired in March" },
    });

    await createRedirect("s1", { fromPath: "/a", toUrl: "/b", type: "302" }, "PRO");
    expect(db.redirect.create).toHaveBeenLastCalledWith({
      data: { siteId: "s1", fromPath: "/a", toUrl: "/b", type: "302", matchQuery: false, notes: null },
    });
  });

  it("refuses a second rule for the same path on the same site", async () => {
    db.redirect.findFirst.mockResolvedValueOnce({ id: "r-existing" });

    await expect(createRedirect("s1", { fromPath: "/old-menu", toUrl: "/menu", type: "301" }, "PRO")).rejects.toThrow("REDIRECT_EXISTS");

    expect(db.redirect.findFirst).toHaveBeenCalledWith({ where: { siteId: "s1", fromPath: "/old-menu" }, select: { id: true } });
    expect(db.redirect.create).not.toHaveBeenCalled();
  });

  it("checks the plan limit before the path", async () => {
    db.redirect.count.mockResolvedValueOnce(100);
    await expect(createRedirect("s1", { fromPath: "/x", toUrl: "/y", type: "301" }, "FREE")).rejects.toThrow("REDIRECT_LIMIT");
    expect(db.redirect.findFirst).not.toHaveBeenCalled();
  });
});

describe("updateRedirect", () => {
  it("writes the widened fields without a path check when the path is untouched", async () => {
    await updateRedirect("r1", "s1", { type: "302", matchQuery: true, notes: null });
    expect(db.redirect.findFirst).not.toHaveBeenCalled();
    expect(db.redirect.update).toHaveBeenCalledWith({ where: { id: "r1" }, data: { type: "302", matchQuery: true, notes: null } });
  });

  it("refuses a rename onto another rule's path, ignoring the row itself", async () => {
    db.redirect.findFirst.mockResolvedValueOnce({ id: "r-other" });

    await expect(updateRedirect("r1", "s1", { fromPath: "/about-us" })).rejects.toThrow("REDIRECT_EXISTS");

    expect(db.redirect.findFirst).toHaveBeenCalledWith({
      where: { siteId: "s1", fromPath: "/about-us", id: { not: "r1" } },
      select: { id: true },
    });
    expect(db.redirect.update).not.toHaveBeenCalled();
  });
});
