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

const { db, runVercelDeploy, assertProjectNameFree, completePublish, applyPublishedPassword, recordPublishedForms } = vi.hoisted(() => ({
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
  completePublish: vi.fn(),
  applyPublishedPassword: vi.fn(),
  recordPublishedForms: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/cron-auth", () => ({ checkWorkerAuth: () => null }));
vi.mock("@/server/services/webhook.service", () => ({ deliverWebhook: vi.fn() }));
vi.mock("@/lib/publish-files", () => ({
  buildDeployFiles: () => [{ file: "index.html", data: "<html></html>" }],
  verifiedPrimaryDomain: () => null,
}));
const formPlan = vi.hoisted(() => ({
  next: null as null | { forms: unknown[]; deactivateMissing: boolean },
}));
vi.mock("@/lib/publish-forms", () => ({
  planPublishPages: (pages: unknown) => ({ pages, forms: [], deactivateMissing: false, ...(formPlan.next ?? {}) }),
}));
vi.mock("@/server/services/form-submission.service", () => ({
  getPublishedFormSettings: vi.fn(async () => ({})),
  recordPublishedForms: (...a: unknown[]) => recordPublishedForms(...a),
}));
vi.mock("@/server/services/activity-log.service", () => ({ record: vi.fn(async () => {}) }));
vi.mock("@/server/services/notification.trigger", () => ({ notifyWorkspaceOwner: vi.fn(async () => {}) }));
vi.mock("@/server/services/publish.service", () => ({
  runVercelDeploy: (...a: unknown[]) => runVercelDeploy(...a),
  assertProjectNameFree: (...a: unknown[]) => assertProjectNameFree(...a),
  completePublish: (...a: unknown[]) => completePublish(...a),
  applyPublishedPassword: (...a: unknown[]) => applyPublishedPassword(...a),
  isSimulationAllowed: () => false,
}));
vi.mock("@/server/services/site-settings.service", () => ({ decryptPublishedPassword: () => null }));
vi.mock("@/server/services/marketplace.service", () => ({ getWorkspaceAppScripts: vi.fn(async () => "") }));

import { createHash } from "node:crypto";
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
  formPlan.next = null;
  completePublish.mockReset().mockResolvedValue(undefined);
  applyPublishedPassword.mockReset().mockResolvedValue(undefined);
  recordPublishedForms.mockReset().mockResolvedValue(undefined);
});

describe("publish worker — pinned Vercel project (SA-06)", () => {
  it("deploys a never-pinned site to the slug's project and pins it after the deploy succeeds", async () => {
    setup(null);
    runVercelDeploy.mockResolvedValue({ url: "https://x.vercel.app", deploymentId: "d1" });

    const res = await run();

    expect(res.status).toBe(200);
    expect(runVercelDeploy).toHaveBeenCalledWith("ws1", slugifyProjectName("renamed"), [{ file: "index.html", data: "<html></html>" }]);
    expect(pinWrites()).toEqual([[{ where: { id: "s1" }, data: { vercelProjectName: slugifyProjectName("renamed") } }]]);
  });

  it("deploys a pinned site to its pinned project, not the new slug's, and writes nothing", async () => {
    setup("buildrik-site-original");
    runVercelDeploy.mockResolvedValue({ url: "https://x.vercel.app", deploymentId: "d1" });

    await run();

    expect(runVercelDeploy).toHaveBeenCalledWith("ws1", "buildrik-site-original", [{ file: "index.html", data: "<html></html>" }]);
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

/* D11 / O6 / A3: the worker ships a hashed bundle, records where a failure
   stopped, and switches forms over only once the deploy is live. */
describe("publish worker — bundle, failure phase, forms after deploy", () => {
  const jobWrites = () => db.publishBuildJob.update.mock.calls.map(([a]) => a.data as Record<string, unknown>);

  it("stores the bundle and its hash before deploying the same files", async () => {
    setup("p1");
    runVercelDeploy.mockResolvedValue({ url: "https://x.vercel.app", deploymentId: "d1" });
    await run();
    const bundleWrite = jobWrites().find((d) => "bundleHash" in d)!;
    expect(bundleWrite.bundleHash).toMatch(/^[0-9a-f]{64}$/);
    /* The entitlements it was built under go with it: a rollback ships these
       bytes only while they still hold (PRO → no badge, no app scripts). */
    expect(bundleWrite.bundle).toEqual({
      files: [{ file: "index.html", data: "<html></html>" }],
      context: { showBadge: false, appScriptsHash: createHash("sha256").update("").digest("hex") },
    });
    expect(runVercelDeploy.mock.calls[0][2]).toEqual([{ file: "index.html", data: "<html></html>" }]);
  });

  it("a failed deploy is FAILED in the deploy phase, clears its forms switch-over and switches nothing on", async () => {
    setup("p1");
    formPlan.next = { forms: [{ blockId: "f1" }], deactivateMissing: true };
    db.$transaction.mockResolvedValue([]);
    runVercelDeploy.mockRejectedValue(new Error("VERCEL_DEPLOY_ERROR"));
    const res = await run();
    expect(res.status).toBe(500);
    const failed = jobWrites().find((d) => d.status === "FAILED");
    expect(failed).toMatchObject({ failedPhase: "deploy", error: "VERCEL_DEPLOY_ERROR", formsStatus: null });
    expect(recordPublishedForms).not.toHaveBeenCalled();
  });

  it("the deployment id lands with COMPLETED, never as a step that may fail", async () => {
    setup("p1");
    runVercelDeploy.mockResolvedValue({ url: "https://x.vercel.app", deploymentId: "d1" });
    await run();
    expect(completePublish).toHaveBeenCalledWith("job1", "https://x.vercel.app", expect.objectContaining({ deploymentId: "d1" }));
    expect(jobWrites().some((d) => "deploymentId" in d)).toBe(false);
  });

  it("a step failing after the deployment went live leaves the publish complete (post-deploy)", async () => {
    setup("p1");
    runVercelDeploy.mockResolvedValue({ url: "https://x.vercel.app", deploymentId: "d1" });
    applyPublishedPassword.mockRejectedValue(new Error("vercel 500"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await run();
    errSpy.mockRestore();
    expect(res.status).toBe(200);
    expect(jobWrites().find((d) => d.failedPhase === "post-deploy")).toMatchObject({ error: "password protection: vercel 500" });
  });

  /* Anything that throws once the deploy is live — a DB read, completePublish
     itself — never marks the job FAILED or wipes the copy that is serving. */
  it("an error after going live is recorded as post-deploy and keeps the stored copy", async () => {
    setup("p1");
    runVercelDeploy.mockResolvedValue({ url: "https://x.vercel.app", deploymentId: "d1" });
    db.domain.findFirst.mockRejectedValue(new Error("pool exhausted"));
    db.$transaction.mockResolvedValue([]);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await run();
    errSpy.mockRestore();
    expect(res.status).toBe(500);
    expect(jobWrites().some((d) => d.status === "FAILED")).toBe(false);
    expect(jobWrites().some((d) => "log" in d)).toBe(false); // the stored copy is never wiped
    expect(completePublish).toHaveBeenCalledWith("job1", "https://x.vercel.app", expect.objectContaining({ deploymentId: "d1" }));
    expect(jobWrites().find((d) => d.failedPhase === "post-deploy")?.error).toBe("after going live: pool exhausted");
  });

  it("forms are PENDING from the bundle write, so a worker that dies after COMPLETED is recovered", async () => {
    setup("p1");
    formPlan.next = { forms: [{ blockId: "f1" }], deactivateMissing: true };
    runVercelDeploy.mockResolvedValue({ url: "https://x.vercel.app", deploymentId: "d1" });
    await run();
    const bundleWrite = jobWrites().find((d) => "bundleHash" in d)!;
    expect(bundleWrite).toMatchObject({ formsStatus: "PENDING", formsPlan: { forms: [{ blockId: "f1" }], deactivateMissing: true } });
  });
});

/* A rollback's stored bundle ships byte for byte only under the entitlements
   it was built with (security review 2026-10-16). */
describe("publish worker — stored bundle (rollback)", () => {
  const stored = (showBadge: boolean) => ({
    files: [{ file: "index.html", data: "STORED" }],
    context: { showBadge, appScriptsHash: createHash("sha256").update("").digest("hex") },
  });
  function withStored(bundle: unknown) {
    setup("p1");
    const job = { ...JOB, bundle, formsPlan: null };
    db.publishBuildJob.findUnique.mockImplementation(async (args: { select?: { status?: boolean } }) =>
      args.select?.status ? { status: "DEPLOYING" } : job,
    );
    runVercelDeploy.mockResolvedValue({ url: "https://x.vercel.app", deploymentId: "d2" });
  }

  it("ships the stored bytes when the workspace still has what built them", async () => {
    withStored(stored(false)); // PRO → no badge, as built
    await run();
    expect(runVercelDeploy.mock.calls[0][2]).toEqual([{ file: "index.html", data: "STORED" }]);
  });

  it("rebuilds from the version's pages when the plan changed (no badge dodged on FREE)", async () => {
    withStored(stored(false));
    db.workspace.findUnique.mockResolvedValue({ plan: "FREE" });
    await run();
    expect(runVercelDeploy.mock.calls[0][2]).toEqual([{ file: "index.html", data: "<html></html>" }]);
  });

  it("rebuilds a bundle stored before contexts were recorded", async () => {
    withStored({ files: [{ file: "index.html", data: "STORED" }] });
    await run();
    expect(runVercelDeploy.mock.calls[0][2]).toEqual([{ file: "index.html", data: "<html></html>" }]);
  });
});
