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
  deleteVercelDeployment,
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

/**
 * Hand the job to the worker route. The route is long-running by design
 * (maxDuration=300 — the entire build runs inside the POST), so we cannot
 * await the full response: race the fetch against a short window, and treat
 * "still open after 2s" as the worker having taken the job.
 *
 * A RESPONSE — of any status — means the dispatch itself worked. That
 * distinction was missing, and it cost the real error every time the worker
 * threw:
 *
 *   attempt 1 → 500 (the worker ran, claimed the job, and failed)
 *   attempt 2 → 400 ("not in QUEUED state" — attempt 1 already claimed it)
 *   attempt 3 → 400
 *   → caller marks the job WORKER_DISPATCH_FAILED, OVERWRITING whatever the
 *     worker had recorded about why it actually failed.
 *
 * So every worker-side failure surfaced to the user as a dispatch problem,
 * and the retries could not possibly succeed — the first attempt takes the
 * job out of QUEUED, so 2 and 3 are guaranteed 400s. Retrying is only
 * meaningful when nothing answered at all.
 *
 * Returns whether the worker was reached. `claimed` says the job is no longer
 * ours to fail: the worker answered and owns its outcome.
 */
async function dispatchWorker(
  baseUrl: string,
  jobId: string,
): Promise<{ reached: boolean; claimed: boolean }> {
  const retryDelaysMs = [200, 500];
  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt++) {
    const settled = fetch(`${baseUrl}/api/workers/publish/${jobId}`, {
      method: "POST",
      headers: { "x-worker-secret": process.env.CRON_SECRET ?? "" },
    }).then(
      (res) => ({ kind: "answered" as const, status: res.status }),
      () => ({ kind: "network-error" as const, status: 0 }),
    );

    const result = await Promise.race([
      settled,
      new Promise<{ kind: "in-flight"; status: number }>((r) =>
        setTimeout(() => r({ kind: "in-flight", status: 0 }), 2000),
      ),
    ]);

    // Still open: the worker is building. Nothing to retry.
    if (result.kind === "in-flight") return { reached: true, claimed: true };
    // Answered — including 4xx/5xx. The worker owns the job from here; a
    // retry can only find it out of QUEUED.
    if (result.kind === "answered") {
      return { reached: true, claimed: result.status !== 401 && result.status !== 404 };
    }
    // Nothing answered. This is the only case a retry can help.
    if (attempt < retryDelaysMs.length) {
      await new Promise((r) => setTimeout(r, retryDelaysMs[attempt]));
    }
  }
  return { reached: false, claimed: false };
}

