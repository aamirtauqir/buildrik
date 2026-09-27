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
    workspace: { findMany: vi.fn(), delete: vi.fn() },
    subscription: { findUnique: vi.fn() },
    site: { findMany: vi.fn() },
    user: { delete: vi.fn(), deleteMany: vi.fn() },
  },
}));
vi.mock("@/server/services/stripe.client", () => ({ getStripe }));
vi.mock("@/server/services/publish.service", () => ({ unpublishSite }));

import { prisma } from "@/lib/prisma";
import { processDueWorkspaceDeletions } from "@/server/services/workspace-settings.service";
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
  vi.mocked(prisma.workspace.delete).mockResolvedValue({ id: "w1" } as never);
  process.env.CRON_SECRET = "test-secret";
});

describe("processDueWorkspaceDeletions", () => {
  it("cancels Stripe, unpublishes, then deletes a due workspace", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1" }] as never);
    const res = await processDueWorkspaceDeletions(NOW);
    expect(cancel).toHaveBeenCalledWith("sub_1");
    expect(unpublishSite).toHaveBeenCalledWith("s1");
    expect(prisma.workspace.delete).toHaveBeenCalledWith({ where: { id: "w1" } });
    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(prisma.workspace.delete).mock.invocationCallOrder[0],
    );
    expect(unpublishSite.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(prisma.workspace.delete).mock.invocationCallOrder[0],
    );
    expect(res).toEqual({ deleted: 1, skipped: 0 });
  });

  it("skips (keeps) the workspace when Stripe cancel fails", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    cancel.mockRejectedValue(new Error("stripe down"));
    retrieve.mockRejectedValue(new Error("stripe down"));
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.delete).not.toHaveBeenCalled();
    expect(unpublishSite).not.toHaveBeenCalled();
    expect(res).toEqual({ deleted: 0, skipped: 1 });
  });

  it("skips (keeps) the workspace when a subscription exists but Stripe is not configured", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    getStripe.mockImplementation(() => {
      throw new Error("PAYMENTS_NOT_CONFIGURED");
    });
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.delete).not.toHaveBeenCalled();
    expect(res).toEqual({ deleted: 0, skipped: 1 });
  });

  it("treats an already-missing Stripe subscription (resource_missing) as cancelled", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_gone" } as never);
    cancel.mockRejectedValue(Object.assign(new Error("No such subscription"), { code: "resource_missing" }));
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.delete).toHaveBeenCalledWith({ where: { id: "w1" } });
    expect(res).toEqual({ deleted: 1, skipped: 0 });
  });

  it("treats an already-cancelled Stripe subscription (status canceled) as cancelled", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_old" } as never);
    cancel.mockRejectedValue(new Error("This subscription is already canceled"));
    retrieve.mockResolvedValue({ id: "sub_old", status: "canceled" });
    const res = await processDueWorkspaceDeletions(NOW);
    expect(retrieve).toHaveBeenCalledWith("sub_old");
    expect(prisma.workspace.delete).toHaveBeenCalledWith({ where: { id: "w1" } });
    expect(res).toEqual({ deleted: 1, skipped: 0 });
  });

  it("skips when cancel fails and the subscription is still live", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    cancel.mockRejectedValue(new Error("rate limited"));
    retrieve.mockResolvedValue({ id: "sub_1", status: "active" });
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.delete).not.toHaveBeenCalled();
    expect(res).toEqual({ deleted: 0, skipped: 1 });
  });

  it("no Subscription row: skips the Stripe step and deletes", async () => {
    const res = await processDueWorkspaceDeletions(NOW);
    expect(getStripe).not.toHaveBeenCalled();
    expect(prisma.workspace.delete).toHaveBeenCalledWith({ where: { id: "w1" } });
    expect(res).toEqual({ deleted: 1, skipped: 0 });
  });

  it("a failed take-down does not block the deletion", async () => {
    vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1" }, { id: "s2" }] as never);
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
    expect(prisma.workspace.delete).toHaveBeenCalledTimes(1);
    expect(prisma.workspace.delete).toHaveBeenCalledWith({ where: { id: "w2" } });
    expect(res).toEqual({ deleted: 1, skipped: 1 });
  });

  it("only selects workspaces whose date has passed", async () => {
    vi.mocked(prisma.workspace.findMany).mockResolvedValue([] as never);
    await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { deletionScheduledAt: { lte: NOW } },
    }));
  });

  it("never deletes User rows", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1" }] as never);
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
