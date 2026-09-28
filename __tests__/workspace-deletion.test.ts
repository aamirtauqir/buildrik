import { describe, it, expect, vi, beforeEach } from "vitest";
import { type NextRequest } from "next/server";

const { cancel, retrieve, getStripe, takeDownSiteForDeletion, hasPublishInFlight, captureMessage } = vi.hoisted(() => {
  const cancel = vi.fn();
  const retrieve = vi.fn();
  return {
    cancel,
    retrieve,
    getStripe: vi.fn(() => ({ subscriptions: { cancel, retrieve } })),
    takeDownSiteForDeletion: vi.fn(),
    hasPublishInFlight: vi.fn(),
    captureMessage: vi.fn(),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workspace: { findMany: vi.fn(), deleteMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    subscription: { findUnique: vi.fn() },
    site: { findMany: vi.fn() },
    scheduledPublish: { updateMany: vi.fn() },
    user: { delete: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops)),
  },
}));
vi.mock("@/server/services/stripe.client", () => ({ getStripe }));
vi.mock("@/server/services/publish.service", () => ({ takeDownSiteForDeletion, hasPublishInFlight }));
vi.mock("@sentry/nextjs", () => ({ captureMessage }));

import { prisma } from "@/lib/prisma";
import {
  cancelWorkspaceDeletion,
  deleteWorkspace,
  processDueWorkspaceDeletions,
} from "@/server/services/workspace-settings.service";
import { GET } from "@/app/api/cron/workspace-deletion/route";

const NOW = new Date("2026-10-30");
const DELETE_W1 = { where: { id: "w1", deletionScheduledAt: { lte: NOW } } };

beforeEach(() => {
  vi.clearAllMocks();
  cancel.mockReset().mockResolvedValue({ id: "sub_1", status: "canceled" });
  retrieve.mockReset();
  getStripe.mockImplementation(() => ({ subscriptions: { cancel, retrieve } }));
  takeDownSiteForDeletion.mockReset().mockResolvedValue({ ok: true });
  hasPublishInFlight.mockReset().mockResolvedValue(false);
  vi.mocked(prisma.workspace.findMany).mockResolvedValue([{ id: "w1" }] as never);
  vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
  vi.mocked(prisma.site.findMany).mockResolvedValue([] as never);
  vi.mocked(prisma.workspace.deleteMany).mockResolvedValue({ count: 1 } as never);
  process.env.CRON_SECRET = "test-secret";
});

