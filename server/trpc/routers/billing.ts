import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getBillingOverview, getUsageDetails, listInvoices,
  upgradePlan, cancelSubscription, reactivateSubscription, getPlans,
} from "@/server/services/billing.service";
import { upgradeSchema, cancelSchema } from "@/lib/validations/billing";

async function getWorkspaceId(ctx: any): Promise<string> {
  const member = await ctx.prisma.workspaceMember.findFirst({
    where: { userId: ctx.session.user.id },
    select: { workspaceId: true },
  });
  if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
  return member.workspaceId;
}

export const billingRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const wsId = await getWorkspaceId(ctx);
    return getBillingOverview(wsId);
  }),
  plans: protectedProcedure.query(() => getPlans()),
  usage: protectedProcedure.query(async ({ ctx }) => {
    const wsId = await getWorkspaceId(ctx);
    const overview = await getBillingOverview(wsId);
    return getUsageDetails(wsId, overview.plan);
  }),
  invoices: protectedProcedure
    .input(z.object({ page: z.number().min(1).default(1), perPage: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const wsId = await getWorkspaceId(ctx);
      return listInvoices(wsId, input.page, input.perPage);
    }),
  upgrade: protectedProcedure.input(upgradeSchema).mutation(async ({ ctx, input }) => {
    const wsId = await getWorkspaceId(ctx);
    try { return await upgradePlan(wsId, input); }
    catch (e: unknown) {
      if (e instanceof Error && e.message === "ALREADY_SUBSCRIBED") throw new TRPCError({ code: "CONFLICT", message: "Already subscribed." });
      throw e;
    }
  }),
  cancel: protectedProcedure.input(cancelSchema).mutation(async ({ ctx, input }) => {
    const wsId = await getWorkspaceId(ctx);
    try { return await cancelSubscription(wsId, input); }
    catch (e: unknown) {
      if (e instanceof Error && e.message === "ALREADY_CANCELLED") throw new TRPCError({ code: "BAD_REQUEST", message: "Already cancelled." });
      throw e;
    }
  }),
  reactivate: protectedProcedure.mutation(async ({ ctx }) => {
    const wsId = await getWorkspaceId(ctx);
    return reactivateSubscription(wsId);
  }),
});
