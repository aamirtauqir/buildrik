/**
 * Shared helper for resolving the current request's workspace id.
 *
 * Resolution order (most authoritative first):
 *  1. Bearer token's apiToken.workspaceId — the token is issued against a
 *     specific workspace and that scope is what the request is acting
 *     against, regardless of which workspace the user "defaults to".
 *  2. session.user.workspaceId — populated at sign-in by the NextAuth jwt
 *     callback (see server/auth.config.ts), so no per-request DB hit.
 *  3. Legacy fallback: prisma.workspaceMember.findFirst — older sessions
 *     minted before the jwt callback started carrying workspaceId may not
 *     have it. Falls back to lookup for safety.
 *
 * Throws TRPCError NOT_FOUND when the user belongs to no workspace.
 *
 * @license BSD-3-Clause
 */

import { TRPCError } from "@trpc/server";

interface BearerContext {
  apiToken?: { workspaceId: string };
}

interface SessionContext {
  user?: { id?: string; workspaceId?: string | null };
}

interface PrismaContext {
  workspaceMember: {
    findFirst: (args: {
      where: { userId: string };
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
  if (ctx.session?.user?.workspaceId) {
    return ctx.session.user.workspaceId;
  }
  const userId = ctx.session?.user?.id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const member = await ctx.prisma.workspaceMember.findFirst({
    where: { userId },
    select: { workspaceId: true },
  });
  if (!member) {
    throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
  }
  return member.workspaceId;
}
