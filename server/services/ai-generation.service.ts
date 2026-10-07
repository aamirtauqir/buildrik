import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { GenerateSiteInput } from "@buildrik/shared/schemas/templates";

const HOURLY_ANTI_ABUSE_LIMIT = 3;

export async function createGenerationJob(
  workspaceId: string,
  userId: string,
  input: GenerateSiteInput
) {
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { plan: true } });
  const plan = (ws?.plan ?? "FREE") as PlanName;
  const monthlyLimit = PLAN_LIMITS[plan].aiGenerations as number;

  // Monthly plan limit check (-1 = unlimited). Cancelled and failed jobs don't
  // count — neither writes a site (the worker persists everything in one
  // transaction at the end), so charging the monthly slot would bill work that
  // never happened. The hourly throttle below still counts them: it is
  // anti-abuse, not billing.
  if (monthlyLimit >= 0) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyCount = await prisma.aIGenerationJob.count({
      where: { workspaceId, createdAt: { gte: startOfMonth }, status: { notIn: ["CANCELLED", "FAILED"] } },
    });
    if (monthlyCount >= monthlyLimit) throw new Error("AI_MONTHLY_LIMIT");
  }

  // Hourly anti-abuse throttle (applies to all plans)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.aIGenerationJob.count({
    where: { workspaceId, createdAt: { gte: oneHourAgo } },
  });

  if (recentCount >= HOURLY_ANTI_ABUSE_LIMIT) {
    throw new Error("AI_RATE_LIMITED");
  }

  const metadata: Record<string, unknown> = {};
  // The site name the user typed — the schema requires it, but the job had no
  // column for it, so the worker fell back to naming the site after its
  // businessType enum ("BUSINESS"). Carry it through so the real name sticks.
  metadata.name = input.name;
  if (input.tone) metadata.tone = input.tone;
  if (input.content) metadata.content = input.content;
  if (input.images) metadata.images = input.images;
  // Regenerate: reuse the existing draft instead of orphaning it. Only honour a
  // siteId the caller's own workspace owns (IDOR-safe); an unowned/stale id is
  // dropped and the worker falls back to creating a new site.
  if (input.siteId) {
    const owned = await prisma.site.findFirst({
      where: { id: input.siteId, workspaceId, deletedAt: null },
      select: { id: true },
    });
    if (owned) metadata.replaceSiteId = owned.id;
  }

  const job = await prisma.aIGenerationJob.create({
    data: {
      workspaceId,
      userId,
      status: "QUEUED",
      progress: 0,
      businessType: input.businessType,
      selectedPages: input.pages,
      description: input.description ?? null,
      metadata: Object.keys(metadata).length > 0
        ? (metadata as Prisma.InputJsonValue)
        : undefined,
    },
  });

  // Dispatch the worker that actually generates the site. Fire-and-forget — the
  // client polls job status. Without this the job sat QUEUED forever (the UI
  // spun indefinitely). A dns-style retry isn't needed; a stuck QUEUED job can
  // be re-dispatched.
  void dispatchAIWorker(job.id);

  return job;
}

async function dispatchAIWorker(jobId: string): Promise<void> {
  // Same fallback chain as the publish worker dispatch — with only
  // NEXT_PUBLIC_APP_URL consulted, an unset var silently stranded every job
  // in QUEUED forever.
  const base = (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
  /* The worker answers 500 "CRON_SECRET is not configured" before it claims
     anything, and the reaper cron needs the same secret — so with it unset a
     dispatched job would sit QUEUED for good. Same process, same env: say so
     now instead of dispatching. */
  if (!process.env.CRON_SECRET) {
    await failUnclaimed(jobId, "AI generation is not configured on this server (CRON_SECRET is not set).");
    return;
  }

  /* Read the answer. A 401 (secret rejected) or 404 is a SUCCESSFUL fetch, so
     the catch alone never recorded that the job would never start; any other
     non-2xx may or may not have come after the worker's claim.

     Every failure write below is therefore guarded on the row still being
     QUEUED: the dispatcher only fails jobs no worker claimed. A claimed job's
     final status belongs to the worker — a 500 it answered comes with its own
     FAILED row and real reason, and a fetch that throws AFTER the claim (the
     worker answers only once every page is generated, and undici gives up on
     headers at 300s) must not mark a still-running job FAILED for the worker to
     flip back to COMPLETED later. */
  let unclaimed: string | null = null;
  try {
    const res = await fetch(`${base}/api/workers/ai-generate/${jobId}`, {
      method: "POST",
      headers: { "x-worker-secret": process.env.CRON_SECRET },
    });
    if (!res.ok) {
      unclaimed =
        res.status === 401
          ? "The generator refused this job (worker secret rejected). Check CRON_SECRET."
          : res.status === 404
            ? "The generator could not be reached at this deployment."
            : `The generator did not start this job (HTTP ${res.status}).`;
    }
  } catch {
    unclaimed = "The generator could not be reached. Nothing answered the request.";
  }

  if (unclaimed) await failUnclaimed(jobId, unclaimed);
}

/* Fail it loudly rather than leaving a QUEUED row nobody will ever pick up.
   The onboarding screen already renders FAILED (generating/page.tsx:83); it
   has no rendering at all for "queued forever". */
async function failUnclaimed(jobId: string, error: string): Promise<void> {
  await prisma.aIGenerationJob
    .updateMany({ where: { id: jobId, status: "QUEUED" }, data: { status: "FAILED", error } })
    .catch(() => {
      /* The job row is gone; nothing left to report to. */
    });
}

// jobId comes from the client — both reads below scope by workspaceId so a
// caller can never see or cancel another tenant's job.
export async function getJobStatus(jobId: string, workspaceId: string) {
  const job = await prisma.aIGenerationJob.findFirst({
    where: { id: jobId, workspaceId },
    select: {
      id: true,
      status: true,
      progress: true,
      steps: true,
      siteId: true,
      error: true,
    },
  });

  return job;
}

export async function cancelJob(jobId: string, workspaceId: string) {
  const job = await prisma.aIGenerationJob.findFirst({
    where: { id: jobId, workspaceId },
  });

  if (!job) {
    throw new Error("JOB_NOT_FOUND");
  }

  if (job.status !== "QUEUED" && job.status !== "GENERATING_CONTENT" && job.status !== "GENERATING_STRUCTURE") {
    throw new Error("JOB_NOT_CANCELLABLE");
  }

  return prisma.aIGenerationJob.update({
    where: { id: jobId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });
}
