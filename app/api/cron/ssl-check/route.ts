import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSSLExpiringEmail } from "@/server/services/email.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WARN_AT_DAYS = [30, 14, 7, 3];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringDomains = await prisma.domain.findMany({
    where: {
      status: "VERIFIED",
      sslStatus: "ACTIVE",
      sslExpiresAt: { lte: thirtyDaysOut, gte: now },
    },
    include: {
      site: { select: { workspace: { select: { ownerId: true } } } },
    },
  });

  // Batch owner lookup
  const ownerIds = [...new Set(
    expiringDomains.map((d) => d.site.workspace?.ownerId).filter((id): id is string => !!id),
  )];
  const owners = await prisma.user.findMany({
    where: { id: { in: ownerIds } },
    select: { id: true, email: true },
  });
  const ownerEmailById = new Map(owners.map((o) => [o.id, o.email]));

  let notified = 0;

  for (const domain of expiringDomains) {
    const daysLeft = Math.ceil(
      (domain.sslExpiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const shouldNotify = WARN_AT_DAYS.some((d) => daysLeft <= d && daysLeft > d - 1);
    if (!shouldNotify) continue;

    const ownerId = domain.site.workspace?.ownerId;
    const email = ownerId ? ownerEmailById.get(ownerId) : null;
    if (!email) continue;

    await sendSSLExpiringEmail(email, domain.domain, domain.id).catch(() => {});
    notified++;
  }

  await prisma.domain.updateMany({
    where: { sslStatus: "ACTIVE", sslExpiresAt: { lt: now } },
    data: { sslStatus: "EXPIRED" },
  });

  return Response.json({ ok: true, notified });
}
