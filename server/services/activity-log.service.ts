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
  } catch {
    // Activity logging must never crash the mutation path.
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
  } catch {
    // Activity logging must never crash the mutation path.
  }
}