describe("processDueWorkspaceDeletions", () => {
  it("cancels Stripe, takes every site down, then deletes a due workspace", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1" }] as never);
    const res = await processDueWorkspaceDeletions(NOW);
    expect(cancel).toHaveBeenCalledWith("sub_1");
    expect(takeDownSiteForDeletion).toHaveBeenCalledWith("s1");
    expect(prisma.workspace.deleteMany).toHaveBeenCalledWith(DELETE_W1);
    expect(cancel.mock.invocationCallOrder[0]).toBeLessThan(takeDownSiteForDeletion.mock.invocationCallOrder[0]);
    expect(takeDownSiteForDeletion.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(prisma.workspace.deleteMany).mock.invocationCallOrder[0],
    );
    expect(res).toEqual({ deleted: 1, skipped: [] });
  });

  it("skips (keeps) the workspace when Stripe cancel fails, with the reason", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    cancel.mockRejectedValue(new Error("stripe down"));
    retrieve.mockRejectedValue(new Error("stripe down"));
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).not.toHaveBeenCalled();
    expect(takeDownSiteForDeletion).not.toHaveBeenCalled();
    expect(res).toEqual({
      deleted: 0,
      skipped: [{ workspaceId: "w1", kind: "error", reason: expect.stringContaining("stripe down") }],
    });
  });

  it("skips (keeps) the workspace when a subscription exists but Stripe is not configured", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    getStripe.mockImplementation(() => {
      throw new Error("PAYMENTS_NOT_CONFIGURED");
    });
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).not.toHaveBeenCalled();
    expect(res.skipped).toEqual([{ workspaceId: "w1", kind: "error", reason: expect.stringContaining("PAYMENTS_NOT_CONFIGURED") }]);
  });

  it("treats an already-missing Stripe subscription (resource_missing) as cancelled", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_gone" } as never);
    cancel.mockRejectedValue(Object.assign(new Error("No such subscription"), { code: "resource_missing" }));
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).toHaveBeenCalledWith(DELETE_W1);
    expect(res).toEqual({ deleted: 1, skipped: [] });
  });

  it("treats an already-cancelled Stripe subscription (status canceled) as cancelled", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_old" } as never);
    cancel.mockRejectedValue(new Error("This subscription is already canceled"));
    retrieve.mockResolvedValue({ id: "sub_old", status: "canceled" });
    const res = await processDueWorkspaceDeletions(NOW);
    expect(retrieve).toHaveBeenCalledWith("sub_old");
    expect(prisma.workspace.deleteMany).toHaveBeenCalledWith(DELETE_W1);
    expect(res).toEqual({ deleted: 1, skipped: [] });
  });

  it("skips when cancel fails and the subscription is still live", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    cancel.mockRejectedValue(new Error("rate limited"));
    retrieve.mockResolvedValue({ id: "sub_1", status: "active" });
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).not.toHaveBeenCalled();
    expect(res.skipped).toHaveLength(1);
  });

  it("no Subscription row: skips the Stripe step and deletes", async () => {
    const res = await processDueWorkspaceDeletions(NOW);
    expect(getStripe).not.toHaveBeenCalled();
    expect(prisma.workspace.deleteMany).toHaveBeenCalledWith(DELETE_W1);
    expect(res).toEqual({ deleted: 1, skipped: [] });
  });

  /* RT3: "has a live deployment" = any COMPLETED job with a deploymentId. A
     site an earlier failed take-down flipped to DRAFT still serves, and a
     soft-deleted site is still cascaded away with the workspace. */
  it("selects sites by COMPLETED deployments, whatever their status, soft-deleted included", async () => {
    await processDueWorkspaceDeletions(NOW);
    expect(prisma.site.findMany).toHaveBeenCalledWith({
      where: { workspaceId: "w1", publishJobs: { some: { status: "COMPLETED", deploymentId: { not: null } } } },
      select: { id: true },
    });
  });

  it("a DRAFT site still holding a completed deployment is taken down", async () => {
    vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "draft-but-live" }, { id: "published" }] as never);
    await processDueWorkspaceDeletions(NOW);
    expect(takeDownSiteForDeletion.mock.calls.map(([id]) => id)).toEqual(["draft-but-live", "published"]);
  });

  /* RT1: the workspace delete cascades away the Vercel token and deployment
     ids, so it must not run while anything is still online. */
  it("a failed take-down keeps the workspace and reports the reason, after trying every site", async () => {
    vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1" }, { id: "s2" }] as never);
    takeDownSiteForDeletion.mockResolvedValueOnce({ ok: false, reason: "deployment dep_1: Vercel 500" });
    const res = await processDueWorkspaceDeletions(NOW);
    expect(takeDownSiteForDeletion).toHaveBeenCalledWith("s2");
    expect(prisma.workspace.deleteMany).not.toHaveBeenCalled();
    expect(res).toEqual({
      deleted: 0,
      skipped: [{ workspaceId: "w1", kind: "error", reason: "site s1: deployment dep_1: Vercel 500" }],
    });
  });

  it("no Vercel connection while a site has deployments keeps the workspace", async () => {
    vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1" }] as never);
    takeDownSiteForDeletion.mockResolvedValue({ ok: false, reason: "no Vercel connection" });
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).not.toHaveBeenCalled();
    expect(res.skipped).toEqual([{ workspaceId: "w1", kind: "error", reason: "site s1: no Vercel connection" }]);
  });

  it("a take-down that throws is an error skip, not a delete", async () => {
    vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1" }] as never);
    takeDownSiteForDeletion.mockRejectedValue(new Error("db down"));
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).not.toHaveBeenCalled();
    expect(res.skipped).toEqual([{ workspaceId: "w1", kind: "error", reason: expect.stringContaining("db down") }]);
  });

  /* RT2: a publish in flight would land a deployment after the take-down. */
  it("a publish in flight skips the workspace (retry next run) without touching Stripe or Vercel", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ stripeSubscriptionId: "sub_1" } as never);
    hasPublishInFlight.mockResolvedValue(true);
    const res = await processDueWorkspaceDeletions(NOW);
    expect(hasPublishInFlight).toHaveBeenCalledWith("w1");
    expect(cancel).not.toHaveBeenCalled();
    expect(takeDownSiteForDeletion).not.toHaveBeenCalled();
    expect(prisma.workspace.deleteMany).not.toHaveBeenCalled();
    expect(res).toEqual({ deleted: 0, skipped: [{ workspaceId: "w1", kind: "in-flight", reason: "publish in flight" }] });
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
    expect(res.deleted).toBe(1);
    expect(res.skipped.map((s) => s.workspaceId)).toEqual(["w1"]);
  });

  it("a failing delete for one workspace does not stop the others", async () => {
    vi.mocked(prisma.workspace.findMany).mockResolvedValue([{ id: "w1" }, { id: "w2" }] as never);
    vi.mocked(prisma.workspace.deleteMany).mockImplementation((async (args: { where: { id: string } }) => {
      if (args.where.id === "w1") throw new Error("db down");
      return { count: 1 };
    }) as never);
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).toHaveBeenCalledWith({ where: { id: "w2", deletionScheduledAt: { lte: NOW } } });
    expect(res).toEqual({ deleted: 1, skipped: [{ workspaceId: "w1", kind: "error", reason: expect.stringContaining("db down") }] });
  });

  it("a failing site lookup for one workspace does not stop the others", async () => {
    vi.mocked(prisma.workspace.findMany).mockResolvedValue([{ id: "w1" }, { id: "w2" }] as never);
    vi.mocked(prisma.site.findMany).mockRejectedValueOnce(new Error("db down"));
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).toHaveBeenCalledTimes(1);
    expect(res.deleted).toBe(1);
    expect(res.skipped).toHaveLength(1);
  });

  it("a deletion cancelled between selection and delete is not deleted, and is not an error", async () => {
    vi.mocked(prisma.workspace.deleteMany).mockResolvedValue({ count: 0 } as never);
    const res = await processDueWorkspaceDeletions(NOW);
    expect(prisma.workspace.deleteMany).toHaveBeenCalledWith(DELETE_W1);
    expect(res).toEqual({ deleted: 0, skipped: [{ workspaceId: "w1", kind: "cancelled", reason: "deletion cancelled" }] });
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
    vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1" }] as never);
    await processDueWorkspaceDeletions(NOW);
    expect(prisma.user.delete).not.toHaveBeenCalled();
    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
  });
});

