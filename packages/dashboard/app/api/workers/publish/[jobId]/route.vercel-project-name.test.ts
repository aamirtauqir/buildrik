/**
 * SA-06: the publish worker deploys to the site's pinned Vercel project and
 * pins it after the first successful deploy.
 *
 * The project used to be derived from the slug on every deploy, so renaming a
 * live site's slug sent the next publish into a brand-new Vercel project and
 * left the old URL and its domains on the old one.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const { db, runVercelDeploy, assertProjectNameFree } = vi.hoisted(() => ({
  db: {
    publishBuildJob: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    site: { findUnique: vi.fn(), update: vi.fn() },
    redirect: { findMany: vi.fn() },
    domain: { findMany: vi.fn(), findFirst: vi.fn() },
    workspace: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
  runVercelDeploy: vi.fn(),
  assertProjectNameFree: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/cron-auth", () => ({ checkWorkerAuth: () => null }));
vi.mock("@/server/services/webhook.service", () => ({ deliverWebhook: vi.fn() }));
vi.mock("@/lib/publish-files", () => ({ buildDeployFiles: () => [], verifiedPrimaryDomain: () => null }));
vi.mock("@/lib/publish-forms", () => ({
  planFormWiring: (pages: unknown) => ({ pages, forms: [], deactivateMissing: false }),
}));
vi.mock("@/lib/publish-sliders", () => ({ wireSliders: (html: string) => html }));
vi.mock("@/server/services/form-submission.service", () => ({
  getPublishedFormSettings: vi.fn(async () => ({})),
  recordPublishedForms: vi.fn(async () => {}),
}));
vi.mock("@/server/services/activity-log.service", () => ({ record: vi.fn(async () => {}) }));
vi.mock("@/server/services/notification.trigger", () => ({ notifyWorkspaceOwner: vi.fn(async () => {}) }));
vi.mock("@/server/services/publish.service", () => ({
  runVercelDeploy: (...a: unknown[]) => runVercelDeploy(...a),
  assertProjectNameFree: (...a: unknown[]) => assertProjectNameFree(...a),
  completePublish: vi.fn(async () => {}),
}));
vi.mock("@/server/services/site-settings.service", () => ({ decryptPublishedPassword: () => null }));
vi.mock("@/server/services/marketplace.service", () => ({ getWorkspaceAppScripts: vi.fn(async () => "") }));

import { slugifyProjectName } from "@/lib/vercel";
import { POST } from "./route";

const JOB = {
  id: "job1",
  siteId: "s1",
  workspaceId: "ws1",
  status: "QUEUED",
  log: { pages: [{ path: "/", html: "<html></html>" }] },
};

function siteRow(vercelProjectName: string | null) {
  return {
    slug: "renamed",
    vercelProjectName,
    name: "Site",
    publishedPassword: null,
    favicon: null,
    touchIcon: null,
    ogImage: null,
    canonicalUrl: null,
    allowIndexing: true,
    robotsTxt: null,
    cspPolicy: null,
    hstsMaxAge: null,
    xFrameOptions: null,
    referrerPolicy: null,
    permissionsPolicy: null,
  };
}

function setup(vercelProjectName: string | null) {
  db.publishBuildJob.findUnique.mockImplementation(async (args: { select?: { status?: boolean } }) =>
    args.select?.status ? { status: "DEPLOYING" } : JOB,
  );
  db.site.findUnique.mockImplementation(async (args: { select: Record<string, unknown> }) =>
    "cspPolicy" in args.select
      ? siteRow(vercelProjectName)
      : { workspaceId: "ws1", lastPublishedBy: "u1", name: "Site", publishedUrl: null },
  );
  db.redirect.findMany.mockResolvedValue([]);
  db.domain.findMany.mockResolvedValue([]);
  db.domain.findFirst.mockResolvedValue(null);
  db.workspace.findUnique.mockResolvedValue({ plan: "PRO" });
  db.publishBuildJob.updateMany.mockResolvedValue({ count: 1 });
}

function run() {
  return POST({} as NextRequest, { params: Promise.resolve({ jobId: "job1" }) });
}

function pinWrites() {
  return db.site.update.mock.calls.filter(([args]) => "vercelProjectName" in args.data);
}

beforeEach(() => {
  Object.values(db).forEach((model) =>
    typeof model === "function"
      ? model.mockReset()
      : Object.values(model).forEach((fn) => fn.mockReset()),
  );
  runVercelDeploy.mockReset();
  assertProjectNameFree.mockReset().mockResolvedValue(undefined);
});

describe("publish worker — pinned Vercel project (SA-06)", () => {
  it("deploys a never-pinned site to the slug's project and pins it after the deploy succeeds", async () => {
    setup(null);
    runVercelDeploy.mockResolvedValue({ url: "https://x.vercel.app", deploymentId: "d1" });

    const res = await run();

    expect(res.status).toBe(200);
    expect(runVercelDeploy).toHaveBeenCalledWith("ws1", slugifyProjectName("renamed"), [], null);
    expect(pinWrites()).toEqual([[{ where: { id: "s1" }, data: { vercelProjectName: slugifyProjectName("renamed") } }]]);
  });

  it("deploys a pinned site to its pinned project, not the new slug's, and writes nothing", async () => {
    setup("buildrik-site-original");
    runVercelDeploy.mockResolvedValue({ url: "https://x.vercel.app", deploymentId: "d1" });

    await run();

    expect(runVercelDeploy).toHaveBeenCalledWith("ws1", "buildrik-site-original", [], null);
    expect(pinWrites()).toEqual([]);
  });

  /* C1: the deploy is live by the time the pin is written. A failed pin (e.g.
     the @unique index refusing a name another site holds) must not report
     that live deploy as failed. */
  it("still completes the publish when the pin write fails", async () => {
    setup(null);
    runVercelDeploy.mockResolvedValue({ url: "https://x.vercel.app", deploymentId: "d1" });
    db.site.update.mockImplementation(async (args: { data: Record<string, unknown> }) => {
      if ("vercelProjectName" in args.data) throw new Error("Unique constraint failed");
      return {};
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await run();

    expect(res.status).toBe(200);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("pin"), expect.anything());
    errSpy.mockRestore();
  });

  /* C1 residual: a legacy unpinned site whose derived project another site is
     pinned to would deploy over that site. Refuse before deploying. */
  it("fails an unpinned site whose project name another site holds, before deploying", async () => {
    setup(null);
    db.$transaction.mockResolvedValue([]);
    assertProjectNameFree.mockRejectedValue(
      new Error("This site's address clashes with another site. Change its URL slug in Settings and publish again."),
    );

    const res = await run();

    expect(res.status).toBe(500);
    expect(assertProjectNameFree).toHaveBeenCalledWith("s1", slugifyProjectName("renamed"));
    expect(runVercelDeploy).not.toHaveBeenCalled();
    expect(db.publishBuildJob.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "FAILED", error: expect.stringContaining("clashes with another site") }),
    }));
  });

  it("does not check a pinned site — its name is its own", async () => {
    setup("buildrik-site-original");
    runVercelDeploy.mockResolvedValue({ url: "https://x.vercel.app", deploymentId: "d1" });

    await run();

    expect(assertProjectNameFree).not.toHaveBeenCalled();
  });

  it("does not pin when the deploy fails", async () => {
    setup(null);
    db.$transaction.mockResolvedValue([]);
    runVercelDeploy.mockRejectedValue(new Error("Vercel down"));

    const res = await run();

    expect(res.status).toBe(500);
    expect(pinWrites()).toEqual([]);
  });
});

/* P2-5 (2026-10-08 audit): the worker read QUEUED, then wrote BUILDING by id
   alone. A cancel landing between the two was overwritten and the job deployed
   anyway. The claim is now conditional on the row still being QUEUED. */
describe("publish worker — claiming the job", () => {
  it("claims QUEUED → BUILDING only while the row is still QUEUED", async () => {
    setup("p");
    runVercelDeploy.mockResolvedValue({ url: "https://x.vercel.app", deploymentId: "d1" });
    await run();
    expect(db.publishBuildJob.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "job1", status: "QUEUED" },
        data: expect.objectContaining({ status: "BUILDING" }),
      }),
    );
  });

  it("does not deploy, or overwrite the row, when a cancel won the race", async () => {
    setup("p");
    db.publishBuildJob.updateMany.mockResolvedValue({ count: 0 });
    const res = await run();
    expect(res.status).toBe(409);
    expect(runVercelDeploy).not.toHaveBeenCalled();
    expect(db.publishBuildJob.update).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});
