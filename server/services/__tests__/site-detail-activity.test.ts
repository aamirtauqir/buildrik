/**
 * Recent Activity names WHO acted, and stops repeating itself.
 *
 * Board 817:5114 (Figma g4GzQFqzNYz5sosz1QtZXC page 1:3) puts an actor on
 * every row. This surface could not show one: the query selected
 * id/action/description/createdAt and DROPPED actorId, so every entry read as
 * if the system did it.
 *
 * And 96% of `activity_logs` is `site.settings.updated` — 1606 of 1668 rows,
 * counted in the live database — so the un-collapsed list rendered the same
 * sentence over and over. Observed live: "Updated 2 settings" five times down
 * the panel, which is what the editor's "Activity log" menu row opens.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { db } = vi.hoisted(() => ({ db: {
  site: { findUnique: vi.fn() },
  page: { count: vi.fn(), findMany: vi.fn() },
  siteAnalytics: { aggregate: vi.fn() },
  workspaceMember: { count: vi.fn() },
  formSubmission: { count: vi.fn() },
  activityLog: { findMany: vi.fn() },
  domain: { findFirst: vi.fn() },
  formBlock: { findMany: vi.fn() },
  user: { findMany: vi.fn() },
} }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { getSiteOverview } from "@server/services/site-detail.service";

const at = (min: number) => new Date(Date.UTC(2026, 8, 1, 12, min));

function setup(logs: unknown[], users: unknown[] = []) {
  db.site.findUnique.mockResolvedValue({
    id: "s1", name: "Bella", slug: "bella", status: "DRAFT", publishedUrl: null,
    lastPublishedAt: null, lastPublishedBy: null, createdAt: new Date(),
    workspaceId: "w1", touchIcon: null, favicon: null,
  });
  db.page.count.mockResolvedValue(0);
  db.page.findMany.mockResolvedValue([]);
  db.siteAnalytics.aggregate.mockResolvedValue({ _sum: { visitors: 0 } });
  db.workspaceMember.count.mockResolvedValue(1);
  db.formSubmission.count.mockResolvedValue(0);
  db.activityLog.findMany.mockResolvedValue(logs);
  db.domain.findFirst.mockResolvedValue(null);
  db.formBlock.findMany.mockResolvedValue([]);
  db.user.findMany.mockResolvedValue(users);
}

beforeEach(() => {
  Object.values(db).forEach((m) =>
    Object.values(m).forEach((fn) => (fn as ReturnType<typeof vi.fn>).mockReset()));
});

describe("site Overview — Recent Activity", () => {
  it("selects actorId, without which no row can name who acted", async () => {
    setup([]);
    await getSiteOverview("s1");
    const call = db.activityLog.findMany.mock.calls[0][0];
    expect(call.select.actorId).toBe(true);
  });

  it("resolves the actor's name onto the row", async () => {
    setup(
      [{ id: "a1", action: "site.published", description: "Published v3", createdAt: at(0), actorId: "u1" }],
      [{ id: "u1", fullName: "Alex" }],
    );
    const o = await getSiteOverview("s1");
    expect(o.recentActivity[0].actorName).toBe("Alex");
  });

  it("leaves actorName null for a system entry rather than inventing one", async () => {
    setup([{ id: "a1", action: "site.published", description: null, createdAt: at(0), actorId: null }]);
    const o = await getSiteOverview("s1");
    expect(o.recentActivity[0].actorName).toBeNull();
  });

  it("collapses consecutive identical entries into one row with a count", async () => {
    setup(
      Array.from({ length: 5 }, (_, i) => ({
        id: `a${i}`, action: "site.settings.updated", description: "Updated 2 settings",
        createdAt: at(-i), actorId: "u1",
      })),
      [{ id: "u1", fullName: "Alex" }],
    );
    const o = await getSiteOverview("s1");
    expect(o.recentActivity).toHaveLength(1);
    expect(o.recentActivity[0].count).toBe(5);
  });

  it("does not merge across a different actor", async () => {
    setup(
      [
        { id: "a1", action: "site.settings.updated", description: "Updated 2 settings", createdAt: at(0), actorId: "u1" },
        { id: "a2", action: "site.settings.updated", description: "Updated 2 settings", createdAt: at(-1), actorId: "u2" },
      ],
      [{ id: "u1", fullName: "Alex" }, { id: "u2", fullName: "Maria" }],
    );
    const o = await getSiteOverview("s1");
    expect(o.recentActivity).toHaveLength(2);
    expect(o.recentActivity.map((r) => r.actorName)).toEqual(["Alex", "Maria"]);
  });

  it("still returns at most five rows after collapsing", async () => {
    setup(
      Array.from({ length: 12 }, (_, i) => ({
        id: `a${i}`, action: "site.published", description: `Published v${i}`,
        createdAt: at(-i), actorId: "u1",
      })),
      [{ id: "u1", fullName: "Alex" }],
    );
    const o = await getSiteOverview("s1");
    expect(o.recentActivity).toHaveLength(5);
  });
});
