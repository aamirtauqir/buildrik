import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { VERCEL_CHECK_LABEL, type PrePublishChecksResult, type PublishPage } from "@buildrik/shared/schemas/publish";
import { notifyWorkspaceOwner } from "@/server/services/notification.trigger";
import { appendDynamicPagesToPublish } from "@/server/services/cms.service";
import { getActiveVercelConnection, markInactive } from "@server/services/integrations.service";
import { publishApprovalBlock } from "@server/services/publish-approval";
import {
  createVercelDeployment,
  waitForDeploymentReady,
  pickPublicUrl,
  setProjectPasswordProtection,
  VercelApiError,
  type VercelFile,
} from "@/lib/vercel";

export async function runPrePublishChecks(siteId: string): Promise<PrePublishChecksResult> {
  const [pageCount, site, domain, emptyPages] = await Promise.all([
    prisma.page.count({ where: { siteId } }),
    prisma.site.findUnique({
      where: { id: siteId },
      select: { metaTitleTemplate: true, touchIcon: true, deletedAt: true, workspaceId: true },
    }),
    prisma.domain.findFirst({
      where: { siteId, status: "VERIFIED" },
    }),
    prisma.page.findMany({
      where: { siteId, blocks: { equals: [] } },
      select: { id: true, name: true },
    }),
  ]);

  const checks: PrePublishChecksResult["checks"] = [];

  // Vercel connected. This is the only check that can be a hard fail besides
  // "Pages ready": sites deploy into the workspace's OWN Vercel account, so
  // without a connection runVercelDeploy throws VERCEL_NOT_CONNECTED and the
  // publish dies at the last step — after the job has queued and shown a
  // progress bar. Failing here keeps it from ever starting.
  const vercel = site ? await getActiveVercelConnection(site.workspaceId) : null;
  if (vercel) {
    checks.push({ label: VERCEL_CHECK_LABEL, status: "pass", detail: "This workspace is connected to Vercel." });
  } else {
    checks.push({
      label: VERCEL_CHECK_LABEL,
      status: "fail",
      detail: "Sites deploy to your own Vercel account. Connect it to publish.",
    });
  }

  // Pages ready
  if (pageCount === 0) {
    checks.push({ label: "Pages ready", status: "fail", detail: "No pages found. Add at least one page before publishing." });
  } else {
    checks.push({ label: "Pages ready", status: "pass", detail: `${pageCount} page${pageCount > 1 ? "s" : ""} ready to publish.` });
  }

  // SEO configured
  if (!site?.metaTitleTemplate) {
    checks.push({ label: "SEO configured", status: "warning", detail: "No meta title template set. Search engines may not index your site properly." });
  } else {
    checks.push({ label: "SEO configured", status: "pass", detail: "Meta title template is configured." });
  }

  // Domain connected
  if (domain) {
    checks.push({ label: "Domain connected", status: "pass", detail: `Connected to ${domain.domain}.` });
  } else {
    checks.push({ label: "Domain connected", status: "warning", detail: "No custom domain. Your site will be live on its Vercel URL." });
  }

  // Empty pages
  if (emptyPages.length > 0) {
    checks.push({ label: "Empty pages", status: "warning", detail: `${emptyPages.length} page${emptyPages.length > 1 ? "s have" : " has"} no content blocks.` });
  } else {
    checks.push({ label: "Empty pages", status: "pass", detail: "All pages have content." });
  }

  // Favicon
  if (!site?.touchIcon) {
    checks.push({ label: "Favicon", status: "warning", detail: "No favicon set. Browsers will show a default icon." });
  } else {
    checks.push({ label: "Favicon", status: "pass", detail: "Favicon is configured." });
  }

  const hasFail = checks.some((c) => c.status === "fail");
  return { ready: !hasFail, checks };
}

// A QUEUED row older than this is treated as stranded (worker dispatch was
// lost before the worker route claimed it). Future publishes ignore it
// instead of refusing with ALREADY_PUBLISHING. The worker route already
// short-circuits if status !== "QUEUED" so double-start can't happen.
const STALE_QUEUED_AFTER_MS = 5 * 60 * 1000;

