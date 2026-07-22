import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  getBillingOverview, getUsageDetails, listInvoices,
  createCheckoutSession, createPortalSession,
  cancelSubscription, reactivateSubscription, getPlans,
} from "@/server/services/billing.service";
import { upgradeSchema, cancelSchema } from "@buildrik/shared/schemas/billing";
import { type PlanName } from "@/lib/constants/plan-limits";
import { resolveWorkspaceId as getWorkspaceId } from "@/server/trpc/workspace-ctx";
import { checkWorkspaceRole, PermissionError } from "@/server/services/permission.service";

// Billing mutations (checkout, portal, cancel, interval, reactivate) move money
// and change the workspace's plan — OWNER only. Reads stay member-visible so the
// dashboard home dunning banner and usage bars work for everyone.
async function requireOwner(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  workspaceId: string,
): Promise<void> {
  try {
    await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "OWNER");
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
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
    return getUsageDetails(wsId, overview.plan as PlanName);
  }),
  invoices: protectedProcedure
    .input(z.object({ page: z.number().min(1).default(1), perPage: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const wsId = await getWorkspaceId(ctx);
      return listInvoices(wsId, input.page, input.perPage);
    }),
  createCheckoutSession: protectedProcedure.input(upgradeSchema).mutation(async ({ ctx, input }) => {
    const wsId = await getWorkspaceId(ctx);
    await requireOwner(ctx, wsId);
    try { return await createCheckoutSession(wsId, input); }
    catch (e: unknown) {
      if (e instanceof Error && e.message === "PAYMENTS_NOT_CONFIGURED") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Payments are not available yet." });
      if (e instanceof Error && e.message === "ALREADY_SUBSCRIBED") throw new TRPCError({ code: "CONFLICT", message: "You already have a subscription — manage your plan from the billing portal." });
      if (e instanceof Error && e.message.startsWith("STRIPE_PRICE_NOT_CONFIGURED")) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "That plan isn't available for checkout yet." });
      throw e;
    }
  }),
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const wsId = await getWorkspaceId(ctx);
    await requireOwner(ctx, wsId);
    try { return await createPortalSession(wsId); }
    catch (e: unknown) {
      if (e instanceof Error && e.message === "PAYMENTS_NOT_CONFIGURED") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Payments are not available yet." });
      if (e instanceof Error && e.message === "NO_STRIPE_CUSTOMER") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No billing account yet — upgrade a plan first." });
      throw e;
    }
  }),
  cancel: protectedProcedure.input(cancelSchema).mutation(async ({ ctx, input }) => {
    const wsId = await getWorkspaceId(ctx);
    await requireOwner(ctx, wsId);
    try { return await cancelSubscription(wsId, input); }
    catch (e: unknown) {
      if (e instanceof Error && e.message === "ALREADY_CANCELLED") throw new TRPCError({ code: "BAD_REQUEST", message: "Already cancelled." });
      throw e;
    }
  }),
  switchInterval: protectedProcedure
    .input(z.object({ interval: z.enum(["MONTHLY", "YEARLY"]) }))
    .mutation(async ({ ctx, input }) => {
      const wsId = await getWorkspaceId(ctx);
      await requireOwner(ctx, wsId);
      const subscription = await ctx.prisma.subscription.findUnique({ where: { workspaceId: wsId } });
      if (!subscription) throw new TRPCError({ code: "NOT_FOUND", message: "No subscription" });
      return ctx.prisma.subscription.update({
        where: { workspaceId: wsId },
        data: { interval: input.interval },
      });
    }),
  reactivate: protectedProcedure.mutation(async ({ ctx }) => {
    const wsId = await getWorkspaceId(ctx);
    await requireOwner(ctx, wsId);
    return reactivateSubscription(wsId);
  }),
});
