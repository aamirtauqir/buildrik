import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { count } = await prisma.analyticsEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return Response.json({ ok: true, deleted: count });
}