/* RT2: scheduling the deletion closes the workspace's pending scheduled
   publishes — they would otherwise fire into a workspace being taken down. */
describe("deleteWorkspace (scheduling)", () => {
  it("sets the date 30 days out and cancels the workspace's PENDING scheduled publishes", async () => {
    vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1" }, { id: "s2" }] as never);
    vi.mocked(prisma.workspace.update).mockResolvedValue({} as never);
    vi.mocked(prisma.scheduledPublish.updateMany).mockResolvedValue({ count: 2 } as never);
    const before = Date.now();
    const { scheduledAt } = await deleteWorkspace("w1");
    expect(scheduledAt.getTime()).toBeGreaterThanOrEqual(before + 30 * 86400000);
    expect(prisma.workspace.update).toHaveBeenCalledWith({ where: { id: "w1" }, data: { deletionScheduledAt: scheduledAt } });
    expect(prisma.scheduledPublish.updateMany).toHaveBeenCalledWith({
      where: { status: "PENDING", OR: [{ workspaceId: "w1" }, { siteId: { in: ["s1", "s2"] } }] },
      data: { status: "CANCELLED", error: "WORKSPACE_DELETION_SCHEDULED" },
    });
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

  it("returns 200 with the processor's result when nothing was skipped", async () => {
    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: 1, skipped: [] });
    expect(captureMessage).not.toHaveBeenCalled();
  });

  /* RT8: the cron is configured by hand on cPanel; a non-2xx is what alerts. */
  it("returns 500 with the reasons when a workspace was skipped for an error, and reports it", async () => {
    vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1" }] as never);
    takeDownSiteForDeletion.mockResolvedValue({ ok: false, reason: "no Vercel connection" });
    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      deleted: 0,
      skipped: [{ workspaceId: "w1", kind: "error", reason: "site s1: no Vercel connection" }],
    });
    expect(captureMessage).toHaveBeenCalledWith(
      expect.stringContaining("w1"),
      expect.objectContaining({ level: "error" }),
    );
  });

  it("returns 200 when the only skip is a publish in flight", async () => {
    hasPublishInFlight.mockResolvedValue(true);
    const res = await GET(makeReq("Bearer test-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: 0, skipped: [{ workspaceId: "w1", kind: "in-flight", reason: "publish in flight" }] });
    expect(captureMessage).not.toHaveBeenCalled();
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
