import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: { findUnique: vi.fn(), update: vi.fn(), upsert: vi.fn() },
    invoice: { upsert: vi.fn() },
    workspace: { findFirst: vi.fn(), update: vi.fn() },
    notification: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
}));

vi.mock("@/server/services/email.service", () => ({
  sendPaymentFailedEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/server/services/stripe.client", () => ({
  getStripe: vi.fn(),
  resolvePlanFromPriceId: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getStripe, resolvePlanFromPriceId } from "@/server/services/stripe.client";

// These two builders mirror the shape Stripe actually sends (verified against
// live payloads on API 2026-01-28.clover). Three handlers shipped broken
// because this suite hand-wrote the pre-2025 shape instead — a top-level
// `invoice.subscription` and a top-level `subscription.current_period_*`,
// neither of which exists any more. Build payloads through these, not inline.
function invoiceParent(subscriptionId: string | null) {
  return { parent: { subscription_details: { subscription: subscriptionId } } };
}

function subItem(priceId: string, unitAmount: number | null) {
  return {
    price: { id: priceId, unit_amount: unitAmount },
    current_period_start: 1711900800,
    current_period_end: 1714579200,
  };
}

describe("Stripe Webhook Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("handleInvoicePaymentFailed", () => {
    it("updates subscription to PAST_DUE and creates notification", async () => {
      const { handleInvoicePaymentFailed } = await import("@/server/services/stripe-webhook.service");
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: "sub1", workspaceId: "ws1", status: "ACTIVE",
      } as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue({ id: "sub1", status: "PAST_DUE" } as any);
      vi.mocked(prisma.workspace.findFirst).mockResolvedValue({ ownerId: "u1" } as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({} as any);

      await handleInvoicePaymentFailed(invoiceParent("sub_123"));
      expect(prisma.subscription.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: "PAST_DUE" }),
      }));
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    // Regression: dunning used to hang off charge.failed reading
    // `charge.subscription`, a field the Charge object has never had. The read
    // was always undefined, so nothing ever went PAST_DUE in production while
    // this suite passed a subscription id in by hand.
    it("does nothing for an invoice with no subscription parent", async () => {
      const { handleInvoicePaymentFailed } = await import("@/server/services/stripe-webhook.service");
      await handleInvoicePaymentFailed({ parent: null });
      expect(prisma.subscription.findUnique).not.toHaveBeenCalled();
      expect(prisma.subscription.update).not.toHaveBeenCalled();
    });
  });

  describe("handleCheckoutCompleted", () => {
    function mockRetrievedSubscription(overrides: Partial<{ priceId: string; unitAmount: number; currency: string }> = {}) {
      const item = {
        current_period_start: 1711900800,
        current_period_end: 1714579200,
        price: {
          id: overrides.priceId ?? "price_pro_monthly",
          unit_amount: overrides.unitAmount ?? 2900,
          currency: overrides.currency ?? "usd",
        },
      };
      vi.mocked(getStripe).mockReturnValue({
        subscriptions: { retrieve: vi.fn().mockResolvedValue({ id: "sub_new", items: { data: [item] } }) },
      } as any);
    }

    it("throws when the session has no client_reference_id — nothing to map the payment to", async () => {
      const { handleCheckoutCompleted } = await import("@/server/services/stripe-webhook.service");
      await expect(
        handleCheckoutCompleted({ client_reference_id: null, subscription: "sub_new" }),
      ).rejects.toThrow("CHECKOUT_MISSING_WORKSPACE");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("throws when the session has no subscription id", async () => {
      const { handleCheckoutCompleted } = await import("@/server/services/stripe-webhook.service");
      await expect(
        handleCheckoutCompleted({ client_reference_id: "ws1", subscription: null }),
      ).rejects.toThrow("CHECKOUT_MISSING_SUBSCRIPTION");
    });

    it("throws on a Stripe price id that matches none of our configured plans", async () => {
      const { handleCheckoutCompleted } = await import("@/server/services/stripe-webhook.service");
      mockRetrievedSubscription({ priceId: "price_unknown" });
      vi.mocked(resolvePlanFromPriceId).mockReturnValue(null);

      await expect(
        handleCheckoutCompleted({ client_reference_id: "ws1", subscription: "sub_new" }),
      ).rejects.toThrow("CHECKOUT_UNKNOWN_PRICE:price_unknown");
    });

    it("upserts the Subscription AND writes Workspace.plan in the same transaction (entitlement actually flows)", async () => {
      // The sharpest failure mode this feature can ship: writing
      // Subscription.plan but not Workspace.plan, which is what every
      // entitlement gate reads (workspace-settings.service.ts's paid-plan
      // check, team.ts, etc.) — the billing page would say PRO while every
      // feature gate stayed FREE. Assert the Workspace field, not just
      // Subscription.
      const { handleCheckoutCompleted } = await import("@/server/services/stripe-webhook.service");
      mockRetrievedSubscription({ priceId: "price_pro_monthly", unitAmount: 2900, currency: "usd" });
      vi.mocked(resolvePlanFromPriceId).mockReturnValue({ plan: "PRO", interval: "MONTHLY" });

      await handleCheckoutCompleted({ client_reference_id: "ws1", subscription: "sub_new" });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const [subscriptionUpsertArgs] = vi.mocked(prisma.subscription.upsert).mock.calls[0];
      expect(subscriptionUpsertArgs).toMatchObject({
        where: { workspaceId: "ws1" },
        create: expect.objectContaining({
          workspaceId: "ws1",
          stripeSubscriptionId: "sub_new",
          stripePriceId: "price_pro_monthly",
          plan: "PRO",
          status: "ACTIVE",
          interval: "MONTHLY",
          price: 2900,
          currency: "usd",
        }),
      });
      expect(prisma.workspace.update).toHaveBeenCalledWith({
        where: { id: "ws1" },
        data: { plan: "PRO" },
      });
    });

    it("keys the upsert by workspaceId, not stripeSubscriptionId — a double-submitted Checkout updates the same row instead of colliding", async () => {
      const { handleCheckoutCompleted } = await import("@/server/services/stripe-webhook.service");
      mockRetrievedSubscription();
      vi.mocked(resolvePlanFromPriceId).mockReturnValue({ plan: "PRO", interval: "MONTHLY" });

      await handleCheckoutCompleted({ client_reference_id: "ws1", subscription: "sub_new" });

      const [args] = vi.mocked(prisma.subscription.upsert).mock.calls[0];
      expect(args.where).toEqual({ workspaceId: "ws1" });
      expect(args.where).not.toHaveProperty("stripeSubscriptionId");
    });
  });

  describe("handleSubscriptionUpdated", () => {
    it("throws when no Subscription row exists yet (out-of-order delivery — see handleCheckoutCompleted)", async () => {
      const { handleSubscriptionUpdated } = await import("@/server/services/stripe-webhook.service");
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      await expect(
        handleSubscriptionUpdated("sub_123", {
          status: "active",
          cancel_at_period_end: false,
          items: { data: [subItem("price_pro_monthly", 2900)] },
        }),
      ).rejects.toThrow("SUBSCRIPTION_NOT_FOUND");
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("updates status/period AND writes plan + Workspace.plan together (a Portal tier change must move the visible plan, not just priceId)", async () => {
      const { handleSubscriptionUpdated } = await import("@/server/services/stripe-webhook.service");
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: "sub1", workspaceId: "ws1", plan: "PRO", interval: "MONTHLY", price: 2900, stripePriceId: "price_pro_monthly",
      } as any);
      vi.mocked(resolvePlanFromPriceId).mockReturnValue({ plan: "BUSINESS", interval: "MONTHLY" });

      await handleSubscriptionUpdated("sub_123", {
        status: "active",
        cancel_at_period_end: false,
        items: { data: [subItem("price_business_monthly", 7900)] },
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.subscription.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { stripeSubscriptionId: "sub_123" },
        data: expect.objectContaining({ status: "ACTIVE", plan: "BUSINESS", interval: "MONTHLY", price: 7900 }),
      }));
      expect(prisma.workspace.update).toHaveBeenCalledWith({
        where: { id: "ws1" },
        data: { plan: "BUSINESS" },
      });
    });

    it("falls back to the existing plan (no drift) when the price id doesn't resolve to a known plan", async () => {
      const { handleSubscriptionUpdated } = await import("@/server/services/stripe-webhook.service");
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: "sub1", workspaceId: "ws1", plan: "PRO", interval: "MONTHLY", price: 2900, stripePriceId: "price_pro_monthly",
      } as any);
      vi.mocked(resolvePlanFromPriceId).mockReturnValue(null);

      await handleSubscriptionUpdated("sub_123", {
        status: "active",
        cancel_at_period_end: false,
        items: { data: [subItem("price_unrecognized", null)] },
      });

      expect(prisma.workspace.update).toHaveBeenCalledWith({ where: { id: "ws1" }, data: { plan: "PRO" } });
    });
  });

  describe("handleSubscriptionDeleted", () => {
    it("sets subscription to CANCELLED and workspace to FREE", async () => {
      const { handleSubscriptionDeleted } = await import("@/server/services/stripe-webhook.service");
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ id: "sub1", workspaceId: "ws1" } as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue({ id: "sub1", status: "CANCELLED" } as any);
      vi.mocked(prisma.workspace.update).mockResolvedValue({} as any);

      await handleSubscriptionDeleted("sub_123");
      expect(prisma.subscription.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: "CANCELLED" }),
      }));
      expect(prisma.workspace.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ plan: "FREE" }),
      }));
    });
  });

  describe("handleInvoicePaid", () => {
    it("throws when no Subscription row exists yet (out-of-order: invoice.paid delivered before checkout.session.completed)", async () => {
      const { handleInvoicePaid } = await import("@/server/services/stripe-webhook.service");
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);

      await expect(
        handleInvoicePaid({
          id: "in_123",
          ...invoiceParent("sub_123"),
          amount_paid: 2900,
          currency: "usd",
          status: "paid",
          invoice_pdf: "https://stripe.com/pdf",
          period_start: 1711900800,
          period_end: 1714579200,
        }),
      ).rejects.toThrow("SUBSCRIPTION_NOT_FOUND");
      expect(prisma.invoice.upsert).not.toHaveBeenCalled();
    });

    // Regression: the handler read `invoice.subscription`, which Stripe
    // removed. Every real delivery therefore looked up `undefined` and threw,
    // so no Invoice row was ever written and the billing page's invoice
    // history stayed permanently empty. A one-off invoice legitimately has no
    // subscription parent and must be a silent no-op, not a forever-retry.
    it("ignores a one-off invoice that has no subscription parent", async () => {
      const { handleInvoicePaid } = await import("@/server/services/stripe-webhook.service");

      await handleInvoicePaid({
        id: "in_oneoff",
        ...invoiceParent(null),
        amount_paid: 500,
        currency: "usd",
        status: "paid",
        invoice_pdf: null,
        period_start: 1711900800,
        period_end: 1714579200,
      });

      expect(prisma.subscription.findUnique).not.toHaveBeenCalled();
      expect(prisma.invoice.upsert).not.toHaveBeenCalled();
    });

    it("upserts invoice record once the Subscription exists", async () => {
      const { handleInvoicePaid } = await import("@/server/services/stripe-webhook.service");
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ id: "sub1", workspaceId: "ws1" } as any);
      vi.mocked(prisma.invoice.upsert).mockResolvedValue({ id: "inv1" } as any);

      await handleInvoicePaid({
        id: "in_123",
        ...invoiceParent("sub_123"),
        amount_paid: 2900,
        currency: "usd",
        status: "paid",
        invoice_pdf: "https://stripe.com/pdf",
        period_start: 1711900800,
        period_end: 1714579200,
      });
      expect(prisma.invoice.upsert).toHaveBeenCalled();
    });

    it("out-of-order retry converges to one ACTIVE subscription: invoice.paid never touches subscription.status itself", async () => {
      // Full ordering scenario from the design doc's test plan: invoice.paid
      // arrives first and throws (asserted above); once
      // checkout.session.completed has run (asserted in the
      // handleCheckoutCompleted block — status: "ACTIVE" written exactly
      // once, there), Stripe's redelivery of invoice.paid succeeds. This
      // handler only ever upserts Invoice rows — it must never touch
      // Subscription.status, so the ACTIVE write from checkout completion is
      // never clobbered or duplicated.
      const { handleInvoicePaid } = await import("@/server/services/stripe-webhook.service");
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ id: "sub1", workspaceId: "ws1", status: "ACTIVE" } as any);
      vi.mocked(prisma.invoice.upsert).mockResolvedValue({ id: "inv1" } as any);

      await handleInvoicePaid({
        id: "in_123",
        ...invoiceParent("sub_new"),
        amount_paid: 2900,
        currency: "usd",
        status: "paid",
        invoice_pdf: null,
        period_start: 1711900800,
        period_end: 1714579200,
      });

      expect(prisma.subscription.update).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
