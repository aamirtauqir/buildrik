/**
 * Unification spec §550 — userCanEditSite (auth gate before editor mount).
 * Queries: site exists AND not soft-deleted AND user is a workspace member.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const findFirstMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findFirst: (...args: unknown[]) => findFirstMock(...args) },
  },
}));

// sites.service.ts pulls a lot of unrelated imports; tree-shake them via stubs
// where possible. The function under test only touches prisma + the workspace
// join — other imports load lazily.
vi.mock("@/server/services/email.service", () => ({
  sendSiteTransferredEmail: vi.fn(),
}));
vi.mock("@/lib/constants/plan-limits", () => ({
  PLAN_LIMITS: {},
}));
vi.mock("@buildrik/shared/schemas/sites", () => ({}));

import { userCanEditSite } from "@server/services/sites.service";

describe("userCanEditSite", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
  });

  it("returns true when a workspace-member site row is found", async () => {
    findFirstMock.mockResolvedValueOnce({ id: "site-1" });
    await expect(userCanEditSite("user-1", "site-1")).resolves.toBe(true);
  });

  it("returns false when no matching site (non-member, deleted, or missing)", async () => {
    findFirstMock.mockResolvedValueOnce(null);
    await expect(userCanEditSite("user-x", "site-1")).resolves.toBe(false);
  });

  it("queries with deletedAt:null + workspace.members.some(userId) filter", async () => {
    findFirstMock.mockResolvedValueOnce({ id: "site-1" });
    await userCanEditSite("user-1", "site-1");
    expect(findFirstMock).toHaveBeenCalledOnce();
    const arg = findFirstMock.mock.calls[0][0];
    expect(arg.where.id).toBe("site-1");
    expect(arg.where.deletedAt).toBeNull();
    expect(arg.where.workspace.members.some.userId).toBe("user-1");
    expect(arg.select).toEqual({ id: true });
  });

  it("propagates Prisma errors (no swallow)", async () => {
    findFirstMock.mockRejectedValueOnce(new Error("DB down"));
    await expect(userCanEditSite("u", "s")).rejects.toThrow("DB down");
  });
});
