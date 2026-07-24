import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";

interface WorkspaceCtx {
  prisma: PrismaClient;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: { user: any } | null;
}
import {
  getTeamStats, listMembers, inviteMembers, changeRole,
  revokeMember, reactivateMember, deleteMember, listPendingInvites, revokeInvite, resendInvite, getTeamActivity,
} from "@/server/services/team.service";
import { inviteMembersSchema, listMembersSchema, changeRoleSchema } from "@buildrik/shared/schemas/team";
import { type PlanName } from "@/lib/constants/plan-limits";
import { checkWorkspaceRole, PermissionError } from "@/server/services/permission.service";
import { record as recordActivity, listWorkspaceActivity } from "@/server/services/activity-log.service";
import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";

// Resolve via the shared helper so team ops act on the session's ACTIVE
// workspace — not the first membership row. The old findFirst({userId}) with no
// status filter let SUSPENDED members read team data and, for multi-workspace
// admins, targeted mutations at the wrong workspace.
async function getWorkspaceCtx(ctx: WorkspaceCtx): Promise<{ workspaceId: string; plan: PlanName }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workspaceId = await resolveWorkspaceId(ctx as any);
  const workspace = await ctx.prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { plan: true },
  });
  if (!workspace) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
  return { workspaceId, plan: workspace.plan as PlanName };
}

// Team-management mutations require ADMIN/OWNER. Returns the actor's workspace
// so the service can scope the target row to it (IDOR guard).
async function requireAdmin(ctx: WorkspaceCtx): Promise<{ workspaceId: string; plan: PlanName }> {
  const wc = await getWorkspaceCtx(ctx);
  try {
    await checkWorkspaceRole(ctx.prisma, ctx.session!.user.id, wc.workspaceId, "ADMIN");
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
  return wc;
}

export const teamRouter = router({
  // Team roster, seats, and (below) pending-invite emails + activity are
  // ADMIN/OWNER only — they expose every member's name+email and all
  // pending-invite addresses, which any member could previously read.
  stats: protectedProcedure.query(async ({ ctx }) => {
    const { workspaceId } = await requireAdmin(ctx);
    return getTeamStats(workspaceId);
  }),
  list: protectedProcedure.input(listMembersSchema).query(async ({ ctx, input }) => {
    const { workspaceId } = await requireAdmin(ctx);
    return listMembers(workspaceId, input);
  }),
  // W4: the workspace-wide audit log (full, filterable, paginated). Audit trails
  // are sensitive — ADMIN/OWNER only.
  auditLog: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).optional(),
        perPage: z.number().min(1).max(50).optional(),
        action: z.string().optional(),
        actorId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { workspaceId } = await requireAdmin(ctx);
      return listWorkspaceActivity(workspaceId, input);
    }),
  invite: protectedProcedure.input(inviteMembersSchema).mutation(async ({ ctx, input }) => {
    const { workspaceId, plan } = await requireAdmin(ctx);
    try {
      const result = await inviteMembers(workspaceId, ctx.session.user.id, input, plan);
      await recordActivity({
        workspaceId,
        actorId: ctx.session.user.id,
        action: "MEMBER_INVITED",
        metadata: { count: input.emails?.length ?? 1 },
      });
      return result;
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "TEAM_LIMIT") throw new TRPCError({ code: "FORBIDDEN", message: "Team member limit reached." });
      throw e;
    }
  }),
  changeRole: protectedProcedure
    .input(changeRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const { workspaceId } = await requireAdmin(ctx);
      try {
        const result = await changeRole(input.memberId, input.role, workspaceId, ctx.session.user.id);
        await recordActivity({
          workspaceId,
          actorId: ctx.session.user.id,
          action: "MEMBER_ROLE_CHANGED",
          targetType: "member",
          targetId: input.memberId,
          metadata: { role: input.role },
        });
        return result;
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "CANNOT_MODIFY_SELF") throw new TRPCError({ code: "FORBIDDEN", message: "You can't change your own role." });
        if (e instanceof Error && e.message === "CANNOT_CHANGE_OWNER") throw new TRPCError({ code: "FORBIDDEN", message: "Cannot change owner role." });
        if (e instanceof Error && e.message === "LAST_ADMIN") throw new TRPCError({ code: "FORBIDDEN", message: "Cannot demote last admin." });
        throw e;
      }
    }),
  revoke: protectedProcedure.input(z.object({ memberId: z.string() })).mutation(async ({ ctx, input }) => {
    const { workspaceId } = await requireAdmin(ctx);
    try {
      const result = await revokeMember(input.memberId, workspaceId, ctx.session.user.id);
      await recordActivity({
        workspaceId,
        actorId: ctx.session.user.id,
        action: "MEMBER_REMOVED",
        targetType: "member",
        targetId: input.memberId,
      });
      return result;
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "CANNOT_MODIFY_SELF") throw new TRPCError({ code: "FORBIDDEN", message: "You can't revoke your own access." });
      throw e;
    }
  }),
  reactivate: protectedProcedure.input(z.object({ memberId: z.string() })).mutation(async ({ ctx, input }) => {
    const { workspaceId } = await requireAdmin(ctx);
    try {
      const result = await reactivateMember(input.memberId, workspaceId);
      await recordActivity({
        workspaceId,
        actorId: ctx.session.user.id,
        action: "MEMBER_REACTIVATED",
        targetType: "member",
        targetId: input.memberId,
      });
      return result;
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "NOT_SUSPENDED") throw new TRPCError({ code: "BAD_REQUEST", message: "Member isn't suspended." });
      throw e;
    }
  }),
  delete: protectedProcedure.input(z.object({ memberId: z.string() })).mutation(async ({ ctx, input }) => {
    const { workspaceId } = await requireAdmin(ctx);
    try {
      await deleteMember(input.memberId, workspaceId);
      await recordActivity({
        workspaceId,
        actorId: ctx.session.user.id,
        action: "MEMBER_REMOVED",
        targetType: "member",
        targetId: input.memberId,
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "CANNOT_DELETE_OWNER") throw new TRPCError({ code: "FORBIDDEN", message: "Cannot remove workspace owner." });
      throw e;
    }
  }),
  pendingInvites: protectedProcedure.query(async ({ ctx }) => {
    const { workspaceId } = await requireAdmin(ctx);
    return listPendingInvites(workspaceId);
  }),
  revokeInvite: protectedProcedure.input(z.object({ inviteId: z.string() })).mutation(async ({ ctx, input }) => {
    const { workspaceId } = await requireAdmin(ctx);
    return revokeInvite(input.inviteId, workspaceId);
  }),
  resendInvite: protectedProcedure.input(z.object({ inviteId: z.string() })).mutation(async ({ ctx, input }) => {
    const { workspaceId } = await requireAdmin(ctx);
    return resendInvite(input.inviteId, workspaceId);
  }),
  activity: protectedProcedure.query(async ({ ctx }) => {
    const { workspaceId } = await requireAdmin(ctx);
    return getTeamActivity(workspaceId);
  }),
});
