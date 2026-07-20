#!/usr/bin/env npx tsx
/**
 * Provision the Stripe objects the billing path needs: two Products, four
 * Prices, and one webhook endpoint subscribed to the five events the handlers
 * actually implement.
 *
 * The live secret key is read from the environment and never stored — pass it
 * on the command line so it stays out of the repo, out of shell history that
 * gets shared, and out of any transcript.
 *
 *   # test mode (uses .env.local)
 *   npx tsx scripts/stripe-setup.ts --url https://app.buildrick.io
 *
 *   # live mode — deliberate, requires --yes
 *   STRIPE_SECRET_KEY=sk_live_... npx tsx scripts/stripe-setup.ts \
 *     --url https://app.buildrick.io --yes
 *
 * Idempotent: an existing Product (matched by name) or Price (matched by
 * product + interval + amount + currency) is reused, never duplicated. Stripe
 * Prices are immutable, so a price that exists at a *different* amount is
 * reported as drift rather than silently adopted — adopting it would bill
 * customers an amount PLAN_LIMITS does not agree with.
 *
 * Pricing comes from lib/constants/plan-limits.ts. That file is the SSOT for
 * what a plan costs; this script must never restate the numbers.
 */

import Stripe from "stripe";
import { PLAN_LIMITS } from "@/lib/constants/plan-limits";

const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
] as const;

type PaidPlan = "PRO" | "BUSINESS";

const PLANS: Array<{ plan: PaidPlan; product: string; description: string }> = [
  { plan: "PRO", product: "Buildrick Pro", description: "Buildrick Pro subscription" },
  { plan: "BUSINESS", product: "Buildrick Business", description: "Buildrick Business subscription" },
];

/**
 * PLAN_LIMITS stores both figures as a *per-month* dollar amount — priceYearly
 * is "what a month costs when you pay for the year", not the yearly total. The
 * Stripe yearly Price is therefore twelve of those, in cents.
 */
function amountsFor(plan: PaidPlan): { MONTHLY: number; YEARLY: number } {
  const monthly = Number(PLAN_LIMITS[plan].priceMonthly);
  const yearlyPerMonth = Number(PLAN_LIMITS[plan].priceYearly);
  return { MONTHLY: monthly * 100, YEARLY: yearlyPerMonth * 12 * 100 };
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function findOrCreateProduct(stripe: Stripe, name: string, description: string) {
  const existing = await stripe.products.list({ limit: 100, active: true });
  const match = existing.data.find((p) => p.name === name);
  if (match) {
    console.log(`  product  ${name} — reusing ${match.id}`);
    return match;
  }
  const created = await stripe.products.create({ name, description });
  console.log(`  product  ${name} — created ${created.id}`);
  return created;
}

async function findOrCreatePrice(
  stripe: Stripe,
  productId: string,
  interval: "MONTHLY" | "YEARLY",
  unitAmount: number,
): Promise<Stripe.Price> {
  const recurring = interval === "MONTHLY" ? "month" : "year";
  const existing = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const sameCadence = existing.data.filter(
    (p) => p.recurring?.interval === recurring && p.currency === "usd",
  );

  const exact = sameCadence.find((p) => p.unit_amount === unitAmount);
  if (exact) {
    console.log(`  price    ${interval} $${unitAmount / 100} — reusing ${exact.id}`);
    return exact;
  }

  if (sameCadence.length > 0) {
    const found = sameCadence.map((p) => `${p.id} ($${(p.unit_amount ?? 0) / 100})`).join(", ");
    throw new Error(
      `PRICE_DRIFT: ${interval} price(s) already exist at a different amount [${found}], ` +
        `but PLAN_LIMITS says $${unitAmount / 100}. Stripe prices are immutable — archive the ` +
        `stale one in the dashboard, or fix PLAN_LIMITS. Refusing to guess which is right.`,
    );
  }

  const created = await stripe.prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency: "usd",
    recurring: { interval: recurring },
  });
  console.log(`  price    ${interval} $${unitAmount / 100} — created ${created.id}`);
  return created;
}

/**
 * Returns the signing secret only when the endpoint is created — Stripe
 * discloses it once. An endpoint that already exists gets its event list
 * corrected, but its secret must be read from the Stripe dashboard.
 */
async function syncWebhookEndpoint(stripe: Stripe, url: string): Promise<string | null> {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const match = endpoints.data.find((e) => e.url === url);

  if (!match) {
    const created = await stripe.webhookEndpoints.create({
      url,
      enabled_events: [...WEBHOOK_EVENTS] as Stripe.WebhookEndpointCreateParams.EnabledEvent[],
    });
    console.log(`  webhook  created ${created.id}`);
    return created.secret ?? null;
  }

  const current = [...match.enabled_events].sort();
  const wanted = [...WEBHOOK_EVENTS].sort();
  if (current.join() === wanted.join()) {
    console.log(`  webhook  ${match.id} — already correct`);
    return null;
  }

  const stale = current.filter((e) => !wanted.includes(e as (typeof WEBHOOK_EVENTS)[number]));
  await stripe.webhookEndpoints.update(match.id, {
    enabled_events: [...WEBHOOK_EVENTS] as Stripe.WebhookEndpointUpdateParams.EnabledEvent[],
  });
  console.log(`  webhook  ${match.id} — events corrected${stale.length ? ` (dropped: ${stale.join(", ")})` : ""}`);
  return null;
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");

  const url = arg("url");
  if (!url) throw new Error("Pass the webhook URL: --url https://app.buildrick.io");
  const webhookUrl = `${url.replace(/\/$/, "")}/api/webhooks/stripe`;

  const live = key.startsWith("sk_live_");
  if (live && !process.argv.includes("--yes")) {
    throw new Error("LIVE mode key detected. Re-run with --yes to confirm you mean production.");
  }

  console.log(`\nStripe setup — ${live ? "LIVE" : "TEST"} mode`);
  console.log(`Webhook target: ${webhookUrl}\n`);

  const stripe = new Stripe(key);
  const envLines: string[] = [];

  for (const { plan, product, description } of PLANS) {
    console.log(`${plan}:`);
    const p = await findOrCreateProduct(stripe, product, description);
    const amounts = amountsFor(plan);
    for (const interval of ["MONTHLY", "YEARLY"] as const) {
      const price = await findOrCreatePrice(stripe, p.id, interval, amounts[interval]);
      envLines.push(`STRIPE_PRICE_${plan}_${interval}=${price.id}`);
    }
  }

  console.log(`\nWEBHOOK:`);
  const secret = await syncWebhookEndpoint(stripe, webhookUrl);

  console.log(`\n--- env vars ---`);
  for (const line of envLines) console.log(line);
  if (secret) {
    console.log(`STRIPE_WEBHOOK_SECRET=${secret}`);
  } else {
    console.log(`# STRIPE_WEBHOOK_SECRET — endpoint already existed; copy it from`);
    console.log(`# Stripe Dashboard → Developers → Webhooks → ${webhookUrl} → Signing secret`);
  }
  console.log(`STRIPE_SECRET_KEY=<the key you ran this with>`);
  console.log();
}

main().catch((e) => {
  console.error(`\nFAILED: ${e instanceof Error ? e.message : e}\n`);
  process.exit(1);
});
