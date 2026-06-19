import { prisma } from "@/lib/prisma";
import type { CreateCommentInput } from "@buildrik/shared/schemas/comments";

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

/** Comments on a site (oldest first — pins read top-to-bottom of the thread). */
export async function listComments(siteId: string, status?: "OPEN" | "RESOLVED") {
  return prisma.comment.findMany({
    where: { siteId, ...(status ? { status } : {}) },
    orderBy: { createdAt: "asc" },
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

/** All comments across a workspace's sites (newest first) — the agency triage
 *  view. Scoped via site.workspaceId so it never leaks another workspace's. */
export async function listWorkspaceComments(
  workspaceId: string,
  status?: "OPEN" | "RESOLVED",
): Promise<WorkspaceCommentRow[]> {
  const rows = await prisma.comment.findMany({
    where: { site: { workspaceId }, ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      siteId: true,
      body: true,
      status: true,
      createdAt: true,
      site: { select: { name: true } },
    },
  });
  return rows.map(({ site, ...c }) => ({ ...c, siteName: site.name }));
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
