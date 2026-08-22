import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// AI-generation jobs had no reaper: a lost worker dispatch left QUEUED rows
// spinning in the wizard forever, and a worker crash stranded GENERATING_*
// rows the same way. The worker writes site+pages atomically at the end, so
// failing a stale job never leaves a partial site behind.
export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;

  const cutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

  const { count } = await prisma.aIGenerationJob.updateMany({
    where: {
      createdAt: { lt: cutoff },
      status: { in: ["QUEUED", "GENERATING_STRUCTURE", "GENERATING_CONTENT", "GENERATING_STYLES", "BUILDING"] },
    },
    data: { status: "FAILED", error: "Timed out — cleaned by cron" },
  });

  return Response.json({ ok: true, cleaned: count });
}
