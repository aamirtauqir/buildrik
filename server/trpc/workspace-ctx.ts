/**
 * Shared helper for resolving the current request's workspace id.
 *
 * Resolution order (most authoritative first):
 *  1. Bearer token's apiToken.workspaceId — the token is issued against a
 *     specific workspace and that scope is what the request is acting
 *     against, regardless of which workspace the user "defaults to".
 *  2. session.user.workspaceId — populated at sign-in by the NextAuth jwt
 *     callback (see server/auth.config.ts), so no per-request DB hit.
 *  3. Fallback: the canonical DEFAULT_WORKSPACE_ORDER pick — for sessions
 *     with no workspaceId, or one that is no longer an ACTIVE membership.
 *
 * Throws TRPCError NOT_FOUND when the user belongs to no workspace.
 *
 * @license BSD-3-Clause
 */

import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";

/**
 * The ONE default-workspace pick: most recently used ACTIVE membership, oldest
 * join breaking ties. Login (server/auth.config.ts), the jwt stale-claim repair
 * and every server fallback use it, so a stale session workspace can never send
 * the client and the server to different workspaces.
 */
export const DEFAULT_WORKSPACE_ORDER: Prisma.WorkspaceMemberOrderByWithRelationInput[] = [
  { lastActiveAt: "desc" },
  { joinedAt: "asc" },
];

interface BearerContext {
  apiToken?: { workspaceId: string };
}

interface SessionContext {
  user?: { id?: string; workspaceId?: string | null };
}

interface PrismaContext {
  workspaceMember: {
    findFirst: (args: {
      where: { userId: string; status: string; workspaceId?: string };
      orderBy?: Prisma.WorkspaceMemberOrderByWithRelationInput[];
      select: { workspaceId: true };
    }) => Promise<{ workspaceId: string } | null>;
  };
}

interface WorkspaceCtx {
  prisma: PrismaContext;
  session?: SessionContext | null;
  bearer?: BearerContext | null;
}

export async function resolveWorkspaceId(ctx: WorkspaceCtx): Promise<string> {
  if (ctx.bearer?.apiToken?.workspaceId) {
    return ctx.bearer.apiToken.workspaceId;
  }
  const userId = ctx.session?.user?.id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  // Per-request revocation: the JWT-baked workspaceId is only honored if it is
  // STILL an ACTIVE membership. A member removed mid-session (whose 30-day token
  // still carries the old workspaceId) no longer resolves it here.
  const sessionWs = ctx.session?.user?.workspaceId;
  if (sessionWs) {
    const active = await ctx.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId: sessionWs, status: "ACTIVE" },
      select: { workspaceId: true },
    });
    if (active) {
      return active.workspaceId;
    }
  }
  // Fall back to any ACTIVE membership; none left → access revoked.
  const member = await ctx.prisma.workspaceMember.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: DEFAULT_WORKSPACE_ORDER,
    select: { workspaceId: true },
  });
  if (!member) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Workspace access removed" });
  }
  return member.workspaceId;
}
