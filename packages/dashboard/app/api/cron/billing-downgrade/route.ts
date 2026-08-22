import { type NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { reconcileWorkspaceToFreePlan } from "@server/services/billing.service";
import { checkCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GRACE_DAYS = 7;

export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;

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
  let unpublished = 0;

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
    // Reconcile over-cap resources to the FREE limits. Non-destructive —
    // excess published sites are unpublished (kept as drafts), nothing
    // deleted. Runs after the plan flip so the cap is in effect.
    unpublished += await reconcileWorkspaceToFreePlan(sub.workspaceId);
    downgraded++;
  }

  return Response.json({ ok: true, downgraded, unpublished });
}
