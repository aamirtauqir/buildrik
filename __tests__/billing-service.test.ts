import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
    paymentMethod: { findUnique: vi.fn(), upsert: vi.fn() },
    invoice: { findMany: vi.fn(), count: vi.fn() },
    site: { count: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
    workspaceMember: { count: vi.fn(), findFirst: vi.fn() },
    domain: { count: vi.fn() },
    aIGenerationJob: { count: vi.fn() },
    formSubmission: { count: vi.fn() },
    redirect: { count: vi.fn() },
    mediaAsset: { aggregate: vi.fn() },
    workspace: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
}));

vi.mock("@/server/services/stripe.client", () => ({
  getStripe: vi.fn(),
  isStripeConfigured: vi.fn(),
  getStripePriceId: vi.fn(),
  resolvePlanFromPriceId: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured, getStripePriceId } from "@/server/services/stripe.client";

describe("Billing Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Storage usage path (added with real-storage fix): workspace site-ids
    // + media bytes aggregate. Default empty so existing assertions hold.
    vi.mocked(prisma.site.findMany).mockResolvedValue([] as never);
    vi.mocked(prisma.mediaAsset.aggregate).mockResolvedValue({ _sum: { bytes: 0 } } as never);
  });

  describe("getBillingOverview", () => {
    it("returns plan, usage, and payment method", async () => {
      const { getBillingOverview } = await import(
        "@/server/services/billing.service"
      );
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        plan: "PRO",
        status: "ACTIVE",
        interval: "MONTHLY",
        price: 2900,
        currency: "usd",
        cancelAtPeriodEnd: false,
        isGrandfathered: false,
        stripeCurrentPeriodEnd: new Date("2026-04-24"),
        paymentMethod: {
          brand: "visa",
          last4: "4242",
          expMonth: 12,
          expYear: 2028,
        },
      } as any);
      vi.mocked(prisma.site.count).mockResolvedValue(8);
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(3);
      vi.mocked(prisma.domain.count).mockResolvedValue(1);
      vi.mocked(prisma.aIGenerationJob.count).mockResolvedValue(5);
      vi.mocked(prisma.formSubmission.count).mockResolvedValue(120);
      vi.mocked(prisma.redirect.count).mockResolvedValue(15);

      const result = await getBillingOverview("ws1");
      expect(result.plan).toBe("PRO");
      expect(result.usage.sites.used).toBe(8);
      expect(result.usage.sites.limit).toBe(15);
      expect(result.paymentMethod?.last4).toBe("4242");
    });

    it("returns FREE plan defaults when no subscription", async () => {
      const { getBillingOverview } = await import(
        "@/server/services/billing.service"
      );
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.site.count).mockResolvedValue(1);
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(1);
      vi.mocked(prisma.domain.count).mockResolvedValue(0);
      vi.mocked(prisma.aIGenerationJob.count).mockResolvedValue(0);
      vi.mocked(prisma.formSubmission.count).mockResolvedValue(0);
      vi.mocked(prisma.redirect.count).mockResolvedValue(0);

      const result = await getBillingOverview("ws1");
      expect(result.plan).toBe("FREE");
      expect(result.usage.sites.limit).toBe(3);
      expect(result.paymentMethod).toBeNull();
    });
  });

  describe("getUsageDetails", () => {
    it("returns detailed usage with percentages", async () => {
      const { getUsageDetails } = await import(
        "@/server/services/billing.service"
      );
      vi.mocked(prisma.site.count).mockResolvedValue(2);
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(1);
      vi.mocked(prisma.domain.count).mockResolvedValue(0);
      vi.mocked(prisma.aIGenerationJob.count).mockResolvedValue(1);
      vi.mocked(prisma.formSubmission.count).mockResolvedValue(50);
      vi.mocked(prisma.redirect.count).mockResolvedValue(10);

      const result = await getUsageDetails("ws1", "FREE");
      expect(result.sites.used).toBe(2);
      expect(result.sites.percentage).toBe(67);
    });
  });

  describe("listInvoices", () => {
    it("returns paginated invoices", async () => {
      const { listInvoices } = await import(
        "@/server/services/billing.service"
      );
      vi.mocked(prisma.invoice.count).mockResolvedValue(5);
      vi.mocked(prisma.invoice.findMany).mockResolvedValue([
        {
          id: "inv1",
          amount: 2900,
          currency: "usd",
          status: "PAID",
          pdfUrl: null,
          periodStart: new Date(),
          periodEnd: new Date(),
          paidAt: new Date(),
          createdAt: new Date(),
        },
      ] as any);
      const result = await listInvoices("ws1", 1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(5);
    });
  });

  describe("createCheckoutSession", () => {
    it("refuses when Stripe is not configured (no free upgrades)", async () => {
      const { createCheckoutSession } = await import(
        "@/server/services/billing.service"
      );
      vi.mocked(isStripeConfigured).mockReturnValue(false);
      await expect(
        createCheckoutSession("ws1", { planId: "PRO", interval: "MONTHLY" }),
      ).rejects.toThrow("PAYMENTS_NOT_CONFIGURED");
      expect(prisma.subscription.create).not.toHaveBeenCalled();
      expect(prisma.workspace.update).not.toHaveBeenCalled();
    });

    it("self-grant regression: never writes Subscription or Workspace.plan itself, even when Stripe is configured and the session succeeds", async () => {
      // Regression guard for the audit's sharpest billing finding: the old
      // upgradePlan() gate keyed off STRIPE_SECRET_KEY *presence*, so a key in
      // prod let any authenticated user write a placeholder subscription and
      // flip their plan to PRO for free by calling billing.upgrade directly.
      // This function only ever returns a Checkout URL — Subscription.plan
      // and Workspace.plan are written nowhere here, only by the verified
      // webhook (handleCheckoutCompleted in stripe-webhook.service.ts).
      const { createCheckoutSession } = await import(
        "@/server/services/billing.service"
      );
      vi.mocked(isStripeConfigured).mockReturnValue(true);
      vi.mocked(getStripePriceId).mockReturnValue("price_pro_monthly");
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.workspace.findUniqueOrThrow).mockResolvedValue({
        stripeCustomerId: "cus_123",
        ownerId: "u1",
        name: "Acme",
      } as any);
      const createSession = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/pay/xyz" });
      vi.mocked(getStripe).mockReturnValue({
        checkout: { sessions: { create: createSession } },
      } as any);

      const result = await createCheckoutSession("ws1", { planId: "PRO", interval: "MONTHLY" });

      expect(result.url).toBe("https://checkout.stripe.com/pay/xyz");
      expect(createSession).toHaveBeenCalledWith(
        expect.objectContaining({ mode: "subscription", client_reference_id: "ws1" }),
      );
      expect(prisma.subscription.create).not.toHaveBeenCalled();
      expect(prisma.subscription.update).not.toHaveBeenCalled();
      expect(prisma.workspace.update).not.toHaveBeenCalled();
    });

    it("creates a Stripe customer on first use without ever touching Workspace.plan", async () => {
      const { createCheckoutSession } = await import(
        "@/server/services/billing.service"
      );
      vi.mocked(isStripeConfigured).mockReturnValue(true);
      vi.mocked(getStripePriceId).mockReturnValue("price_pro_monthly");
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.workspace.findUniqueOrThrow).mockResolvedValue({
        stripeCustomerId: null,
        ownerId: "u1",
        name: "Acme",
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ email: "owner@acme.com" } as any);
      vi.mocked(prisma.workspace.update).mockResolvedValue({} as any);
      const createCustomer = vi.fn().mockResolvedValue({ id: "cus_new" });
      const createSession = vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/pay/new" });
      vi.mocked(getStripe).mockReturnValue({
        customers: { create: createCustomer },
        checkout: { sessions: { create: createSession } },
      } as any);

      const result = await createCheckoutSession("ws1", { planId: "PRO", interval: "MONTHLY" });

      expect(result.url).toBe("https://checkout.stripe.com/pay/new");
      // The only workspace write here is the billing-identity mapping — no
      // `plan` field anywhere in it. Stripe customer ids carry no entitlement.
      expect(prisma.workspace.update).toHaveBeenCalledWith({
        where: { id: "ws1" },
        data: { stripeCustomerId: "cus_new" },
      });
      expect(prisma.subscription.create).not.toHaveBeenCalled();
    });

    it("refuses a second Checkout session for an already-subscribed workspace (routes tier changes to the Portal instead)", async () => {
      const { createCheckoutSession } = await import(
        "@/server/services/billing.service"
      );
      vi.mocked(isStripeConfigured).mockReturnValue(true);
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ status: "ACTIVE" } as any);

      await expect(
        createCheckoutSession("ws1", { planId: "BUSINESS", interval: "MONTHLY" }),
      ).rejects.toThrow("ALREADY_SUBSCRIBED");
      expect(prisma.workspace.update).not.toHaveBeenCalled();
    });
  });

  describe("createPortalSession", () => {
    it("refuses when Stripe is not configured", async () => {
      const { createPortalSession } = await import(
        "@/server/services/billing.service"
      );
      vi.mocked(isStripeConfigured).mockReturnValue(false);
      await expect(createPortalSession("ws1")).rejects.toThrow("PAYMENTS_NOT_CONFIGURED");
    });

    it("refuses when the workspace has no Stripe customer yet", async () => {
      const { createPortalSession } = await import(
        "@/server/services/billing.service"
      );
      vi.mocked(isStripeConfigured).mockReturnValue(true);
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ stripeCustomerId: null } as any);
      await expect(createPortalSession("ws1")).rejects.toThrow("NO_STRIPE_CUSTOMER");
    });

    it("returns the Portal session URL", async () => {
      const { createPortalSession } = await import(
        "@/server/services/billing.service"
      );
      vi.mocked(isStripeConfigured).mockReturnValue(true);
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({ stripeCustomerId: "cus_123" } as any);
      vi.mocked(getStripe).mockReturnValue({
        billingPortal: { sessions: { create: vi.fn().mockResolvedValue({ url: "https://billing.stripe.com/session/abc" }) } },
      } as any);

      const result = await createPortalSession("ws1");
      expect(result.url).toBe("https://billing.stripe.com/session/abc");
    });
  });

  describe("reconcileWorkspaceToFreePlan", () => {
    it("unpublishes published sites beyond the FREE cap, keeping the newest, deleting nothing", async () => {
      const { reconcileWorkspaceToFreePlan } = await import("@/server/services/billing.service");
      // FREE cap is 3 — return 5 published sites (newest first).
      vi.mocked(prisma.site.findMany).mockResolvedValue([
        { id: "s1" }, { id: "s2" }, { id: "s3" }, { id: "s4" }, { id: "s5" },
      ] as any);
      vi.mocked(prisma.site.updateMany).mockResolvedValue({ count: 2 } as any);

      const n = await reconcileWorkspaceToFreePlan("ws1");
      expect(n).toBe(2);
      // only the 2 oldest get unpublished; status→DRAFT, url cleared; no delete
      expect(prisma.site.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ["s4", "s5"] } },
        data: { status: "DRAFT", publishedUrl: null },
      });
    });

    it("is a no-op when within the FREE cap", async () => {
      const { reconcileWorkspaceToFreePlan } = await import("@/server/services/billing.service");
      vi.mocked(prisma.site.findMany).mockResolvedValue([{ id: "s1" }, { id: "s2" }] as any);
      const n = await reconcileWorkspaceToFreePlan("ws1");
      expect(n).toBe(0);
      expect(prisma.site.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("cancelSubscription", () => {
    it("sets cancelAtPeriodEnd to true", async () => {
      const { cancelSubscription } = await import(
        "@/server/services/billing.service"
      );
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: "sub1",
        plan: "PRO",
        cancelAtPeriodEnd: false,
      } as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue({
        id: "sub1",
        cancelAtPeriodEnd: true,
      } as any);
      const result = await cancelSubscription("ws1", {
        reason: "TOO_EXPENSIVE",
      });
      expect(result.cancelAtPeriodEnd).toBe(true);
    });

    it("throws if already cancelled", async () => {
      const { cancelSubscription } = await import(
        "@/server/services/billing.service"
      );
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: "sub1",
        cancelAtPeriodEnd: true,
      } as any);
      await expect(
        cancelSubscription("ws1", { reason: "NOT_USING" }),
      ).rejects.toThrow("ALREADY_CANCELLED");
    });
  });

  describe("reactivateSubscription", () => {
    it("sets cancelAtPeriodEnd to false", async () => {
      const { reactivateSubscription } = await import(
        "@/server/services/billing.service"
      );
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: "sub1",
        cancelAtPeriodEnd: true,
      } as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue({
        id: "sub1",
        cancelAtPeriodEnd: false,
      } as any);
      const result = await reactivateSubscription("ws1");
      expect(result.cancelAtPeriodEnd).toBe(false);
    });
  });
});
