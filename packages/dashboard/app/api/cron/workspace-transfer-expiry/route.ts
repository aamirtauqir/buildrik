import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;

  const { count } = await prisma.workspaceTransfer.updateMany({
    where: { expiresAt: { lt: new Date() }, status: "PENDING" },
    data: { status: "EXPIRED" },
  });

  return Response.json({ ok: true, expired: count });
}
