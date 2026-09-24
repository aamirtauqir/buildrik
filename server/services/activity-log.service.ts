import { prisma } from "@/lib/prisma";
import type { SiteActivityEntry, SiteActivityFilter, SiteActivityKind } from "@buildrik/shared/schemas/activity";

export type ActivityAction =
  | "site.settings.updated"
  | "site.published"
  | "site.publish_failed"
  | "site.unpublished"
  | "site.rolled_back"
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
  | "MEMBER_REACTIVATED"
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

/** Site actions that are a publish event. Everything else a site records is an
 *  edit, except the review actions, which sit with the comments. */
const PUBLISH_ACTIONS: readonly ActivityAction[] = ["site.published", "site.publish_failed", "site.unpublished", "site.rolled_back"];
const REVIEW_ACTIONS: readonly ActivityAction[] = ["review.revoked"];

/** Fallback text for a row recorded without a description. */
const ACTION_SUMMARY: Partial<Record<ActivityAction, string>> = {
  "site.settings.updated": "Updated site settings",
  "site.published": "Published the site",
  "site.publish_failed": "A publish failed",
  "site.unpublished": "Unpublished the site",
  "site.rolled_back": "Rolled back to an earlier version",
  "site.share_link.created": "Created a share link",
  "site.share_link.revoked": "Revoked a share link",
  "site.domain.connected": "Connected a domain",
  "site.domain.removed": "Removed a domain",
  "site.redirect.created": "Added a redirect",
  "site.redirect.deleted": "Removed a redirect",
  "review.revoked": "Withdrew the review request",
};

function kindOfAction(action: string): SiteActivityKind {
  if ((PUBLISH_ACTIONS as readonly string[]).includes(action)) return "publish";
  if ((REVIEW_ACTIONS as readonly string[]).includes(action)) return "comment";
  return "edit";
}

const COMMENT_EXCERPT = 80;

/**
 * One site's activity, newest first — the editor History › Activity tab (B6).
 *
 * Two sources, merged by time: the site's `activity_logs` rows (edits, publish
 * events, review actions) and its comments (`comments` rows — comment creation
 * is not written to the activity log). The filter narrows on the server, per
 * source: "Publish" and "Edits" never read comments, and "Comments" reads only
 * the log's review actions.
 * Actor names resolve in one user read; a client comment names its reviewer.
 */
export async function listSiteActivity(
  siteId: string,
  filter: SiteActivityFilter,
  limit = 30,
): Promise<SiteActivityEntry[]> {
  const logActions: Record<SiteActivityFilter, Record<string, unknown>> = {
    all: {},
    edits: { action: { notIn: [...PUBLISH_ACTIONS, ...REVIEW_ACTIONS] } },
    comments: { action: { in: [...REVIEW_ACTIONS] } },
    publish: { action: { in: [...PUBLISH_ACTIONS] } },
  };
  const logWhere = logActions[filter];
  // Headroom for the collapse below, so a run of repeats seldom shortens the page.
  const fetchSize = limit * 4;
  const readComments = filter === "all" || filter === "comments";

  const [logs, comments] = await Promise.all([
    prisma.activityLog.findMany({
      where: { siteId, ...logWhere },
      orderBy: { createdAt: "desc" },
      take: fetchSize,
      select: { id: true, action: true, description: true, actorId: true, createdAt: true },
    }),
    readComments
      ? prisma.comment.findMany({
          where: { siteId },
          orderBy: { createdAt: "desc" },
          take: fetchSize,
          select: { id: true, body: true, authorId: true, createdAt: true, reviewer: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const userIds = [
    ...new Set([...logs.map((l) => l.actorId), ...comments.map((c) => c.authorId)].filter((id): id is string => !!id)),
  ];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, fullName: true } })
    : [];
  const names = new Map(users.map((u) => [u.id, u.fullName]));
  const nameOf = (id: string | null) => (id ? (names.get(id) ?? null) : null);

  const rows: SiteActivityEntry[] = [
    ...logs.map((l) => ({
      id: `log:${l.id}`,
      kind: kindOfAction(l.action),
      actorName: nameOf(l.actorId),
      summary: l.description ?? ACTION_SUMMARY[l.action as ActivityAction] ?? l.action,
      actionUrl: null,
      createdAt: l.createdAt,
    })),
    ...comments.map((c) => {
      const body = c.body.trim();
      const excerpt = body.length > COMMENT_EXCERPT ? `${body.slice(0, COMMENT_EXCERPT - 1)}…` : body;
      return {
        id: `comment:${c.id}`,
        kind: "comment" as const,
        actorName: c.authorId ? nameOf(c.authorId) : (c.reviewer?.name ?? null),
        summary: `Commented: “${excerpt}”`,
        actionUrl: null,
        createdAt: c.createdAt,
      };
    }),
  ];
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  /* Most of `activity_logs` is `site.settings.updated` (the Overview card
     counted 96%), so an uncollapsed list repeats one sentence down the tab.
     Same rule as the Overview card: consecutive rows with the same actor and
     text fold into the newest, which says how many it stands for. */
  const out: Array<SiteActivityEntry & { count: number }> = [];
  for (const r of rows) {
    const last = out[out.length - 1];
    if (last && last.kind === r.kind && last.actorName === r.actorName && last.summary === r.summary) {
      last.count += 1;
      continue;
    }
    out.push({ ...r, count: 1 });
  }
  return out
    .slice(0, limit)
    .map(({ count, ...r }) => (count > 1 ? { ...r, summary: `${r.summary} · ${count} times` } : r));
}
