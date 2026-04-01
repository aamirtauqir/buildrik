import { type NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { sendDunningReminderEmail } from "@server/services/email.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const GRACE_DAYS = 7;
const WARN_AT_DAYS = [GRACE_DAYS, 3, 1];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();

  const overdueSubscriptions = await prisma.subscription.findMany({
    where: {
      plan: { not: "FREE" },
      status: "PAST_DUE",
      stripeCurrentPeriodEnd: { lt: now },
    },
    include: {
      workspace: { select: { ownerId: true } },
    },
  });

  // Batch owner lookup
  const ownerIds = [...new Set(
    overdueSubscriptions.map((s) => s.workspace?.ownerId).filter((id): id is string => !!id),
  )];
  const owners = await prisma.user.findMany({
    where: { id: { in: ownerIds } },
    select: { id: true, email: true },
  });
  const ownerEmailById = new Map(owners.map((o) => [o.id, o.email]));

  let notified = 0;

  for (const sub of overdueSubscriptions) {
    const daysPastDue = Math.floor(
      (now.getTime() - sub.stripeCurrentPeriodEnd.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysLeft = Math.max(0, GRACE_DAYS - daysPastDue);

    const shouldNotify = WARN_AT_DAYS.some((d) => daysLeft <= d && daysLeft > d - 1);
    if (!shouldNotify) continue;

    const ownerId = sub.workspace?.ownerId;
    const email = ownerId ? ownerEmailById.get(ownerId) : null;
    if (!email) continue;

    await sendDunningReminderEmail(email, daysLeft).catch(() => {});
    notified++;
  }

  return Response.json({ ok: true, notified });
}
