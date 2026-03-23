import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getDashboardStats,
  getRecentSites,
  getActivityFeed,
  getWorkspaceHealth,
} from "@/server/services/dashboard.service";

export const dashboardRouter = router({
  stats: protectedProcedure.query(async ({ ctx }) => {
    const member = await ctx.prisma.workspaceMember.findFirst({
      where: { userId: ctx.session.user.id },
      select: { workspaceId: true },
    });
    if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
    return getDashboardStats(member.workspaceId);
  }),

  recentSites: protectedProcedure.query(async ({ ctx }) => {
    const member = await ctx.prisma.workspaceMember.findFirst({
      where: { userId: ctx.session.user.id },
      select: { workspaceId: true },
    });
    if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
    return getRecentSites(member.workspaceId);
  }),

  activity: protectedProcedure.query(async ({ ctx }) => {
    const member = await ctx.prisma.workspaceMember.findFirst({
      where: { userId: ctx.session.user.id },
      select: { workspaceId: true },
    });
    if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
    return getActivityFeed(member.workspaceId);
  }),

  health: protectedProcedure.query(async ({ ctx }) => {
    const member = await ctx.prisma.workspaceMember.findFirst({
      where: { userId: ctx.session.user.id },
      select: { workspaceId: true },
    });
    if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
    return getWorkspaceHealth(member.workspaceId, ctx.session.user.id);
  }),
});
