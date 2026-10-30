import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkCronAuth } from "@/lib/cron-auth";
import { SITE_RESTORE_WINDOW_DAYS } from "@buildrik/shared/schemas/sites";
import { purgeExpiredPageTrash } from "@/server/services/page-trash.service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = checkCronAuth(req);
  if (denied) return denied;

  const cutoff = new Date(Date.now() - SITE_RESTORE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const { count } = await prisma.site.deleteMany({
    where: { deletedAt: { not: null, lt: cutoff } },
  });
  // A-21: pages in "Recently deleted" past their 30 days, on the same daily run.
  const pages = await purgeExpiredPageTrash();

  return Response.json({ ok: true, deleted: count, pagesDeleted: pages.deleted });
}
