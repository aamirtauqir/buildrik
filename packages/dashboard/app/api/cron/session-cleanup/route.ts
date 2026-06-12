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
  const { count } = await prisma.session.deleteMany({
    where: { expires: { lt: now } },
  });

  // Rate-limit windows are short (seconds–minutes); anything past resetAt is
  // dead weight. Pruned here instead of a setInterval in the limiter module
  // (module-level timers don't run reliably on serverless).
  await prisma.rateLimitBucket.deleteMany({
    where: { resetAt: { lt: now } },
  });

  return Response.json({ ok: true, deleted: count });
}
