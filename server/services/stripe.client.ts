import Stripe from "stripe";
import type { PlanName } from "@/lib/constants/plan-limits";

/**
 * The one Stripe client. Lazy-init per repo rule — module-level construction
 * would throw at import time in every environment without STRIPE_SECRET_KEY
 * (every environment until the founder finishes setup), taking down unrelated
 * routes that merely import a sibling of this module.
 */
let _client: Stripe | undefined;
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("PAYMENTS_NOT_CONFIGURED");
  if (!_client) _client = new Stripe(key);
  return _client;
}

export function isStripeConfigured(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? "").length > 0;
}

export type PaidPlan = Extract<PlanName, "PRO" | "BUSINESS">;
export type BillingInterval = "MONTHLY" | "YEARLY";

const PRICE_ENV_KEYS: Record<PaidPlan, Record<BillingInterval, string>> = {
  PRO: { MONTHLY: "STRIPE_PRICE_PRO_MONTHLY", YEARLY: "STRIPE_PRICE_PRO_YEARLY" },
  BUSINESS: { MONTHLY: "STRIPE_PRICE_BUSINESS_MONTHLY", YEARLY: "STRIPE_PRICE_BUSINESS_YEARLY" },
};

/**
 * Stripe Price id for a plan × interval. Throws rather than falling back to a
 * guessed id — the founder creates these in the Stripe dashboard (see
 * CLAUDE.md's Payments env table); an unconfigured price must fail loudly,
 * not silently checkout against the wrong product.
 */
export function getStripePriceId(plan: PaidPlan, interval: BillingInterval): string {
  const envKey = PRICE_ENV_KEYS[plan][interval];
  const priceId = process.env[envKey];
  if (!priceId) throw new Error(`STRIPE_PRICE_NOT_CONFIGURED:${envKey}`);
  return priceId;
}

/**
 * Reverse lookup: a Stripe Price id back to our plan + interval, so webhook
 * handlers can tell which plan a subscription's price maps to. Returns null
 * for a price id that matches none of our configured plans (stale price,
 * manual Dashboard edit) — callers must not guess a plan in that case.
 */
export function resolvePlanFromPriceId(
  priceId: string,
): { plan: PaidPlan; interval: BillingInterval } | null {
  for (const plan of Object.keys(PRICE_ENV_KEYS) as PaidPlan[]) {
    for (const interval of Object.keys(PRICE_ENV_KEYS[plan]) as BillingInterval[]) {
      if (process.env[PRICE_ENV_KEYS[plan][interval]] === priceId) return { plan, interval };
    }
  }
  return null;
}
