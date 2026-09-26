/**
 * listSiteActivity — the editor History › Activity tab's rows (post-Oct-1 R2).
 * Two sources merged by time (activity_logs + comments), the filter narrows on
 * the server per source, actor names resolve, and consecutive repeats collapse.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    activityLog: { findMany: vi.fn() },
    comment: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { listSiteActivity } from "@server/services/activity-log.service";

const at = (min: number) => new Date(Date.UTC(2026, 9, 2, 12, min));
const log = (id: string, action: string, min: number, actorId: string | null = "u1", description: string | null = null) => ({
  id, action, description, actorId, createdAt: at(min),
});

beforeEach(() => {
  Object.values(db).forEach((m) => Object.values(m).forEach((f) => f.mockReset()));
  db.activityLog.findMany.mockResolvedValue([]);
  db.comment.findMany.mockResolvedValue([]);
  db.user.findMany.mockResolvedValue([{ id: "u1", fullName: "Aamir" }, { id: "u2", fullName: "Sara" }]);
});

describe("listSiteActivity", () => {
  it("merges log rows and comments newest first, with kinds and actor names", async () => {
    db.activityLog.findMany.mockResolvedValue([
      log("l2", "site.published", 30, "u1", "Published to https://x.vercel.app"),
      log("l1", "site.settings.updated", 10, "u2", "Updated 2 settings"),
    ]);
    db.comment.findMany.mockResolvedValue([
      { id: "c1", body: "Make the hero bigger", authorId: null, createdAt: at(20), reviewer: { name: "Client Co" } },
    ]);

    const rows = await listSiteActivity("s1", "all");

    expect(rows.map((r) => [r.id, r.kind, r.actorName, r.summary])).toEqual([
      ["log:l2", "publish", "Aamir", "Published to https://x.vercel.app"],
      ["comment:c1", "comment", "Client Co", "Commented: “Make the hero bigger”"],
      ["log:l1", "edit", "Sara", "Updated 2 settings"],
    ]);
    expect(rows.every((r) => r.actionUrl === null)).toBe(true);
    expect(db.activityLog.findMany.mock.calls[0][0].where).toEqual({ siteId: "s1" });
    expect(db.comment.findMany.mock.calls[0][0].where).toEqual({ siteId: "s1" });
  });

  it("publish narrows the log to publish actions and never reads comments", async () => {
    await listSiteActivity("s1", "publish");
    expect(db.activityLog.findMany.mock.calls[0][0].where).toEqual({
      siteId: "s1",
      action: { in: ["site.published", "site.publish_failed", "site.unpublished", "site.rolled_back"] },
    });
    expect(db.comment.findMany).not.toHaveBeenCalled();
  });

  it("edits excludes publish and review actions and never reads comments", async () => {
    await listSiteActivity("s1", "edits");
    const where = db.activityLog.findMany.mock.calls[0][0].where;
    expect(where.action.notIn).toEqual(expect.arrayContaining(["site.published", "review.revoked"]));
    expect(db.comment.findMany).not.toHaveBeenCalled();
  });

  it("comments reads comments plus the log's review actions", async () => {
    db.activityLog.findMany.mockResolvedValue([log("l1", "review.revoked", 5)]);
    const rows = await listSiteActivity("s1", "comments");
    expect(db.activityLog.findMany.mock.calls[0][0].where).toEqual({ siteId: "s1", action: { in: ["review.revoked"] } });
    expect(db.comment.findMany).toHaveBeenCalled();
    expect(rows[0]).toMatchObject({ kind: "comment", summary: "Withdrew the review request" });
  });

  it("falls back to a readable summary, then the raw action, when a row has no description", async () => {
    db.activityLog.findMany.mockResolvedValue([log("l1", "site.domain.removed", 2), log("l0", "site.mystery", 1)]);
    const rows = await listSiteActivity("s1", "all");
    expect(rows.map((r) => r.summary)).toEqual(["Removed a domain", "site.mystery"]);
  });

  it("an unknown actor reads null, not a guess", async () => {
    db.activityLog.findMany.mockResolvedValue([log("l1", "site.published", 1, null)]);
    const rows = await listSiteActivity("s1", "all");
    expect(rows[0].actorName).toBeNull();
  });

  it("truncates a long comment body", async () => {
    db.comment.findMany.mockResolvedValue([
      { id: "c1", body: "x".repeat(200), authorId: "u2", createdAt: at(1), reviewer: null },
    ]);
    const [row] = await listSiteActivity("s1", "comments");
    expect(row.actorName).toBe("Sara");
    expect(row.summary.length).toBeLessThan(100);
    expect(row.summary.endsWith("…”")).toBe(true);
  });

  it("collapses consecutive identical rows into the newest and says how many", async () => {
    db.activityLog.findMany.mockResolvedValue([
      log("l4", "site.settings.updated", 4, "u1", "Updated 2 settings"),
      log("l3", "site.settings.updated", 3, "u1", "Updated 2 settings"),
      log("l2", "site.settings.updated", 2, "u1", "Updated 2 settings"),
      log("l1", "site.settings.updated", 1, "u2", "Updated 2 settings"),
    ]);
    const rows = await listSiteActivity("s1", "all");
    expect(rows.map((r) => [r.id, r.summary])).toEqual([
      ["log:l4", "Updated 2 settings · 3 times"],
      ["log:l1", "Updated 2 settings"],
    ]);
  });

  it("caps the list at the limit after collapsing", async () => {
    db.activityLog.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => log(`l${i}`, "site.domain.connected", 100 - i, "u1", `Connected d${i}.com`)),
    );
    const rows = await listSiteActivity("s1", "all", 3);
    expect(rows).toHaveLength(3);
    expect(db.activityLog.findMany.mock.calls[0][0].take).toBe(12);
  });
});
