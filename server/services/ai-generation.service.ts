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

  // Monthly plan limit check (-1 = unlimited)
  if (monthlyLimit >= 0) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyCount = await prisma.aIGenerationJob.count({
      where: { workspaceId, createdAt: { gte: startOfMonth } },
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
  if (input.tone) metadata.tone = input.tone;
  if (input.content) metadata.content = input.content;
  if (input.images) metadata.images = input.images;

  return prisma.aIGenerationJob.create({
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
}

export async function getJobStatus(jobId: string) {
  const job = await prisma.aIGenerationJob.findUnique({
    where: { id: jobId },
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

export async function cancelJob(jobId: string) {
  const job = await prisma.aIGenerationJob.findUnique({
    where: { id: jobId },
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
