/**
 * What a Stripe failure sounds like to the customer.
 *
 * Five mutations in this router move money. `translateBillingError` was written
 * so cancel and reactivate "cannot drift apart" — and then checkout and portal
 * were never wired to it. Each kept its own inline catch that handled a few
 * known strings and ended in a bare `throw e`, so anything Stripe itself raised
 * went out verbatim: a workspace whose stripeCustomerId no longer exists made
 * the billing page toast
 *
 *     Couldn't open billing portal — No such customer: 'cus_audit_seed'
 *
 * That names an internal identifier, tells the customer nothing they can act
 * on, and arrives as a 500 — which tRPC's own retry list treats as retryable.
 *
 * These assert the property that matters: whatever Stripe says, the customer is
 * told something readable, and the raw message never reaches them.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

const createCheckoutSessionMock = vi.fn();
const createPortalSessionMock = vi.fn();
const cancelSubscriptionMock = vi.fn();
const reactivateSubscriptionMock = vi.fn();

vi.mock("@/server/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/server/services/api-token.service", () => ({
  extractBearer: () => null,
  verifyApiToken: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: () => undefined, delete: vi.fn() }),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/server/trpc/workspace-ctx", () => ({
  resolveWorkspaceId: vi.fn().mockResolvedValue("ws_1"),
}));
vi.mock("@/server/services/permission.service", () => ({
  checkWorkspaceRole: vi.fn(),
  PermissionError: class PermissionError extends Error {
    code: string;
    constructor(code: string, msg?: string) { super(msg ?? code); this.code = code; }
  },
}));
vi.mock("@/server/services/billing.service", () => ({
  getBillingOverview: vi.fn(), getUsageDetails: vi.fn(), listInvoices: vi.fn(), getPlans: vi.fn(),
  createCheckoutSession: (...a: unknown[]) => createCheckoutSessionMock(...a),
  createPortalSession: (...a: unknown[]) => createPortalSessionMock(...a),
  cancelSubscription: (...a: unknown[]) => cancelSubscriptionMock(...a),
  reactivateSubscription: (...a: unknown[]) => reactivateSubscriptionMock(...a),
}));
vi.mock("@buildrik/shared/schemas/billing", () => {
  const any = z.any();
  return { upgradeSchema: any, cancelSchema: any };
});

import { billingRouter } from "@/server/trpc/routers/billing";

const ctx = () => ({ session: { user: { id: "u_1", workspaceId: "ws_1" } }, prisma: {} as never });
const caller = () => billingRouter.createCaller(ctx() as never);

/** Every money mutation, and how to fire it. */
const MUTATIONS: Array<[string, ReturnType<typeof vi.fn>, () => Promise<unknown>]> = [
  ["createCheckoutSession", createCheckoutSessionMock, () => caller().createCheckoutSession({ planId: "PRO", interval: "MONTHLY" } as never)],
  ["createPortalSession", createPortalSessionMock, () => caller().createPortalSession()],
  ["cancel", cancelSubscriptionMock, () => caller().cancel({ reason: "x" } as never)],
  ["reactivate", reactivateSubscriptionMock, () => caller().reactivate()],
];

beforeEach(() => {
  for (const [, m] of MUTATIONS) m.mockReset();
});

// The exact shape of the incident: Stripe's own prose about an id we hold.
const STRIPE_PROSE = "No such customer: 'cus_audit_seed'";

describe("a raw Stripe error never reaches the customer", () => {
  for (const [name, mock, fire] of MUTATIONS) {
    it(`${name} replaces Stripe's own message`, async () => {
      mock.mockRejectedValue(new Error(STRIPE_PROSE));
      await expect(fire()).rejects.toSatisfy((e: { message: string }) => {
        expect(e.message).not.toContain("cus_audit_seed");
        expect(e.message).not.toContain("No such customer");
        expect(e.message).toMatch(/Stripe/);
        expect(e.message).toMatch(/nothing was changed/);
        return true;
      });
    });
  }
});

describe("the errors we do recognise keep their own words", () => {
  const CASES: Array<[string, RegExp]> = [
    ["PAYMENTS_NOT_CONFIGURED", /not available yet/i],
    ["NO_SUBSCRIPTION", /no active subscription/i],
    ["NO_STRIPE_CUSTOMER", /no billing account yet/i],
    ["GRANDFATHERED_NO_PORTAL", /set up outside Stripe/i],
    ["ALREADY_SUBSCRIBED", /already have a subscription/i],
    ["STRIPE_PRICE_NOT_CONFIGURED:STRIPE_PRICE_PRO_MONTHLY", /isn't available for checkout yet/i],
  ];

  for (const [thrown, expected] of CASES) {
    it(`${thrown} survives translation on every mutation that can raise it`, async () => {
      for (const [, mock, fire] of MUTATIONS) {
        mock.mockReset();
        mock.mockRejectedValue(new Error(thrown));
        await expect(fire()).rejects.toSatisfy((e: { message: string }) => expected.test(e.message));
      }
    });
  }
});
