import { prisma } from "@/lib/prisma";
import type { GenerateSiteInput } from "@/lib/validations/templates";

const RATE_LIMIT_PER_HOUR = 3;

export async function createGenerationJob(
  workspaceId: string,
  userId: string,
  input: GenerateSiteInput
) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentCount = await prisma.aIGenerationJob.count({
    where: {
      workspaceId,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentCount >= RATE_LIMIT_PER_HOUR) {
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
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
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
