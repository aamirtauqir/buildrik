import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;

  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const { count } = await prisma.formSubmission.updateMany({
    where: { ip: { not: null }, createdAt: { lt: cutoff } },
    data: { ip: null },
  });

  return Response.json({ ok: true, anonymized: count });
}
