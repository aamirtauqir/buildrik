import { type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;

  const now = new Date();
  const cutoff = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

  // The worker writes BUILDING (then DEPLOYING) — never IN_PROGRESS. A job
  // stuck in one of those states past the cutoff lost its worker mid-build;
  // its site is stranded in PUBLISHING and the partial unique index
  // publish_build_jobs_active_unique blocks every future publish until the
  // row leaves the active set.
  const stale = await prisma.publishBuildJob.findMany({
    where: {
      OR: [
        // QUEUED jobs stuck for over 1 hour (never started)
        { status: "QUEUED", createdAt: { lt: cutoff } },
        // BUILDING/DEPLOYING jobs running for over 1 hour (worker died)
        {
          status: { in: ["BUILDING", "DEPLOYING"] },
          OR: [{ startedAt: { lt: cutoff } }, { startedAt: null, createdAt: { lt: cutoff } }],
        },
      ],
    },
    select: {
      id: true,
      site: { select: { id: true, status: true, publishedUrl: true } },
    },
  });

  const error = "Timed out — cleaned by cron";
  for (const job of stale) {
    const ops: Prisma.PrismaPromise<unknown>[] = [
      prisma.publishBuildJob.update({
        where: { id: job.id },
        // Clear `log` — terminal-state rule, it holds raw page HTML at rest.
        data: { status: "FAILED", error, log: Prisma.DbNull },
      }),
    ];
    // Only touch the site if this dead job left it stuck in PUBLISHING —
    // same demotion rule as the worker's FAILED path.
    if (job.site.status === "PUBLISHING") {
      ops.push(
        prisma.site.update({
          where: { id: job.site.id },
          data: {
            status: job.site.publishedUrl ? "PUBLISHED" : "DRAFT",
            lastPublishError: error,
          },
        }),
      );
    }
    await prisma.$transaction(ops);
  }

  return Response.json({ ok: true, cleaned: stale.length });
}
