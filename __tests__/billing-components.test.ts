import { describe, it, expect } from "vitest";

describe("Billing Components", () => {
  it("exports PLAN_FEATURES for comparison", async () => {
    const mod = await import("@/components/billing/plan-comparison");
    expect(mod.PLAN_FEATURES).toBeDefined();
    expect(mod.PLAN_FEATURES.length).toBeGreaterThanOrEqual(10);
  });

  it("exports CANCEL_REASONS with 6 options", async () => {
    const mod = await import("@/components/billing/cancel-modal");
    expect(mod.CANCEL_REASONS).toHaveLength(6);
  });

  it("exports PlanCard component", async () => {
    const mod = await import("@/components/billing/plan-card");
    expect(mod.PlanCard).toBeDefined();
  });

  it("exports UsageBars component", async () => {
    const mod = await import("@/components/billing/usage-bars");
    expect(mod.UsageBars).toBeDefined();
  });

  it("exports InvoiceTable component", async () => {
    const mod = await import("@/components/billing/invoice-table");
    expect(mod.InvoiceTable).toBeDefined();
  });

  it("exports PaymentMethodCard component", async () => {
    const mod = await import("@/components/billing/payment-method-card");
    expect(mod.PaymentMethodCard).toBeDefined();
  });

  it("exports LimitReached component", async () => {
    const mod = await import("@/components/billing/limit-reached");
    expect(mod.LimitReached).toBeDefined();
  });
});
