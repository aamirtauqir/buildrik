/**
 * W4 — workspace-wide audit log. The full, filterable, paginated activity trail
 * (getTeamActivity is the limit-5 team widget). Actor names resolved; optional
 * action/actor filters; newest-first; workspace-scoped.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const count = vi.fn();
const logFindMany = vi.fn();
const userFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    activityLog: {
      count: (...a: unknown[]) => count(...a),
      findMany: (...a: unknown[]) => logFindMany(...a),
    },
    user: { findMany: (...a: unknown[]) => userFindMany(...a) },
  },
}));

import { listWorkspaceActivity } from "@server/services/activity-log.service";

beforeEach(() => {
  [count, logFindMany, userFindMany].forEach((m) => m.mockReset());
});

describe("listWorkspaceActivity (W4)", () => {
  it("paginates newest-first and resolves actor names", async () => {
    count.mockResolvedValueOnce(3);
    logFindMany.mockResolvedValueOnce([
      { id: "l1", action: "site.published", actorId: "u1", siteId: "s1", targetType: null, targetId: null, description: null, createdAt: new Date() },
      { id: "l2", action: "MEMBER_INVITED", actorId: "u2", siteId: null, targetType: "member", targetId: "m1", description: null, createdAt: new Date() },
    ]);
    userFindMany.mockResolvedValueOnce([{ id: "u1", fullName: "Alice" }, { id: "u2", fullName: "Bob" }]);

    const res = await listWorkspaceActivity("w1", { page: 1, perPage: 2 });
    expect(res.total).toBe(3);
    expect(res.totalPages).toBe(2);
    expect(res.data[0].actorName).toBe("Alice");
    expect(res.data[1].actorName).toBe("Bob");
    const args = logFindMany.mock.calls[0][0];
    expect(args.where).toEqual({ workspaceId: "w1" });
    expect(args.orderBy).toEqual({ createdAt: "desc" });
    expect(args.skip).toBe(0);
    expect(args.take).toBe(2);
  });

  it("applies action + actor filters when provided", async () => {
    count.mockResolvedValueOnce(0);
    logFindMany.mockResolvedValueOnce([]);
    await listWorkspaceActivity("w1", { action: "site.published", actorId: "u1" });
    expect(count.mock.calls[0][0].where).toEqual({
      workspaceId: "w1",
      action: "site.published",
      actorId: "u1",
    });
  });

  it("clamps perPage to 50 and defaults page to 1", async () => {
    count.mockResolvedValueOnce(0);
    logFindMany.mockResolvedValueOnce([]);
    const res = await listWorkspaceActivity("w1", { perPage: 999 });
    expect(logFindMany.mock.calls[0][0].take).toBe(50);
    expect(res.page).toBe(1);
    expect(res.totalPages).toBe(1); // never 0 even with no rows
    expect(userFindMany).not.toHaveBeenCalled(); // no actors to resolve
  });
});
