import { type NextRequest } from "next/server";
import { prisma } from "@lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GRACE_DAYS = 7;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const graceCutoff = new Date(now.getTime() - GRACE_DAYS * 24 * 60 * 60 * 1000);

  // Subscriptions past due AND past the grace period
  const toDowngrade = await prisma.subscription.findMany({
    where: {
      plan: { not: "FREE" },
      status: "PAST_DUE",
      stripeCurrentPeriodEnd: { lt: graceCutoff },
    },
    select: { id: true, workspaceId: true },
  });

  let downgraded = 0;

  for (const sub of toDowngrade) {
    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: sub.id },
        data: { plan: "FREE", status: "CANCELLED" },
      }),
      prisma.workspace.update({
        where: { id: sub.workspaceId },
        data: { plan: "FREE" },
      }),
    ]);
    downgraded++;
  }

  return Response.json({ ok: true, downgraded });
}