export async function startPublish(
  siteId: string,
  workspaceId: string,
  userId: string,
  pages?: PublishPage[],
  /** Set when the publisher has seen and accepted that the approval is stale
   *  (the site changed since it was approved) and wants to publish anyway. */
  acknowledgeStale?: boolean,
  /** P1 rollback: `bypassApproval` skips the approval gate — an ADMIN restoring
   *  a previously-shipped version is not a new change needing sign-off.
   *  `rolledBackFrom` tags the new job with the version it re-deployed. */
  opts?: { bypassApproval?: boolean; rolledBackFrom?: string },
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
  if (!opts?.bypassApproval) {
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
  // Skipped only when simulation is explicitly opted into. Keying this on
  // NODE_ENV meant dev silently exercised a different publish path than
  // production, which is how the dashboard's no-payload publish stayed
  // invisible locally while failing every time in prod.
  if (process.env.PUBLISH_ALLOW_SIMULATION !== "true") {
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
        ...(opts?.rolledBackFrom ? { rolledBackFrom: opts.rolledBackFrom } : {}),
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
  const dispatch = await dispatchWorker(baseUrl, job.id);
  /*
    Only claim the job back when the worker was never reached. If it answered
    — even with a 500 — it has already written its own status and error, and
    overwriting that with WORKER_DISPATCH_FAILED destroys the one record of
    what actually went wrong. That is what used to happen on every worker-side
    failure, which is why local publishes all reported a dispatch problem they
    did not have.
  */
  if (!dispatch.reached || !dispatch.claimed) {
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

/** How many COMPLETED publishes keep their re-deployable payload, per site
 *  (contract §5: keep 20 published versions). Older ones are pruned to bound
 *  the HTML-at-rest; the most-recent (the live version) is always retained. */
const PUBLISH_HISTORY_RETAINED = 20;

export async function completePublish(jobId: string, publicUrl: string) {
  const job = await prisma.publishBuildJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("JOB_NOT_FOUND");

  const [updated] = await prisma.$transaction([
    prisma.publishBuildJob.update({
      where: { id: jobId },
      // P1: KEEP the log payload (was `log: Prisma.DbNull`) so this version can
      // be rolled back later. Storage is bounded by the prune below.
      data: { status: "COMPLETED", completedAt: new Date() },
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

  // Prune: null the payload on COMPLETED jobs older than the 20 most recent for
  // this site, so retained HTML never grows unbounded.
  const stale = await prisma.publishBuildJob.findMany({
    where: { siteId: job.siteId, status: "COMPLETED", log: { not: Prisma.DbNull } },
    orderBy: { completedAt: "desc" },
    skip: PUBLISH_HISTORY_RETAINED,
    select: { id: true },
  });
  if (stale.length > 0) {
    await prisma.publishBuildJob.updateMany({
      where: { id: { in: stale.map((j) => j.id) } },
      data: { log: Prisma.DbNull },
    });
  }

  return updated;
}

export interface PublishHistoryRow {
  id: string;
  /** Ascending version number within the returned window (oldest = 1). */
  version: number;
  completedAt: Date | null;
  deploymentId: string | null;
  /** True when the payload is still retained (this version can be re-deployed). */
  rollbackable: boolean;
  /** The version this publish re-deployed, if it was itself a rollback. */
  rolledBackFrom: string | null;
}

/**
 * A site's published-version history (contract §5), newest first, capped at the
 * retained window. Reads `log` ONLY to derive `rollbackable`; the raw HTML
 * payload NEVER leaves the service (mirrors getPublishStatus's discipline).
 */
export async function getPublishHistory(siteId: string): Promise<PublishHistoryRow[]> {
  const jobs = await prisma.publishBuildJob.findMany({
    where: { siteId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: PUBLISH_HISTORY_RETAINED,
    select: { id: true, completedAt: true, deploymentId: true, rolledBackFrom: true, log: true },
  });
  return jobs.map((j, i) => ({
    id: j.id,
    version: jobs.length - i,
    completedAt: j.completedAt,
    deploymentId: j.deploymentId,
    rollbackable: j.log != null,
    rolledBackFrom: j.rolledBackFrom,
  }));
}

/**
 * Roll back to a prior COMPLETED version by RE-PUBLISHING its stored payload as
 * a NEW job (contract §5: rollback is a new publish, never a mutation of
 * history). Bypasses the approval gate — an ADMIN restoring a version that was
 * already shipped is not a new change to sign off — and refuses a target that
 * isn't completed or whose payload was pruned.
 */
export async function rollbackPublish(
  workspaceId: string,
  siteId: string,
  jobId: string,
  userId: string,
) {
  const target = await prisma.publishBuildJob.findFirst({
    where: { id: jobId, siteId, site: { workspaceId } },
    select: { id: true, status: true, log: true },
  });
  if (!target) throw new Error("NOT_FOUND");
  if (target.status !== "COMPLETED") throw new Error("NOT_ROLLBACKABLE");
  const pages = (target.log as { pages?: PublishPage[] } | null)?.pages;
  if (!pages) throw new Error("NOT_ROLLBACKABLE");
  return startPublish(siteId, workspaceId, userId, pages, false, {
    bypassApproval: true,
    rolledBackFrom: jobId,
  });
}

export async function unpublishSite(siteId: string) {
  // Actually take the site down on Vercel — deleting the production deployment
  // removes it from the web (the project + custom domains stay attached, so a
  // later publish restores everything). Without this, unpublish only flipped
  // the DB to DRAFT while the deployment stayed live and crawlable.
  //
  // Best-effort: a Vercel failure must not block the local unpublish — the user
  // asked for the site to be a draft, and a stale deployment is better handled
  // by a retry than by refusing the whole action.
  try {
    const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
    const lastJob = await prisma.publishBuildJob.findFirst({
      where: { siteId, status: "COMPLETED", deploymentId: { not: null } },
      orderBy: { completedAt: "desc" },
      select: { deploymentId: true },
    });
    if (site && lastJob?.deploymentId) {
      const conn = await getActiveVercelConnection(site.workspaceId);
      if (conn) {
        await deleteVercelDeployment({
          token: conn.token,
          teamId: conn.teamId,
          deploymentId: lastJob.deploymentId,
        });
      }
    }
  } catch (e) {
    console.error(`[unpublish] Vercel take-down failed for site ${siteId}:`, e instanceof Error ? e.message : e);
  }

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
    // Returns null ONLY when simulation is explicitly opted into, so the worker
    // can fall through to runSimulation for a no-credentials local loop.
    // Otherwise throw, so the editor toast can surface a reconnect link. Was
    // keyed on NODE_ENV, which made dev and prod take different publish paths.
    if (process.env.PUBLISH_ALLOW_SIMULATION === "true") return null;
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