// A BUILDING/DEPLOYING row whose worker died mid-build (lambda crash/timeout)
// never reaches a terminal state. The worker route's maxDuration is 300s, so
// anything still "active" 3× past that is dead. Without this cutoff the
// partial unique index publish_build_jobs_active_unique blocks every future
// publish for the site forever.
const STALE_BUILDING_AFTER_MS = 15 * 60 * 1000;

// Retry the worker dispatch a few times. The route is long-running by design
// (maxDuration=300 — entire build runs inside POST), so we can't await the
// full response. Race the fetch against a short window: if the call hasn't
// settled in that window the connection is up and the worker is processing
// (success). If it throws or returns non-2xx inside the window, dispatch
// failed — retry.
async function dispatchWorker(baseUrl: string, jobId: string): Promise<boolean> {
  const retryDelaysMs = [200, 500];
  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt++) {
    const settled = fetch(`${baseUrl}/api/workers/publish/${jobId}`, {
      method: "POST",
      headers: { "x-worker-secret": process.env.CRON_SECRET ?? "" },
    }).then(
      (res) => (res.ok ? "ok" : "http-error") as "ok" | "http-error",
      () => "network-error" as const,
    );

    const result = await Promise.race([
      settled,
      new Promise<"in-flight">((r) => setTimeout(() => r("in-flight"), 2000)),
    ]);

    if (result === "in-flight" || result === "ok") return true;
    if (attempt < retryDelaysMs.length) {
      await new Promise((r) => setTimeout(r, retryDelaysMs[attempt]));
    }
  }
  return false;
}

