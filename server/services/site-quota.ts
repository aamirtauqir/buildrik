import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";

/**
 * What the user is told, wherever they hit it.
 *
 * The three doors that raise SITE_LIMIT each wrote their own copy, and only
 * `sites.create` mentioned upgrading — duplicating a site or applying a
 * template said "Site limit reached." and stopped, at the exact moment the
 * product has a paid answer to the problem it just described. One string, so
 * the next door added cannot get it wrong either.
 */
export const SITE_LIMIT_MESSAGE =
  "Site limit reached. Upgrade your plan in Settings → Billing to create more sites.";

/**
 * Refuse a new site when the workspace is at its plan's cap.
 *
 * Lives in its own module rather than in `sites.service.ts` because
 * `template.service.ts` needs it too and sites.service already imports
 * template.service — putting it there would close a cycle.
 *
 * The check was written out three times (create a site, duplicate a site,
 * instantiate a template), byte-identical. They agreed; the next edit to one of
 * them is where they would have stopped agreeing.
 *
 * A soft-deleted site does not hold a slot: the count is scoped to
 * `deletedAt: null`, which is what makes "delete one, make another" work on a
 * full FREE workspace.
 *
 * @throws Error("SITE_LIMIT") — routers translate it with SITE_LIMIT_MESSAGE.
 */
export async function assertSiteQuota(workspaceId: string, userId: string): Promise<void> {
  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId },
    include: { workspace: { select: { plan: true } } },
  });

  const plan = (membership?.workspace?.plan as PlanName) ?? "FREE";
  const limit = PLAN_LIMITS[plan].sites as number;

  const currentCount = await prisma.site.count({
    where: { workspaceId, deletedAt: null },
  });

  if (currentCount >= limit) {
    throw new Error("SITE_LIMIT");
  }
}
