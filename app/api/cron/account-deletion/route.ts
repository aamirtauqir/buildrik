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

  const pending = await prisma.accountDeletionReq.findMany({
    where: {
      scheduledAt: { lte: now },
      processedAt: null,
      cancelledAt: null,
    },
    select: { id: true, userId: true },
  });

  let processed = 0;
  for (const req of pending) {
    try {
      await prisma.$transaction([
        prisma.user.delete({ where: { id: req.userId } }),
        prisma.accountDeletionReq.update({
          where: { id: req.id },
          data: { processedAt: now },
        }),
      ]);
      processed++;
    } catch (err) {
      console.error(`[account-deletion] Failed to delete user ${req.userId}:`, err);
    }
  }

  return Response.json({ processed, total: pending.length });
}
