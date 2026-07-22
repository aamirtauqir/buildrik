import { prisma } from "@/lib/prisma";

export type ActivityAction =
  | "site.settings.updated"
  | "site.published"
  | "site.publish_failed"
  | "site.unpublished"
  | "site.share_link.created"
  | "site.share_link.revoked"
  | "site.domain.connected"
  | "site.domain.removed"
  | "site.redirect.created"
  | "site.redirect.deleted"
  // Client review round — revoked from the editor Review panel (P0).
  | "review.revoked"
  // Team actions — the team activity feed (getTeamActivity) queries these, but
  // nothing recorded them, so the feed was always empty.
  | "MEMBER_INVITED"
  | "MEMBER_JOINED"
  | "MEMBER_REMOVED"
  | "MEMBER_ROLE_CHANGED";

interface RecordInput {
  workspaceId: string;
  siteId?: string | null;
  actorId?: string | null;
  action: ActivityAction;
  targetType?: string | null;
  targetId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function record(input: RecordInput) {
  try {
    await prisma.activityLog.create({
      data: {
        workspaceId: input.workspaceId,
        siteId: input.siteId ?? null,
        actorId: input.actorId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        description: input.description ?? null,
        metadata: input.metadata ? (input.metadata as object) : undefined,
      },
    });
  } catch (err) {
    // Activity logging must never crash the mutation path — but a silent
    // swallow hides a persistently broken audit trail. Log so it's visible.
    console.error("[activity-log] record failed:", err);
  }
}

interface RecordForSiteInput {
  siteId: string;
  actorId?: string | null;
  action: ActivityAction;
  targetType?: string | null;
  targetId?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function recordForSite(input: RecordForSiteInput) {
  try {
    const site = await prisma.site.findUnique({
      where: { id: input.siteId },
      select: { workspaceId: true },
    });
    if (!site) return;
    await record({
      workspaceId: site.workspaceId,
      siteId: input.siteId,
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      description: input.description,
      metadata: input.metadata,
    });
  } catch (err) {
    // Activity logging must never crash the mutation path — but log the
    // swallow so a broken audit trail is diagnosable.
    console.error("[activity-log] recordForSite failed:", err);
  }
}

/**
 * W4: the workspace-wide audit log — every recorded action, newest first,
 * paginated, with actor names resolved and optional action/actor filters.
 * (getTeamActivity is the limit-5 team-only feed for the dashboard widget;
 * this is the full, filterable audit trail for accountability.)
 */
export async function listWorkspaceActivity(
  workspaceId: string,
  opts: { page?: number; perPage?: number; action?: string; actorId?: string } = {},
): Promise<{
  data: Array<{ id: string; action: string; actorId: string | null; actorName: string | null; siteId: string | null; targetType: string | null; targetId: string | null; description: string | null; createdAt: Date }>;
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.min(50, Math.max(1, opts.perPage ?? 20));
  const where: Record<string, unknown> = { workspaceId };
  if (opts.action) where.action = opts.action;
  if (opts.actorId) where.actorId = opts.actorId;

  const [total, logs] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: { id: true, action: true, actorId: true, siteId: true, targetType: true, targetId: true, description: true, createdAt: true },
    }),
  ]);

  const actorIds = [...new Set(logs.map((l) => l.actorId).filter(Boolean))] as string[];
  const actors = actorIds.length
    ? await prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, fullName: true } })
    : [];
  const actorMap = new Map(actors.map((a) => [a.id, a.fullName]));

  return {
    data: logs.map((l) => ({ ...l, actorName: (l.actorId && actorMap.get(l.actorId)) ?? null })),
    total,
    page,
    totalPages: Math.ceil(total / perPage) || 1,
  };
}
