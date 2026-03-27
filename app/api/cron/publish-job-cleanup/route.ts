import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

  const { count } = await prisma.publishBuildJob.updateMany({
    where: {
      OR: [
        // QUEUED jobs stuck for over 1 hour (never started)
        { status: "QUEUED", createdAt: { lt: cutoff } },
        // IN_PROGRESS jobs running for over 1 hour (started but not finished)
        { status: "IN_PROGRESS", startedAt: { lt: cutoff, not: null } },
      ],
    },
    data: { status: "FAILED", error: "Timed out — cleaned by cron" },
  });

  return Response.json({ ok: true, cleaned: count });
}
