import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getTeamStats, listMembers, inviteMembers, changeRole,
  revokeMember, deleteMember, listPendingInvites, revokeInvite, resendInvite, getTeamActivity,
} from "@/server/services/team.service";
import { inviteMembersSchema, listMembersSchema } from "@/lib/validations/team";
import { type PlanName } from "@/lib/constants/plan-limits";

async function getWorkspaceCtx(ctx: any): Promise<{ workspaceId: string; plan: PlanName }> {
  const member = await ctx.prisma.workspaceMember.findFirst({
    where: { userId: ctx.session.user.id },
    include: { workspace: { select: { plan: true } } },
  });
  if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
  return { workspaceId: member.workspaceId, plan: member.workspace.plan as PlanName };
}

export const teamRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    const { workspaceId } = await getWorkspaceCtx(ctx);
    return getTeamStats(workspaceId);
  }),
  list: protectedProcedure.input(listMembersSchema).query(async ({ ctx, input }) => {
    const { workspaceId } = await getWorkspaceCtx(ctx);
    return listMembers(workspaceId, input);
  }),
  invite: protectedProcedure.input(inviteMembersSchema).mutation(async ({ ctx, input }) => {
    const { workspaceId, plan } = await getWorkspaceCtx(ctx);
    try {
      return await inviteMembers(workspaceId, ctx.session.user.id, input, plan);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "TEAM_LIMIT") throw new TRPCError({ code: "FORBIDDEN", message: "Team member limit reached." });
      throw e;
    }
  }),
  changeRole: protectedProcedure
    .input(z.object({ memberId: z.string(), role: z.enum(["ADMIN", "EDITOR", "VIEWER"]) }))
    .mutation(async ({ ctx, input }) => {
      const { workspaceId } = await getWorkspaceCtx(ctx);
      try {
        return await changeRole(input.memberId, workspaceId, input.role, ctx.session.user.id);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "CANNOT_CHANGE_OWNER") throw new TRPCError({ code: "FORBIDDEN", message: "Cannot change owner role." });
        if (e instanceof Error && e.message === "LAST_ADMIN") throw new TRPCError({ code: "FORBIDDEN", message: "Cannot demote last admin." });
        throw e;
      }
    }),
  revoke: protectedProcedure.input(z.object({ memberId: z.string() })).mutation(async ({ input, ctx }) => {
    const { workspaceId } = await getWorkspaceCtx(ctx);
    return revokeMember(input.memberId, workspaceId);
  }),
  delete: protectedProcedure.input(z.object({ memberId: z.string() })).mutation(async ({ input, ctx }) => {
    const { workspaceId } = await getWorkspaceCtx(ctx);
    try { await deleteMember(input.memberId, workspaceId); } catch (e: unknown) {
      if (e instanceof Error && e.message === "CANNOT_DELETE_OWNER") throw new TRPCError({ code: "FORBIDDEN", message: "Cannot remove workspace owner." });
      throw e;
    }
  }),
  pendingInvites: protectedProcedure.query(async ({ ctx }) => {
    const { workspaceId } = await getWorkspaceCtx(ctx);
    return listPendingInvites(workspaceId);
  }),
  revokeInvite: protectedProcedure.input(z.object({ inviteId: z.string() })).mutation(async ({ input, ctx }) => {
    const { workspaceId } = await getWorkspaceCtx(ctx);
    return revokeInvite(input.inviteId, workspaceId);
  }),
  resendInvite: protectedProcedure.input(z.object({ inviteId: z.string() })).mutation(async ({ input, ctx }) => {
    const { workspaceId } = await getWorkspaceCtx(ctx);
    return resendInvite(input.inviteId, workspaceId);
  }),
  activity: protectedProcedure.query(async ({ ctx }) => {
    const { workspaceId } = await getWorkspaceCtx(ctx);
    return getTeamActivity(workspaceId);
  }),
});
