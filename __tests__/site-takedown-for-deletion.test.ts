import { describe, it, expect, vi, beforeEach } from "vitest";

const { getConn, deleteDep, removeDomain, VercelApiError } = vi.hoisted(() => {
  class VercelApiError extends Error {
    constructor(public status: number, public code: string, msg: string) {
      super(msg);
    }
  }
  return { getConn: vi.fn(), deleteDep: vi.fn(), removeDomain: vi.fn(), VercelApiError };
});

vi.mock("@server/services/integrations.service", () => ({
  getActiveVercelConnection: getConn,
  markInactive: vi.fn(),
}));
vi.mock("@/lib/vercel", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/vercel")>()),
  deleteVercelDeployment: deleteDep,
  removeDomainFromVercelProject: removeDomain,
  VercelApiError,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    site: { findUnique: vi.fn(), update: vi.fn() },
    publishBuildJob: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import { takeDownSiteForDeletion } from "@/server/services/publish.service";

const SITE = {
  workspaceId: "w1",
  slug: "bella",
  vercelProjectName: "buildrik-bella",
  domains: [{ domain: "bella.com" }, { domain: "www.bella.com" }],
};

beforeEach(() => {
  vi.clearAllMocks();
  getConn.mockReset().mockResolvedValue({ id: "i1", token: "tok", teamId: "team_1" });
  deleteDep.mockReset().mockResolvedValue(undefined);
  removeDomain.mockReset().mockResolvedValue(undefined);
  vi.mocked(prisma.site.findUnique).mockResolvedValue(SITE as never);
  vi.mocked(prisma.site.update).mockResolvedValue({} as never);
  vi.mocked(prisma.publishBuildJob.findMany).mockResolvedValue([
    { deploymentId: "dep_3" },
    { deploymentId: "dep_2" },
    { deploymentId: "dep_1" },
  ] as never);
});

describe("takeDownSiteForDeletion", () => {
  it("deletes EVERY completed deployment, not only the latest", async () => {
    await expect(takeDownSiteForDeletion("s1")).resolves.toEqual({ ok: true });
    expect(prisma.publishBuildJob.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { siteId: "s1", status: "COMPLETED", deploymentId: { not: null } },
    }));
    expect(deleteDep.mock.calls.map(([a]) => a.deploymentId).sort()).toEqual(["dep_1", "dep_2", "dep_3"]);
    expect(deleteDep).toHaveBeenCalledWith({ token: "tok", teamId: "team_1", deploymentId: "dep_1" });
  });

  it("detaches every custom domain from the site's Vercel project", async () => {
    await takeDownSiteForDeletion("s1");
    expect(removeDomain).toHaveBeenCalledTimes(2);
    expect(removeDomain).toHaveBeenCalledWith({ token: "tok", teamId: "team_1", projectName: "buildrik-bella", domain: "bella.com" });
    expect(removeDomain).toHaveBeenCalledWith({ token: "tok", teamId: "team_1", projectName: "buildrik-bella", domain: "www.bella.com" });
  });

  it("marks the site offline once everything is down", async () => {
    await takeDownSiteForDeletion("s1");
    expect(prisma.site.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { status: "DRAFT", publishedUrl: null } });
  });

  it("reports failure when a deployment delete fails, and still tries the rest", async () => {
    deleteDep.mockImplementation(async ({ deploymentId }: { deploymentId: string }) => {
      if (deploymentId === "dep_2") throw new VercelApiError(500, "internal", "Vercel 500");
    });
    const res = await takeDownSiteForDeletion("s1");
    expect(res.ok).toBe(false);
    expect(res).toMatchObject({ reason: expect.stringContaining("dep_2") });
    expect(deleteDep).toHaveBeenCalledTimes(3);
    expect(prisma.site.update).not.toHaveBeenCalled();
  });

  it("reports failure when a domain detach fails", async () => {
    removeDomain.mockRejectedValueOnce(new VercelApiError(403, "forbidden", "Not allowed"));
    const res = await takeDownSiteForDeletion("s1");
    expect(res).toMatchObject({ ok: false, reason: expect.stringContaining("bella.com") });
  });

  it("treats a domain Vercel reports as not found as already detached", async () => {
    removeDomain.mockRejectedValue(new VercelApiError(400, "not_found", "The domain was not found"));
    await expect(takeDownSiteForDeletion("s1")).resolves.toEqual({ ok: true });
  });

  it("no Vercel connection while deployments exist is a failure", async () => {
    getConn.mockResolvedValue(null);
    await expect(takeDownSiteForDeletion("s1")).resolves.toEqual({ ok: false, reason: "no Vercel connection" });
    expect(deleteDep).not.toHaveBeenCalled();
  });

  it("a broken connection config is a failure, not a throw", async () => {
    getConn.mockRejectedValue(new Error("VERCEL_CONFIG_MALFORMED"));
    await expect(takeDownSiteForDeletion("s1")).resolves.toMatchObject({ ok: false, reason: expect.stringContaining("VERCEL_CONFIG_MALFORMED") });
  });

  it("nothing ever deployed and no connection is fine", async () => {
    vi.mocked(prisma.publishBuildJob.findMany).mockResolvedValue([] as never);
    getConn.mockResolvedValue(null);
    await expect(takeDownSiteForDeletion("s1")).resolves.toEqual({ ok: true });
  });

  it("a site that is already gone is fine", async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(null);
    await expect(takeDownSiteForDeletion("s1")).resolves.toEqual({ ok: true });
    expect(deleteDep).not.toHaveBeenCalled();
  });
});