export async function startPublish(
  siteId: string,
  workspaceId: string,
  userId: string,
  pages?: PublishPage[],
  /** Set when the publisher has seen and accepted that the approval is stale
   *  (the site changed since it was approved) and wants to publish anyway. */
  acknowledgeStale?: boolean,
) {
  const staleCutoff = new Date(Date.now() - STALE_QUEUED_AFTER_MS);
  const buildingCutoff = new Date(Date.now() - STALE_BUILDING_AFTER_MS);
  const existing = await prisma.publishBuildJob.findFirst({
    where: {
      siteId,
      OR: [
        // startedAt gte cutoff = worker still plausibly alive. A BUILDING row
        // with null startedAt can't match gte and is treated as stale.
        { status: { in: ["BUILDING", "DEPLOYING"] }, startedAt: { gte: buildingCutoff } },
        { status: "QUEUED", createdAt: { gte: staleCutoff } },
      ],
    },
  });
  if (existing) {
    throw new Error("ALREADY_PUBLISHING");
  }

  // Stranded-row cleanup: a QUEUED row older than the stale cutoff lost its
  // worker dispatch; a BUILDING/DEPLOYING row past the building cutoff lost
  // its worker mid-build. The precheck above already considers both dead, but
  // the partial unique index publish_build_jobs_active_unique would still
  // collide with our new INSERT. Flip those rows to FAILED first so the
  // slot is free; the FAILED rows stay in the audit trail.
  await prisma.publishBuildJob.updateMany({
    where: {
      siteId,
      OR: [
        { status: "QUEUED", createdAt: { lt: staleCutoff } },
        {
          status: { in: ["BUILDING", "DEPLOYING"] },
          OR: [{ startedAt: { lt: buildingCutoff } }, { startedAt: null }],
        },
      ],
    },
    data: { status: "FAILED", error: "STRANDED_BY_WORKER_DISPATCH_LOSS", log: Prisma.DbNull },
  });

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { name: true, deletedAt: true, publishedUrl: true, workspaceId: true, lastEditedAt: true },
  });
  if (!site || site.deletedAt) throw new Error("SITE_NOT_FOUND");

  // m-approval gate: in a workspace that requires approval, a publish is blocked
  // unless the site's latest review is APPROVED. Only the OWNER is exempt; ADMINs
  // AND designers (EDITOR site-role) are gated. As of the M3 permission change
  // `sites.publish` requires EDITOR, not ADMIN (contracts §2 — a designer may
  // publish once approved), so this gate is now the real control for everyone
  // below OWNER, which is exactly its point. Previously `editsRequireApproval`
  // was read only in settings and never enforced.
  {
    const [workspace, member] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { editsRequireApproval: true },
      }),
      prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } },
        select: { role: true },
      }),
    ]);
    if (workspace?.editsRequireApproval) {
      const latestReview = await prisma.reviewRequest.findFirst({
        where: { siteId },
        orderBy: { createdAt: "desc" },
        select: { status: true, resolvedAt: true },
      });
      const block = publishApprovalBlock({
        editsRequireApproval: true,
        role: member?.role ?? "EDITOR",
        latestReviewStatus: latestReview?.status ?? null,
        latestReviewResolvedAt: latestReview?.resolvedAt ?? null,
        siteLastEditedAt: site.lastEditedAt,
        acknowledgeStale,
      });
      // Distinct errors: "not-approved" needs a review; "stale" was approved but
      // the site changed since, so the publisher must re-send or acknowledge.
      if (block === "not-approved") throw new Error("APPROVAL_REQUIRED");
      if (block === "stale-unacknowledged") throw new Error("APPROVAL_STALE");
    }
  }

  // Refuse to queue a publish that cannot succeed. Sites deploy into the
  // workspace's own Vercel account, so with no connection the worker reaches
  // runVercelDeploy and throws — but only after the job has queued, shown a
  // progress bar, and marked the site PUBLISHING. Checking here means the user
  // sees "connect Vercel" instead of a build that pretends to run and then dies.
  // Dev keeps its no-credentials loop: runSimulation covers it there.
  if (process.env.NODE_ENV !== "development") {
    const vercel = await getActiveVercelConnection(site.workspaceId);
    if (!vercel) throw new Error("VERCEL_NOT_CONNECTED");
  }

  // Persist HTML payload (if provided) on the job so the worker can deploy
  // without re-fetching from the editor. `log` is an existing Json column.
  // Pages omitted = worker falls back to dev simulation (current behavior).
  //
  // The partial unique index publish_build_jobs_active_unique guarantees
  // at most one ACTIVE job per site at the DB layer. A parallel publish
  // that races past the precheck above lands here and the create throws
  // P2002 — we translate that to ALREADY_PUBLISHING so callers see the
  // same error either way.
  // Expand the page-set with CMS dynamic pages (one per entry of a page-generating
  // collection). No-op for sites without such a collection — existing publishes
  // are unaffected.
  const finalPages = pages ? await appendDynamicPagesToPublish(siteId, pages) : pages;

  let job;
  try {
    job = await prisma.publishBuildJob.create({
      data: {
        siteId,
        workspaceId,
        status: "QUEUED",
        progress: 0,
        steps: [],
        log: finalPages ? { pages: finalPages } : undefined,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("ALREADY_PUBLISHING");
    }
    throw err;
  }

  await prisma.site.update({
    where: { id: siteId },
    data: { status: "PUBLISHING", lastPublishedBy: userId },
  });

  notifyWorkspaceOwner(
    workspaceId,
    "SITE_PUBLISHED",
    `Site "${site?.name ?? "Untitled"}" publish started`,
    `/dashboard/sites/${siteId}`,
  ).catch(() => {});

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const dispatched = await dispatchWorker(baseUrl, job.id);
  if (!dispatched) {
    // Roll the job into FAILED so a future publish can claim a new one
    // immediately (without waiting for the 5-min stale cutoff). Restore
    // site.status — keep PUBLISHED if a prior deploy is still live.
    await prisma.$transaction([
      prisma.publishBuildJob.update({
        where: { id: job.id },
        data: { status: "FAILED", error: "WORKER_DISPATCH_FAILED", log: Prisma.DbNull },
      }),
      prisma.site.update({
        where: { id: siteId },
        data: { status: site.publishedUrl ? "PUBLISHED" : "DRAFT" },
      }),
    ]);
    throw new Error("WORKER_DISPATCH_FAILED");
  }

  return job;
}

export async function getPublishStatus(jobId: string) {
  // Explicit select — NEVER return the `log` column to clients: it holds the raw
  // page HTML payload (see startPublish). Clients only need progress/status.
  return prisma.publishBuildJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      siteId: true,
      status: true,
      progress: true,
      steps: true,
      deploymentId: true,
      error: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
    },
  });
}

