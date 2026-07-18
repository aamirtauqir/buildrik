import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";

export interface SessionCtx {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: { user: any } | null;
}

/** Resolve the actor's workspace, scoping every op to a membership they hold —
 *  the IDOR guard. Honors the session's active workspace (set on switch) when
 *  it's a valid ACTIVE membership, else falls back to the first membership.
 *
 *  NOTE: features.ts and account.ts each still carry their own copy of this;
 *  they predate this module. New routers should import from here, and those two
 *  should migrate onto it in a dedicated pass (auth-path change, own review). */
export async function requireWorkspace(ctx: SessionCtx): Promise<string> {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const userId = ctx.session.user.id;
  const activeId = ctx.session.user.workspaceId as string | null | undefined;
  const member =
    (await prisma.workspaceMember.findFirst({
      where: activeId ? { userId, workspaceId: activeId, status: "ACTIVE" } : { userId, status: "ACTIVE" },
      select: { workspaceId: true },
    })) ??
    (activeId
      ? await prisma.workspaceMember.findFirst({ where: { userId, status: "ACTIVE" }, select: { workspaceId: true } })
      : null);
  if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
  return member.workspaceId;
}
