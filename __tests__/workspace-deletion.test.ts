import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

const { cancel, retrieve, getStripe, unpublishSite } = vi.hoisted(() => {
  const cancel = vi.fn();
  const retrieve = vi.fn();
  return {
    cancel,
    retrieve,
    getStripe: vi.fn(() => ({ subscriptions: { cancel, retrieve } })),
    unpublishSite: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspace: { findMany: vi.fn(), deleteMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    subscription: { findUnique: vi.fn() },
    site: { findMany: vi.fn() },
    user: { delete: vi.fn(), deleteMany: vi.fn() },
  },
}));
vi.mock("@/server/services/stripe.client", () => ({ getStripe }));
vi.mock("@/server/services/publish.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/services/publish.service")>()),
  unpublishSite,
}));

import { prisma } from "@/lib/prisma";
import { cancelWorkspaceDeletion, processDueWorkspaceDeletions } from "@/server/services/workspace-settings.service";
import { GET } from "@/app/api/cron/workspace-deletion/route";

const NOW = new Date("2026-10-30");

beforeEach(() => {
  vi.clearAllMocks();
  cancel.mockReset().mockResolvedValue({ id: "sub_1", status: "canceled" });
  retrieve.mockReset();
  getStripe.mockImplementation(() => ({ subscriptions: { cancel, retrieve } }));
  unpublishSite.mockReset().mockResolvedValue({});
  vi.mocked(prisma.workspace.findMany).mockResolvedValue([{ id: "w1" }] as never);
  vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
  vi.mocked(prisma.site.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.workspace.deleteMany).mockResolvedValue({ count: 1 } as never);
  process.env.CRON_SECRET = "test-secret";
});

describe("processDueWorkspaceDeletions", () => {
  it("cancels Stripe, unpublishes, then deletes a due workspace", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1", status: "PUBLISHED", publishedUrl: "https://s1.vercel.app" }] as never);
    const res = await processDueWorkspaceDeletions(NOW);
    expect(cancel).toHaveBeenCalledWith("sub_1");
    expect(unpublishSite).toHaveBeenCalledWith("s1");
    expect(prisma.workspace.deleteMany).toHaveBeenCalledWith({ where: { id: "w1", deletionScheduledAt: { lte: NOW } } });
    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(prisma.workspace.deleteMany).mock.invocationCallOrder[0],
    );
    expect(unpublishSite.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(prisma.workspace.deleteMany).mock.invocationCallOrder[0],
    );
    expect(res).toEqual({ deleted: 1, skipped: 0 });
  });

  it("skips (keeps) the workspace when Stripe cancel fails", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    cancel.mockRejectedValue(new Error("stripe down"));
    retrieve.mockRejectedValue(new Error("stripe down"));
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).not.toHaveBeenCalled();
    expect(unpublishSite).not.toHaveBeenCalled();
    expect(res).toEqual({ deleted: 0, skipped: 1 });
  });

  it("skips (keeps) the workspace when a subscription exists but Stripe is not configured", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    getStripe.mockImplementation(() => {
      throw new Error("PAYMENTS_NOT_CONFIGURED");
    });
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).not.toHaveBeenCalled();
    expect(res).toEqual({ deleted: 0, skipped: 1 });
  });

  it("treats an already-missing Stripe subscription (resource_missing) as cancelled", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_gone" } as never);
    cancel.mockRejectedValue(Object.assign(new Error("No such subscription"), { code: "resource_missing" }));
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).toHaveBeenCalledWith({ where: { id: "w1", deletionScheduledAt: { lte: NOW } } });
    expect(res).toEqual({ deleted: 1, skipped: 0 });
  });

  it("treats an already-cancelled Stripe subscription (status canceled) as cancelled", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_old" } as never);
    cancel.mockRejectedValue(new Error("This subscription is already canceled"));
    retrieve.mockResolvedValue({ id: "sub_old", status: "canceled" });
    const res = await processDueWorkspaceDeletions(NOW);
    expect(retrieve).toHaveBeenCalledWith("sub_old");
    expect(prisma.workspace.deleteMany).toHaveBeenCalledWith({ where: { id: "w1", deletionScheduledAt: { lte: NOW } } });
    expect(res).toEqual({ deleted: 1, skipped: 0 });
  });

  it("skips when cancel fails and the subscription is still live", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    cancel.mockRejectedValue(new Error("rate limited"));
    retrieve.mockResolvedValue({ id: "sub_1", status: "active" });
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).not.toHaveBeenCalled();
    expect(res).toEqual({ deleted: 0, skipped: 1 });
  });

  it("no Subscription row: skips the Stripe step and deletes", async () => {
    const res = await processDueWorkspaceDeletions(NOW);
    expect(getStripe).not.toHaveBeenCalled();
    expect(prisma.workspace.deleteMany).toHaveBeenCalledWith({ where: { id: "w1", deletionScheduledAt: { lte: NOW } } });
    expect(res).toEqual({ deleted: 1, skipped: 0 });
  });

  /* I1: "live" = PUBLISHED or still carrying a publishedUrl — an ARCHIVED or
     billing-downgraded site can still be serving on Vercel. */
  it("takes down every site with a live deployment, whatever its status, and only those", async () => {
    vi.mocked(prisma.site.findMany).mockResolvedValue([
      { id: "archived-live", status: "ARCHIVED", publishedUrl: "https://a.vercel.app" },
      { id: "published", status: "PUBLISHED", publishedUrl: null },
      { id: "draft", status: "DRAFT", publishedUrl: null },
    ] as never);
    await processDueWorkspaceDeletions(NOW);
    expect(unpublishSite.mock.calls.map(([id]) => id)).toEqual(["archived-live", "published"]);
  });

  it("a failed take-down does not block the deletion", async () => {
    vi.mocked(prisma.site.findMany).mockResolvedValue([
      { id: "s1", status: "PUBLISHED", publishedUrl: "https://s1.vercel.app" },
      { id: "s2", status: "PUBLISHED", publishedUrl: "https://s2.vercel.app" },
    ] as never);
    unpublishSite.mockRejectedValueOnce(new Error("vercel down"));
    const res = await processDueWorkspaceDeletions(NOW);
    expect(unpublishSite).toHaveBeenCalledWith("s2");
    expect(res).toEqual({ deleted: 1, skipped: 0 });
  });

  it("one skipped workspace does not stop the others", async () => {
    vi.mocked(prisma.workspace.findMany).mockResolvedValue([{ id: "w1" }, { id: "w2" }] as never);
    vi.mocked(prisma.subscription.findUnique).mockImplementation((async (args: { where: { workspaceId: string } }) =>
      args.where.workspaceId === "w1" ? { stripeSubscriptionId: "sub_1" } : null) as never);
    cancel.mockRejectedValue(new Error("stripe down"));
    retrieve.mockRejectedValue(new Error("stripe down"));
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.workspace.deleteMany).toHaveBeenCalledWith({ where: { id: "w2", deletionScheduledAt: { lte: NOW } } });
    expect(res).toEqual({ deleted: 1, skipped: 1 });
  });

  it("a failing delete for one workspace does not stop the others", async () => {
    vi.mocked(prisma.workspace.findMany).mockResolvedValue([{ id: "w1" }, { id: "w2" }] as never);
    vi.mocked(prisma.workspace.deleteMany).mockImplementation((async (args: { where: { id: string } }) => {
      if (args.where.id === "w1") throw new Error("db down");
      return { count: 1 };
    }) as never);
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).toHaveBeenCalledWith({ where: { id: "w2", deletionScheduledAt: { lte: NOW } } });
    expect(res).toEqual({ deleted: 1, skipped: 1 });
  });

  it("a failing site lookup for one workspace does not stop the others", async () => {
    vi.mocked(prisma.workspace.findMany).mockResolvedValue([{ id: "w1" }, { id: "w2" }] as never);
    vi.mocked(prisma.site.findMany).mockRejectedValueOnce(new Error("db down"));
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ deleted: 1, skipped: 1 });
  });

  it("a deletion cancelled between selection and delete is not deleted", async () => {
    vi.mocked(prisma.workspace.deleteMany).mockResolvedValue({ count: 0 } as never);
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).toHaveBeenCalledWith({ where: { id: "w1", deletionScheduledAt: { lte: NOW } } });
    expect(res).toEqual({ deleted: 0, skipped: 1 });
  });

  it("only selects workspaces whose date has passed", async () => {
    vi.mocked(prisma.workspace.findMany).mockResolvedValue([] as never);
    await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { deletionScheduledAt: { lte: NOW } },
      orderBy: { deletionScheduledAt: "asc" },
    }));
  });

  it("never deletes User rows", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1", status: "PUBLISHED", publishedUrl: "https://s1.vercel.app" }] as never);
    await processDueWorkspaceDeletions(NOW);
    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
  });
});

