import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getDashboardStats,
  getRecentSites,
  getActivityFeed,
  getWorkspaceHealth,
  getQuickActions,
} from "@/server/services/dashboard.service";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";

async function getWorkspaceMember(ctx: { prisma: any; session: any }) {
  const member = await ctx.prisma.workspaceMember.findFirst({
    where: { userId: ctx.session.user.id },
    select: { workspaceId: true, role: true },
  });
  if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
  return member;
}

export const dashboardRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    const member = await getWorkspaceMember(ctx);
    return getDashboardStats(member.workspaceId, member.role);
  }),

  recentSites: protectedProcedure.query(async ({ ctx }) => {
    const member = await getWorkspaceMember(ctx);
    return getRecentSites(member.workspaceId);
  }),

  activity: protectedProcedure
    .input(
      z
        .object({
          filter: z.enum(["all", "mine", "team"]).optional().default("all"),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const member = await getWorkspaceMember(ctx);
      const userId = input?.filter === "mine" ? ctx.session.user.id : undefined;
      return getActivityFeed(member.workspaceId, { userId });
    }),

  health: protectedProcedure.query(async ({ ctx }) => {
    const member = await getWorkspaceMember(ctx);
    return getWorkspaceHealth(member.workspaceId, ctx.session.user.id);
  }),

  quickActions: protectedProcedure.query(async ({ ctx }) => {
    const member = await ctx.prisma.workspaceMember.findFirst({
      where: { userId: ctx.session.user.id },
      include: { workspace: { select: { plan: true } } },
    });
    if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });

    const [siteCount, subscription, pendingInvites] = await Promise.all([
      ctx.prisma.site.count({ where: { workspaceId: member.workspaceId } }),
      ctx.prisma.subscription.findUnique({
        where: { workspaceId: member.workspaceId },
        select: { status: true },
      }),
      ctx.prisma.invite.count({
        where: { workspaceId: member.workspaceId, status: "PENDING" },
      }),
    ]);

    const plan = member.workspace.plan as PlanName;
    const limits = PLAN_LIMITS[plan];

    return getQuickActions({
      siteCount,
      hasPendingInvites: pendingInvites > 0,
      isNearLimit: siteCount / (limits.sites as number) >= 0.8,
      isDunning: subscription?.status === "PAST_DUE",
    });
  }),
});
