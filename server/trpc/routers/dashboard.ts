import { z } from "zod";
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
      select: { workspaceId: true, role: true },
    });
    if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
    return getDashboardStats(member.workspaceId, member.role);
  }),

  recentSites: protectedProcedure.query(async ({ ctx }) => {
    const member = await ctx.prisma.workspaceMember.findFirst({
      where: { userId: ctx.session.user.id },
      select: { workspaceId: true },
    });
    if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
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
      const member = await ctx.prisma.workspaceMember.findFirst({
        where: { userId: ctx.session.user.id },
        select: { workspaceId: true },
      });
      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
      const userId = input?.filter === "mine" ? ctx.session.user.id : undefined;
      return getActivityFeed(member.workspaceId, { userId });
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
