import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: { findUnique: vi.fn(), update: vi.fn() },
    invoice: { upsert: vi.fn() },
    workspace: { findFirst: vi.fn(), update: vi.fn() },
    notification: { create: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/server/services/email.service", () => ({
  sendPaymentFailedEmail: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/prisma";

describe("Stripe Webhook Service", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("handleChargeFailed", () => {
    it("updates subscription to PAST_DUE and creates notification", async () => {
      const { handleChargeFailed } = await import("@/server/services/stripe-webhook.service");
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
        id: "sub1", workspaceId: "ws1", status: "ACTIVE",
      } as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue({ id: "sub1", status: "PAST_DUE" } as any);
      vi.mocked(prisma.workspace.findFirst).mockResolvedValue({ ownerId: "u1" } as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({} as any);

      await handleChargeFailed("sub_123");
      expect(prisma.subscription.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: "PAST_DUE" }),
      }));
      expect(prisma.notification.create).toHaveBeenCalled();
    });
  });

  describe("handleSubscriptionUpdated", () => {
    it("updates subscription fields from Stripe data", async () => {
      const { handleSubscriptionUpdated } = await import("@/server/services/stripe-webhook.service");
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ id: "sub1" } as any);
      vi.mocked(prisma.subscription.update).mockResolvedValue({ id: "sub1", status: "ACTIVE" } as any);

      await handleSubscriptionUpdated("sub_123", {
        status: "active",
        current_period_start: 1711900800,
        current_period_end: 1714579200,
        cancel_at_period_end: false,
        items: { data: [{ price: { id: "price_pro_monthly" } }] },
      });
      expect(prisma.subscription.update).toHaveBeenCalled();
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
    it("upserts invoice record", async () => {
      const { handleInvoicePaid } = await import("@/server/services/stripe-webhook.service");
      vi.mocked(prisma.subscription.findUnique).mockResolvedValue({ id: "sub1", workspaceId: "ws1" } as any);
      vi.mocked(prisma.invoice.upsert).mockResolvedValue({ id: "inv1" } as any);

      await handleInvoicePaid({
        id: "in_123",
        subscription: "sub_123",
        amount_paid: 2900,
        currency: "usd",
        status: "paid",
        invoice_pdf: "https://stripe.com/pdf",
        period_start: 1711900800,
        period_end: 1714579200,
      });
      expect(prisma.invoice.upsert).toHaveBeenCalled();
    });
  });
});
