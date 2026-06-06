import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PrePublishChecksResult, PublishPage } from "@buildrik/shared/schemas/publish";
import { notifyWorkspaceOwner } from "@/server/services/notification.trigger";
import { getActiveVercelConnection, markInactive } from "@server/services/integrations.service";
import {
  createVercelDeployment,
  waitForDeploymentReady,
  pickPublicUrl,
  VercelApiError,
  type VercelFile,
} from "@/lib/vercel";

export async function runPrePublishChecks(siteId: string): Promise<PrePublishChecksResult> {
  const [pageCount, site, domain, emptyPages] = await Promise.all([
    prisma.page.count({ where: { siteId } }),
    prisma.site.findUnique({
      where: { id: siteId },
      select: { metaTitleTemplate: true, touchIcon: true, deletedAt: true },
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
    checks.push({ label: "Domain connected", status: "warning", detail: "No verified domain. Your site will use a buildrik.com subdomain." });
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
) {
  const staleCutoff = new Date(Date.now() - STALE_QUEUED_AFTER_MS);
  const existing = await prisma.publishBuildJob.findFirst({
    where: {
      siteId,
      OR: [
        { status: { in: ["BUILDING", "DEPLOYING"] } },
        { status: "QUEUED", createdAt: { gte: staleCutoff } },
      ],
    },
  });
  if (existing) {
    throw new Error("ALREADY_PUBLISHING");
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { name: true, deletedAt: true, publishedUrl: true },
  });
  if (!site || site.deletedAt) throw new Error("SITE_NOT_FOUND");

  // Persist HTML payload (if provided) on the job so the worker can deploy
  // without re-fetching from the editor. `log` is an existing Json column.
  // Pages omitted = worker falls back to dev simulation (current behavior).
  const job = await prisma.publishBuildJob.create({
    data: {
      siteId,
      workspaceId,
      status: "QUEUED",
      progress: 0,
      steps: [],
      log: pages ? { pages } : undefined,
    },
  });

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