export async function cancelPublish(jobId: string) {
  const job = await prisma.publishBuildJob.findUnique({ where: { id: jobId } });
  if (!job || !["QUEUED", "BUILDING"].includes(job.status)) {
    throw new Error("NOT_CANCELLABLE");
  }
  const [updated] = await prisma.$transaction([
    prisma.publishBuildJob.update({
      where: { id: jobId },
      // Clear `log` — it holds the raw page HTML payload from startPublish.
      // Once the job is terminal we don't need it; leaving it bloats the
      // row and keeps the rendered HTML at rest forever.
      data: { status: "CANCELLED", log: Prisma.DbNull },
    }),
    prisma.site.update({
      where: { id: job.siteId },
      data: { status: "DRAFT" },
    }),
  ]);
  return updated;
}

export async function completePublish(jobId: string, publicUrl: string) {
  const job = await prisma.publishBuildJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("JOB_NOT_FOUND");

  const [updated] = await prisma.$transaction([
    prisma.publishBuildJob.update({
      where: { id: jobId },
      data: { status: "COMPLETED", completedAt: new Date(), log: Prisma.DbNull },
    }),
    prisma.site.update({
      where: { id: job.siteId },
      data: {
        status: "PUBLISHED",
        publishedUrl: publicUrl,
        lastPublishedAt: new Date(),
      },
    }),
  ]);

  return updated;
}

export async function unpublishSite(siteId: string) {
  return prisma.site.update({
    where: { id: siteId },
    data: { status: "DRAFT", publishedUrl: null },
  });
}

/**
 * Run a real Vercel deployment for the workspace's active OAuth connection.
 * Returns null when there's no active connection in development mode
 * (caller falls through to runSimulation). Throws VERCEL_NOT_CONNECTED
 * in production. Throws VERCEL_TOKEN_INVALID on 401 (also marks
 * integration inactive).
 */
export async function runVercelDeploy(
  workspaceId: string,
  projectName: string,
  files: VercelFile[],
  // Plaintext published password to enforce via Vercel deployment protection
  // (string = set, null = clear). undefined = leave protection untouched.
  publishedPasswordPlain?: string | null,
): Promise<{ url: string; deploymentId: string } | null> {
  const conn = await getActiveVercelConnection(workspaceId);
  if (!conn) {
    // Dev returns null so the worker can fall through to runSimulation
    // (preserves no-credentials dev loop). Prod throws so the editor toast
    // can surface a reconnect link (Task 14 wires the toast).
    if (process.env.NODE_ENV === "development") return null;
    throw new Error("VERCEL_NOT_CONNECTED");
  }

  try {
    const dep = await createVercelDeployment({
      token: conn.token,
      teamId: conn.teamId,
      projectName,
      files,
    });
    const ready = await waitForDeploymentReady({
      token: conn.token,
      teamId: conn.teamId,
      deploymentId: dep.id,
    });
    if (ready.readyState !== "READY") {
      throw new Error(`VERCEL_DEPLOY_${ready.readyState}`);
    }
    // Reconcile published-site password protection on the live URL. Best-effort:
    // password protection is a Vercel Pro/Enterprise feature, so 402/403 means
    // "not available on this plan". Clearing protection (password=null) on a
    // project that has none returns 404 "Password Protection not found" — that
    // is the desired end state already, so it's an idempotent success. None of
    // these must fail an otherwise-good deploy.
    if (publishedPasswordPlain !== undefined) {
      try {
        await setProjectPasswordProtection({
          token: conn.token,
          teamId: conn.teamId,
          projectName,
          password: publishedPasswordPlain,
        });
      } catch (err) {
        if (
          err instanceof VercelApiError &&
          (err.status === 402 || err.status === 403 || err.status === 404)
        ) {
          console.warn(
            `[publish] Vercel password protection skipped for ${projectName} (${err.status})`,
          );
        } else {
          throw err;
        }
      }
    }
    return { url: pickPublicUrl(ready, projectName), deploymentId: ready.id };
  } catch (err) {
    // Vercel returns 401 for expired/invalid bearer tokens AND 403 when
    // the OAuth integration was uninstalled from the Vercel side (token
    // technically valid but no longer authorized for the team's resources).
    // Both paths must surface as VERCEL_TOKEN_INVALID so the editor toast
    // prompts a reconnect rather than showing a generic error.
    if (
      err instanceof VercelApiError &&
      (err.status === 401 || err.status === 403)
    ) {
      await markInactive(conn.id);
      throw new Error("VERCEL_TOKEN_INVALID");
    }
    throw err;
  }
}
