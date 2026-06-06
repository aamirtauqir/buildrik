import { type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@lib/prisma";
import { slugifyProjectName, type VercelFile } from "@lib/vercel";
import type { PublishPage } from "@buildrik/shared/schemas/publish";
import { record as recordActivity } from "@server/services/activity-log.service";
import { runVercelDeploy } from "@server/services/publish.service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const STEPS = [
  "Generating pages",
  "Optimizing images",
  "Deploying to CDN",
  "Verifying SSL",
  "Performance check",
] as const;

function stepProgress(stepIndex: number): number {
  return Math.round(((stepIndex + 1) / STEPS.length) * 100);
}

function buildSteps(activeIndex: number, failed = false) {
  return STEPS.map((name, i) => ({
    name,
    status:
      i < activeIndex ? "done"
      : i === activeIndex ? (failed ? "failed" : "active")
      : "pending",
  }));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { jobId } = await params;

  const job = await prisma.publishBuildJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "QUEUED") {
    return new Response("Job not found or not in QUEUED state", { status: 400 });
  }

  // Read HTML payload persisted by sites.publish (if editor provided one).
  const payload = (job.log ?? null) as { pages?: PublishPage[] } | null;
  const pages = payload?.pages ?? [];

  // Vercel path requires only a pages payload — the workspace OAuth
  // connection check lives inside runVercelDeploy (publish.service), which
  // returns null in dev when neither workspace OAuth nor env token is
  // available, letting runVercelDeployJob fall through to runSimulation.
  // Earlier gate also required isVercelConfigured() (env-only VERCEL_TOKEN
  // probe) which blocked dev workspaces that connected via OAuth from ever
  // reaching the real path.
  const useVercel = pages.length > 0;

  // Single log line — primary debug signal for Phase 1d ("did real Vercel
  // path fire or did we fall through to sim?"). See editor CLAUDE.md
  // "Phase 1d — Local publish smoke test" runbook.
  console.log(
    `[publish-worker] job=${jobId} site=${job.siteId} pages=${pages.length} ` +
      `mode=${useVercel ? "vercel" : "simulation"}`,
  );

  try {
    await prisma.publishBuildJob.update({
      where: { id: jobId },
      data: {
        status: "BUILDING",
        startedAt: new Date(),
        progress: 0,
        steps: buildSteps(0),
      },
    });

    const publicUrl = useVercel
      ? await runVercelDeployJob(jobId, job.siteId, job.workspaceId, pages)
      : await runSimulation(jobId, job.siteId);

    await prisma.$transaction([
      prisma.publishBuildJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          progress: 100,
          completedAt: new Date(),
          steps: buildSteps(STEPS.length),
          // Clear `log` (raw page HTML payload). See publish.service.ts
          // for the data-at-rest rationale; same treatment in every
          // terminal-state update.
          log: Prisma.DbNull,
        },
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

    const completedSite = await prisma.site.findUnique({
      where: { id: job.siteId },
      select: { workspaceId: true, lastPublishedBy: true },
    });
    if (completedSite) {
      await recordActivity({
        workspaceId: completedSite.workspaceId,
        siteId: job.siteId,
        actorId: completedSite.lastPublishedBy,
        action: "site.published",
        targetType: "publishJob",
        targetId: jobId,
        description: `Published to ${publicUrl}`,
        metadata: { jobId, publicUrl, mode: useVercel ? "vercel" : "simulation", pages: pages.length },
      });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    if (err instanceof CancelledError) {
      return new Response("Cancelled", { status: 200 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.publishBuildJob.update({
      where: { id: jobId },
      data: { status: "FAILED", error: message, steps: buildSteps(0, true), log: Prisma.DbNull },
    });
    // Preserve PUBLISHED status on republish failure — the live deployment
    // from a prior successful publish is still serving. Discriminator is
    // publishedUrl presence (not site.status, which is "PUBLISHING" during
    // the in-flight attempt). Only demote to DRAFT when the very first
    // publish failed (site never had a live URL).
    const currentSite = await prisma.site.findUnique({
      where: { id: job.siteId },
      select: { publishedUrl: true },
    });
    if (!currentSite?.publishedUrl) {
      await prisma.site.update({
        where: { id: job.siteId },
        data: { status: "DRAFT", lastPublishError: message },
      });
    } else {
      await prisma.site.update({
        where: { id: job.siteId },
        data: { status: "PUBLISHED", lastPublishError: message },
      });
    }

    const failedSite = await prisma.site.findUnique({
      where: { id: job.siteId },
      select: { workspaceId: true, lastPublishedBy: true },
    });
    if (failedSite) {
      await recordActivity({
        workspaceId: failedSite.workspaceId,
        siteId: job.siteId,
        actorId: failedSite.lastPublishedBy,
        action: "site.publish_failed",
        targetType: "publishJob",
        targetId: jobId,
        description: `Publish failed: ${message}`,
        metadata: { jobId, error: message, mode: useVercel ? "vercel" : "simulation" },
      });
    }

    return new Response("Error", { status: 500 });
  }
}

class CancelledError extends Error {
  constructor() {
    super("CANCELLED");
    this.name = "CancelledError";
  }
}

async function checkCancelled(jobId: string): Promise<void> {
  const current = await prisma.publishBuildJob.findUnique({
    where: { id: jobId },
    select: { status: true },
  });
  if (current?.status === "CANCELLED") throw new CancelledError();
}

async function setStep(jobId: string, stepIndex: number): Promise<void> {
  await prisma.publishBuildJob.update({
    where: { id: jobId },
    data: {
      progress: stepProgress(stepIndex),
      steps: buildSteps(stepIndex + 1),
    },
  });
}

/**
 * Real Vercel deployment path. Orchestrates steps/progress tracking,
 * delegates actual Vercel HTTP work to runVercelDeploy in publish.service.
 * Returns the public URL on success. Throws on failure.
 */
async function runVercelDeployJob(
  jobId: string,
  siteId: string,
  workspaceId: string,
  pages: PublishPage[],
): Promise<string> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { slug: true, name: true },
  });
  if (!site) throw new Error("SITE_NOT_FOUND");

  const files: VercelFile[] = pages.map((p) => ({ file: p.path, data: p.html }));

  // Step 0 — Generating pages: editor already rendered HTML; just mark done.
  await checkCancelled(jobId);
  await setStep(jobId, 0);

  // Step 1 — Optimizing images: skipped in MVP.
  await checkCancelled(jobId);
  await setStep(jobId, 1);

  // Step 2 — Deploying to CDN: delegate to service (handles OAuth connection gating).
  await checkCancelled(jobId);
  const projectName = slugifyProjectName(site.slug);
  const result = await runVercelDeploy(workspaceId, projectName, files);
  if (result === null) {
    // dev mode + no workspace connection → fall through to simulation
    return runSimulation(jobId, siteId);
  }
  await prisma.publishBuildJob.update({
    where: { id: jobId },
    data: { deploymentId: result.deploymentId },
  });
  await setStep(jobId, 2);

  // Step 3 — Verifying SSL: deployment already polled to READY by service.
  await checkCancelled(jobId);
  await setStep(jobId, 3);

  // Step 4 — Performance check: skipped in MVP (Lighthouse comes later).
  await setStep(jobId, 4);

  // Prefer custom verified domain if configured, else Vercel-provided URL.
  const domain = await prisma.domain.findFirst({
    where: { siteId, status: "VERIFIED", isPrimary: true },
    select: { domain: true },
  });
  return domain?.domain ? `https://${domain.domain}` : result.url;
}

/**
 * Dev simulation fallback. Used when VERCEL_TOKEN is unset or no HTML
 * payload was sent. Preserves existing dev-without-credentials behavior.
 */
async function runSimulation(jobId: string, siteId: string): Promise<string> {
  for (let i = 0; i < STEPS.length; i++) {
    await checkCancelled(jobId);
    await prisma.publishBuildJob.update({
      where: { id: jobId },
      data: {
        progress: Math.round((i / STEPS.length) * 100),
        steps: buildSteps(i),
      },
    });
    await delay(2000);
    await setStep(jobId, i);
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { slug: true },
  });
  const domain = await prisma.domain.findFirst({
    where: { siteId, status: "VERIFIED", isPrimary: true },
    select: { domain: true },
  });
  await prisma.publishBuildJob.update({
    where: { id: jobId },
    data: { deploymentId: `sim_${jobId.slice(0, 8)}` },
  });
  return domain?.domain
    ? `https://${domain.domain}`
    : `https://${site?.slug ?? siteId}.buildrik.app`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
