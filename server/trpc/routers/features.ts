import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from "@/lib/prisma";
import { listWorkspaceFeatures, setFeature } from "@/server/services/feature-flag.service";
import { featureKeySchema } from "@buildrik/shared/schemas/feature-flags";
import { checkWorkspaceRole, PermissionError } from "@/server/services/permission.service";

interface SessionCtx {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: { user: any } | null;
}

// Resolve the actor's workspace (scopes every flag op to it — IDOR guard).
async function requireWorkspace(ctx: SessionCtx): Promise<string> {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  const userId = ctx.session.user.id;
  // Honor the session's active workspace (set on switch) when it's a valid
  // ACTIVE membership; else fall back to the first membership.
  const activeId = ctx.session.user.workspaceId as string | null | undefined;
  const member =
    (await prisma.workspaceMember.findFirst({
      where: activeId ? { userId, workspaceId: activeId, status: "ACTIVE" } : { userId },
      select: { workspaceId: true },
    })) ??
    (activeId
      ? await prisma.workspaceMember.findFirst({ where: { userId }, select: { workspaceId: true } })
      : null);
  if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
  return member.workspaceId;
}

export const featuresRouter = router({
  // Any workspace member may read which flags are on (drives conditional UI).
  list: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = await requireWorkspace(ctx as unknown as SessionCtx);
    return listWorkspaceFeatures(workspaceId);
  }),

  // Toggling a flag is the runtime kill-switch — Admin only.
  set: protectedProcedure
    .input(z.object({ key: featureKeySchema, enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const c = ctx as unknown as SessionCtx;
      const workspaceId = await requireWorkspace(c);
      try {
        await checkWorkspaceRole(prisma, c.session!.user.id, workspaceId, "ADMIN");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      await setFeature(workspaceId, input.key, input.enabled);
      return { ok: true as const };
    }),
});
