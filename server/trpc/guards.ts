import { TRPCError } from "@trpc/server";
import type { prisma as PrismaClient } from "@/lib/prisma";
import { assertSiteAccess, PermissionError } from "@/server/services/permission.service";

/**
 * Read gate for site-scoped procedures: any active member (incl. VIEWER) may
 * read. Translates the service's PermissionError into the matching TRPCError.
 * Shared by the forms + pages routers (was duplicated verbatim in both).
 */
export async function guardSiteAccess(
  prisma: typeof PrismaClient,
  userId: string,
  siteId: string,
): Promise<void> {
  try {
    await assertSiteAccess(prisma, userId, siteId);
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
}
