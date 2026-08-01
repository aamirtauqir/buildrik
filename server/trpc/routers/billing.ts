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

/**
 * Cancel and reactivate now call Stripe before writing anything locally, so
 * they can fail in ways the old local-only versions never could: Stripe down,
 * a grandfathered row whose id Stripe 404s on, payments unconfigured. Every one
 * of those must reach the user as a readable toast — silence is what the whole
 * fix is about. Shared so cancel and reactivate cannot drift apart.
 */
function translateBillingError(e: unknown): TRPCError {
  if (e instanceof PermissionError) return new TRPCError({ code: e.code, message: e.message });
  if (e instanceof Error) {
    if (e.message === "NO_SUBSCRIPTION") return new TRPCError({ code: "PRECONDITION_FAILED", message: "There's no active subscription on this workspace." });
    if (e.message === "PAYMENTS_NOT_CONFIGURED") return new TRPCError({ code: "PRECONDITION_FAILED", message: "Payments are not available yet." });
    if (e.message === "GRANDFATHERED_NO_PORTAL") return new TRPCError({ code: "PRECONDITION_FAILED", message: "This plan was set up outside Stripe. Contact support to change or cancel it." });
  }
  // Anything left is a Stripe/network failure. Say so plainly rather than
  // letting it surface as a bare 500 — and never imply the change took effect.
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Couldn't reach Stripe — nothing was changed. Please try again." });
}

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
      if (e instanceof Error && e.message === "GRANDFATHERED_NO_PORTAL") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This plan was set up outside Stripe. Contact support to change or cancel it." });
      throw e;
    }
  }),
  cancel: protectedProcedure.input(cancelSchema).mutation(async ({ ctx, input }) => {
    const wsId = await getWorkspaceId(ctx);
    await requireOwner(ctx, wsId);
    try { return await cancelSubscription(wsId, input); }
    catch (e: unknown) {
      throw translateBillingError(e);
    }
  }),
  // switchInterval removed: it did a raw subscription.update({interval}) with no
  // Stripe reprice/proration (desyncing the DB from Stripe) and had no UI caller.
  // A real interval change must go through Stripe (Checkout/Portal).
  reactivate: protectedProcedure.mutation(async ({ ctx }) => {
    const wsId = await getWorkspaceId(ctx);
    await requireOwner(ctx, wsId);
    // Previously had no error mapping at all, so NO_SUBSCRIPTION and the Stripe
    // failures below reached the client as INTERNAL_SERVER_ERROR and the toast
    // could say nothing useful.
    try { return await reactivateSubscription(wsId); }
    catch (e: unknown) {
      throw translateBillingError(e);
    }
  }),
});
