import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

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

  try {
    // Mark as building
    await prisma.publishBuildJob.update({
      where: { id: jobId },
      data: {
        status: "BUILDING",
        startedAt: new Date(),
        progress: 0,
        steps: buildSteps(0),
      },
    });

    for (let i = 0; i < STEPS.length; i++) {
      // Check if cancelled between steps
      const current = await prisma.publishBuildJob.findUnique({
        where: { id: jobId },
        select: { status: true },
      });
      if (current?.status === "CANCELLED") {
        return new Response("Cancelled", { status: 200 });
      }

      await prisma.publishBuildJob.update({
        where: { id: jobId },
        data: {
          progress: Math.round((i / STEPS.length) * 100),
          steps: buildSteps(i),
        },
      });

      // Simulate work for each step (~2s each in production, shortened for now)
      await delay(2000);

      await prisma.publishBuildJob.update({
        where: { id: jobId },
        data: {
          progress: stepProgress(i),
          steps: buildSteps(i + 1),
        },
      });
    }

    // Determine public URL
    const site = await prisma.site.findUnique({
      where: { id: job.siteId },
      select: { slug: true },
    });
    const domain = await prisma.domain.findFirst({
      where: { siteId: job.siteId, status: "VERIFIED", isPrimary: true },
      select: { domain: true },
    });
    const publicUrl = domain?.domain
      ? `https://${domain.domain}`
      : `https://${site?.slug ?? job.siteId}.buildrik.app`;

    await prisma.$transaction([
      prisma.publishBuildJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          progress: 100,
          completedAt: new Date(),
          deploymentId: `deploy_${jobId.slice(0, 8)}`,
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

    return new Response("OK", { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.publishBuildJob.update({
      where: { id: jobId },
      data: { status: "FAILED", error: message },
    });
    await prisma.site.update({
      where: { id: job.siteId },
      data: { status: "DRAFT" },
    });
    return new Response("Error", { status: 500 });
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
