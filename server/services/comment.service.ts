import { prisma } from "@/lib/prisma";
import type { CreateCommentInput } from "@buildrik/shared/schemas/comments";
import type { Paginated, PaginationInput } from "@buildrik/shared/schemas/pagination";

/**
 * Client comments (E7) — the ONLY layer that reads/writes the comments table.
 * Every list/resolve is scoped by siteId (the router authorizes site access
 * first), and resolve additionally requires the comment to belong to that site
 * so a crafted id can't resolve a comment on a different site.
 */

export class CommentError extends Error {
  constructor(
    public code: "NOT_FOUND",
    message: string,
  ) {
    super(message);
    this.name = "CommentError";
  }
}

export async function createComment(
  siteId: string,
  authorId: string,
  input: CreateCommentInput,
) {
  return prisma.comment.create({
    data: {
      siteId,
      authorId,
      body: input.body,
      pageId: input.pageId ?? null,
      x: input.x ?? null,
      y: input.y ?? null,
      targetSelector: input.targetSelector ?? null,
      status: "OPEN",
    },
  });
}

/**
 * Comments on a site (oldest first — pins read top-to-bottom of the thread).
 *
 * The `reviewer` join is what the editor Review panel (P0) needs to label each
 * comment: a row with `reviewerId` set is a CLIENT comment (name = reviewer.name),
 * one with `authorId` set is an INTERNAL comment. Additive — the dashboard
 * comment-preview consumer reads only the scalar pin fields.
 */
export async function listComments(siteId: string, status?: "OPEN" | "RESOLVED") {
  return prisma.comment.findMany({
    where: { siteId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "asc" },
    include: { reviewer: { select: { name: true } } },
  });
}

export interface WorkspaceCommentRow {
  id: string;
  siteId: string;
  siteName: string;
  body: string;
  status: string;
  createdAt: Date;
}

const WORKSPACE_COMMENTS_PAGE_SIZE = 50;

/** All comments across a workspace's sites (newest first) — the agency triage
 *  view. Scoped via site.workspaceId so it never leaks another workspace's.
 *  Cursor-paginated (G7 perf guard) so a busy workspace never scans the full
 *  comment table in one query. */
export async function listWorkspaceComments(
  workspaceId: string,
  status?: "OPEN" | "RESOLVED",
  page?: PaginationInput,
): Promise<Paginated<WorkspaceCommentRow>> {
  const take = Math.min(Math.max(page?.limit ?? WORKSPACE_COMMENTS_PAGE_SIZE, 1), 100);
  const rows = await prisma.comment.findMany({
    where: { site: { workspaceId }, ...(status ? { status } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(page?.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      siteId: true,
      body: true,
      status: true,
      createdAt: true,
      site: { select: { name: true } },
    },
  });
  const hasMore = rows.length > take;
  const slice = hasMore ? rows.slice(0, take) : rows;
  return {
    items: slice.map(({ site, ...c }) => ({ ...c, siteName: site.name })),
    nextCursor: hasMore ? slice[slice.length - 1].id : null,
  };
}

export async function resolveComment(
  siteId: string,
  id: string,
  status: "OPEN" | "RESOLVED",
  resolverId: string,
) {
  const owned = await prisma.comment.findFirst({
    where: { id, siteId },
    select: { id: true },
  });
  if (!owned) throw new CommentError("NOT_FOUND", "Comment not found");
  return prisma.comment.update({
    where: { id },
    data:
      status === "RESOLVED"
        ? { status, resolvedById: resolverId, resolvedAt: new Date() }
        : { status, resolvedById: null, resolvedAt: null },
  });
}
