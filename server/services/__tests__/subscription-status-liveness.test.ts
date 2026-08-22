/**
 * "Is there a live subscription?" must not be an allow-list of two statuses.
 *
 * The account-deletion guard asked `["ACTIVE", "PAST_DUE"].includes(status)`.
 * Stripe has more than two live states, and `handleSubscriptionUpdated` stores
 * whatever it is told: `STRIPE_STATUS_MAP` names only active / past_due /
 * canceled, and everything else falls through to `data.status.toUpperCase()`.
 * So `incomplete` (a first payment awaiting 3DS — reachable on any SCA card),
 * `unpaid` (dunning exhausted) and `trialing` all store a status the guard does
 * not recognise, and a sole owner could delete their account out from under a
 * subscription that still exists. That guard exists precisely because it was
 * once dead and let someone orphan a workspace and a live subscription.
 *
 * Inverting it — live unless it is finished — means a status nobody anticipated
 * fails safe.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { isSubscriptionLive, TERMINATED_SUBSCRIPTION_STATUSES } from "@/server/services/subscription-status";

describe("isSubscriptionLive", () => {
  it("counts the two the old allow-list knew", () => {
    expect(isSubscriptionLive("ACTIVE")).toBe(true);
    expect(isSubscriptionLive("PAST_DUE")).toBe(true);
  });

  it("counts the Stripe states the allow-list missed", () => {
    for (const s of ["INCOMPLETE", "UNPAID", "TRIALING", "PAUSED", "INCOMPLETE_EXPIRED"]) {
      expect(isSubscriptionLive(s), s).toBe(true);
    }
  });

  it("does not count a finished one", () => {
    for (const s of TERMINATED_SUBSCRIPTION_STATUSES) {
      expect(isSubscriptionLive(s), s).toBe(false);
    }
  });

  it("treats an absent subscription as not live", () => {
    expect(isSubscriptionLive(null)).toBe(false);
    expect(isSubscriptionLive(undefined)).toBe(false);
  });

  it("is case-insensitive, because the status is a free string column", () => {
    expect(isSubscriptionLive("cancelled")).toBe(false);
    expect(isSubscriptionLive("active")).toBe(true);
  });
});
