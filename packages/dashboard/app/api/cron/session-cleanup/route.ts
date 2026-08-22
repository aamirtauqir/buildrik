import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;

  const now = new Date();
  const { count } = await prisma.session.deleteMany({
    where: { expires: { lt: now } },
  });

  // Rate-limit windows are short (seconds–minutes); anything past resetAt is
  // dead weight. Pruned here instead of a setInterval in the limiter module
  // (module-level timers don't run reliably on serverless).
  await prisma.rateLimitBucket.deleteMany({
    where: { resetAt: { lt: now } },
  });

  // Upload handshakes expire after 10 minutes (enforced on read in
  // upload.service); this just clears the dead rows.
  await prisma.pendingUpload.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - 10 * 60 * 1000) } },
  });

  // Stripe stops retrying an event after ~3 days; the idempotency ledger
  // only needs to outlive that window. Prune anything older than 7 days.
  await prisma.processedWebhookEvent.deleteMany({
    where: { processedAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
  });

  return Response.json({ ok: true, deleted: count });
}