function makeReq(authHeader?: string): NextRequest {
  return new Request("http://localhost/api/cron/workspace-deletion", {
    headers: authHeader ? { authorization: authHeader } : {},
  }) as NextRequest;
}

describe("workspace-deletion cron route", () => {
  it("returns 401 when authorization header is missing", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
    expect(prisma.workspace.findMany).not.toHaveBeenCalled();
  });

  it("returns 401 when authorization header is wrong", async () => {
    const res = await GET(makeReq("Bearer wrong-secret"));
    expect(res.status).toBe(401);
    expect(prisma.workspace.findMany).not.toHaveBeenCalled();
  });

  it("returns 200 with the processor's counts", async () => {
    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: 1, skipped: 0 });
  });
});

/* I5: the owner check lived in the router, reading ctx.prisma directly. */
describe("cancelWorkspaceDeletion — owner only", () => {
  it("throws NOT_OWNER for anyone but the owner and leaves the schedule alone", async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ ownerId: "owner-1" } as never);
    await expect(cancelWorkspaceDeletion("w1", "admin-1")).rejects.toThrow("NOT_OWNER");
    expect(prisma.workspace.update).not.toHaveBeenCalled();
  });

  it("throws NOT_OWNER for a missing workspace", async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null);
    await expect(cancelWorkspaceDeletion("w1", "owner-1")).rejects.toThrow("NOT_OWNER");
  });

  it("clears the schedule for the owner", async () => {
    vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ ownerId: "owner-1" } as never);
    vi.mocked(prisma.workspace.update).mockResolvedValue({ id: "w1", deletionScheduledAt: null } as never);
    await cancelWorkspaceDeletion("w1", "owner-1");
    expect(prisma.workspace.update).toHaveBeenCalledWith({ where: { id: "w1" }, data: { deletionScheduledAt: null } });
  });
});
