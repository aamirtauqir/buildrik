import { TRPCError } from "@trpc/server";
import type { prisma as PrismaClient } from "@/lib/prisma";
import type { UserRoleType } from "@/lib/constants/enums";
import { assertSiteAccess, checkSiteRole, PermissionError } from "@/server/services/permission.service";

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

/**
 * Write gate for site-scoped mutations: requires at least `minRole` on the site.
 * Several routers (forms submissions, site versions/components, user templates)
 * were mutating behind the READ gate, so a VIEWER could edit/delete workspace
 * data. Default EDITOR — the site-edit tier DESIGNER shares.
 */
export async function guardSiteRole(
  prisma: typeof PrismaClient,
  userId: string,
  siteId: string,
  minRole: Exclude<UserRoleType, "VIEWER"> = "EDITOR",
): Promise<void> {
  try {
    await checkSiteRole(prisma, userId, siteId, minRole);
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
}
