import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
    paymentMethod: { findUnique: vi.fn(), upsert: vi.fn() },
    invoice: { findMany: vi.fn(), count: vi.fn() },
    site: { count: vi.fn() },
    workspaceMember: { count: vi.fn(), findFirst: vi.fn() },
    domain: { count: vi.fn() },
    aIGenerationJob: { count: vi.fn() },
    formSubmission: { count: vi.fn() },
    redirect: { count: vi.fn() },
    workspace: { findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
}));

import { prisma } from "@/lib/prisma";

describe("Billing Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  describe("upgradePlan", () => {
    it("refuses when Stripe is not configured (no free upgrades)", async () => {
      const { upgradePlan } = await import(
        "@/server/services/billing.service"
      );
      vi.stubEnv("STRIPE_SECRET_KEY", "");
      await expect(
        upgradePlan("ws1", { planId: "PRO", interval: "MONTHLY" }),
      ).rejects.toThrow("PAYMENTS_NOT_CONFIGURED");
      expect(prisma.subscription.create).not.toHaveBeenCalled();
      vi.unstubAllEnvs();
    });

    it("refuses to self-grant even when STRIPE_SECRET_KEY is set (no placeholder write)", async () => {
      // Regression guard for the audit's sharpest billing finding: the old
      // gate keyed off key *presence*, so a key in prod let any user write a
      // placeholder subscription and flip their plan to PRO for free. The
      // procedure has no payment proof, so it must never grant — real
      // upgrades arrive via the Stripe webhook only.
      const { upgradePlan } = await import(
        "@/server/services/billing.service"
      );
      vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_stub");
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
      await expect(
        upgradePlan("ws1", { planId: "PRO", interval: "MONTHLY" }),
      ).rejects.toThrow("PAYMENTS_NOT_CONFIGURED");
      expect(prisma.subscription.create).not.toHaveBeenCalled();
      expect(prisma.workspace.update).not.toHaveBeenCalled();
      vi.unstubAllEnvs();
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
