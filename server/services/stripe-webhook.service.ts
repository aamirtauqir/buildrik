import { prisma } from "@/lib/prisma";
import { sendPaymentFailedEmail } from "@/server/services/email.service";
import { getStripe, resolvePlanFromPriceId } from "@/server/services/stripe.client";
import { reconcileWorkspaceToFreePlan } from "@/server/services/billing.service";

const STRIPE_STATUS_MAP: Record<string, string> = {
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELLED",
};

/** The subscription back-reference every invoice webhook payload now carries. */
type InvoiceParent = {
  parent?: { subscription_details?: { subscription?: string | null } | null } | null;
};

/**
 * The subscription an invoice belongs to, or null for a one-off invoice.
 *
 * `invoice.subscription` no longer exists — Stripe moved the link to
 * `parent.subscription_details.subscription` (verified against a live payload
 * on API 2026-01-28.clover). Reading the old field returned `undefined` for
 * every real delivery, so `invoice.paid` threw every time and no Invoice row
 * was ever written, while the unit tests — which hand-build a payload with a
 * top-level `subscription` — stayed green. Read the link through this helper
 * so the next shape change has one place to fix.
 */
function invoiceSubscriptionId(invoice: InvoiceParent): string | null {
  return invoice.parent?.subscription_details?.subscription ?? null;
}

/**
 * Dunning entry point, driven by `invoice.payment_failed`.
 *
 * It used to hang off `charge.failed`, reading `charge.subscription` — a field
 * the Charge object does not have (its only link is `payment_intent`; verified
 * against a live payload). That read was always `undefined`, so the route
 * skipped the call entirely and no failed payment ever reached PAST_DUE, sent
 * a notification, or sent an email. `invoice.payment_failed` is the
 * subscription-level event and carries the subscription reference directly.
 */
export async function handleInvoicePaymentFailed(invoiceData: InvoiceParent): Promise<void> {
  const stripeSubscriptionId = invoiceSubscriptionId(invoiceData);
  if (!stripeSubscriptionId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!subscription) return;

  await prisma.subscription.update({
    where: { stripeSubscriptionId },
    data: { status: "PAST_DUE" },
  });

  const workspace = await prisma.workspace.findFirst({
    where: { id: subscription.workspaceId },
    select: { ownerId: true },
  });

  if (!workspace) return;

  await prisma.notification.create({
    data: {
      userId: workspace.ownerId,
      type: "PAYMENT_FAILED",
      message: "Your payment failed. Please update your payment method to avoid service interruption.",
    },
  });

  const owner = await prisma.user.findUnique({
    where: { id: workspace.ownerId },
    select: { email: true },
  });
  if (owner?.email) {
    sendPaymentFailedEmail(owner.email).catch(() => {});
  }
}

export async function handleCheckoutCompleted(session: {
  client_reference_id: string | null;
  subscription: string | null;
}): Promise<void> {
  const workspaceId = session.client_reference_id;
  if (!workspaceId) {
    throw new Error("CHECKOUT_MISSING_WORKSPACE");
  }
  if (!session.subscription) {
    throw new Error("CHECKOUT_MISSING_SUBSCRIPTION");
  }

  // checkout.session.completed carries no price/period data of its own —
  // retrieve the full subscription for what the non-nullable Subscription
  // columns require.
  const subscription = await getStripe().subscriptions.retrieve(session.subscription);
  const item = subscription.items.data[0];
  if (!item) {
    throw new Error("CHECKOUT_SUBSCRIPTION_NO_ITEMS");
  }

  const resolved = resolvePlanFromPriceId(item.price.id);
  if (!resolved) {
    throw new Error(`CHECKOUT_UNKNOWN_PRICE:${item.price.id}`);
  }

  const subscriptionData = {
    stripeSubscriptionId: subscription.id,
    stripeCurrentPeriodStart: new Date(item.current_period_start * 1000),
    stripeCurrentPeriodEnd: new Date(item.current_period_end * 1000),
    stripePriceId: item.price.id,
    plan: resolved.plan,
    status: "ACTIVE",
    interval: resolved.interval,
    price: item.price.unit_amount ?? 0,
    currency: item.price.currency,
  };

  // Subscription.workspaceId is @unique, so this upserts keyed on the
  // workspace rather than the Stripe subscription id: a double-submitted
  // Checkout (two tabs, both completed) updates the same row instead of
  // colliding on a second insert. Workspace.plan is written in the same
  // transaction — every entitlement gate reads that field, not Subscription.
  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { workspaceId },
      create: { workspaceId, ...subscriptionData },
      update: { ...subscriptionData, cancelAtPeriodEnd: false },
    }),
    prisma.workspace.update({
      where: { id: workspaceId },
      data: { plan: resolved.plan },
    }),
  ]);
}

export async function handleSubscriptionUpdated(
  stripeSubscriptionId: string,
  data: {
    status: string;
    cancel_at_period_end: boolean;
    // The billing period lives on the subscription *item*, not the
    // subscription — `subscription.current_period_start` / `_end` were removed
    // (verified against a live payload on API 2026-01-28.clover). Reading them
    // off `data` produced `new Date(NaN)`, which Prisma rejects, so every
    // Portal tier change and every renewal threw instead of landing.
    items: {
      data: Array<{
        price: { id: string; unit_amount: number | null };
        current_period_start: number;
        current_period_end: number;
      }>;
    };
  },
): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!subscription) {
    // Out-of-order delivery: a Portal-driven change (or Stripe's own retry)
    // reached us before checkout.session.completed created the row. This
    // payload carries no client_reference_id / plan, so there is no key to
    // create the row from — throw so route.ts releases the idempotency claim
    // and returns 500, and Stripe redelivers (its own backoff) until the
    // creation webhook has run.
    throw new Error("SUBSCRIPTION_NOT_FOUND");
  }

  const status = STRIPE_STATUS_MAP[data.status] ?? data.status.toUpperCase();
  const item = data.items.data[0];
  const price = item?.price;
  const priceId = price?.id ?? subscription.stripePriceId;
  const resolved = resolvePlanFromPriceId(priceId);

  // Keep the stored period when the payload carries no item to read it from,
  // rather than writing an Invalid Date over a good one.
  const periodStart = item
    ? new Date(item.current_period_start * 1000)
    : subscription.stripeCurrentPeriodStart;
  const periodEnd = item
    ? new Date(item.current_period_end * 1000)
    : subscription.stripeCurrentPeriodEnd;

  // Workspace.plan is written in the same transaction as Subscription.plan —
  // a Portal tier change used to update period/status/priceId but never the
  // plan itself, so the billing page would show the new tier while every
  // entitlement gate (which reads Workspace.plan) stayed on the old one.
  await prisma.$transaction([
    prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        status,
        stripeCurrentPeriodStart: periodStart,
        stripeCurrentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: data.cancel_at_period_end,
        // A reactivate done in Stripe's own Portal comes back through here as
        // cancel_at_period_end: false. cancelReason/cancelFeedback are local-only
        // columns Stripe knows nothing about, so without this they survive as a
        // stale reason attached to a subscription that is no longer cancelling.
        ...(data.cancel_at_period_end ? {} : { cancelReason: null, cancelFeedback: null }),
        stripePriceId: priceId,
        plan: resolved?.plan ?? subscription.plan,
        interval: resolved?.interval ?? subscription.interval,
        price: price?.unit_amount ?? subscription.price,
      },
    }),
    prisma.workspace.update({
      where: { id: subscription.workspaceId },
      data: { plan: resolved?.plan ?? subscription.plan },
    }),
  ]);
}

export async function handleSubscriptionDeleted(stripeSubscriptionId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!subscription) return;

  // One transaction, matching the other two handlers. These were two separate
  // writes, so a failure between them left the subscription CANCELLED while the
  // workspace kept its paid plan.
  await prisma.$transaction([
    prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: { status: "CANCELLED" },
    }),
    prisma.workspace.update({
      where: { id: subscription.workspaceId },
      data: { plan: "FREE" },
    }),
  ]);

  // Drop over-cap published sites, the way the billing-downgrade cron does.
  // Until 2026-07-31 nothing reached this handler, because cancelSubscription
  // never told Stripe anything and Stripe therefore never emitted
  // customer.subscription.deleted. Now that real cancellations land here, a
  // Business workspace hitting period end would otherwise drop to FREE with all
  // of its published sites still live.
  await reconcileWorkspaceToFreePlan(subscription.workspaceId);
}

export async function handleInvoicePaid(
  invoiceData: {
    id: string;
    amount_paid: number;
    currency: string;
    status: string;
    invoice_pdf: string | null;
    period_start: number;
    period_end: number;
  } & InvoiceParent,
): Promise<void> {
  const stripeSubscriptionId = invoiceSubscriptionId(invoiceData);
  // A one-off invoice has no subscription parent — there is no plan period to
  // record against, and throwing would make Stripe redeliver it forever.
  if (!stripeSubscriptionId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!subscription) {
    // Out-of-order delivery — see handleSubscriptionUpdated above. This
    // payload also carries no client_reference_id / plan, so there's nothing
    // to create from; throw so Stripe redelivers after
    // checkout.session.completed has run.
    throw new Error("SUBSCRIPTION_NOT_FOUND");
  }

  await prisma.invoice.upsert({
    where: { stripeInvoiceId: invoiceData.id },
    create: {
      workspaceId: subscription.workspaceId,
      stripeInvoiceId: invoiceData.id,
      amount: invoiceData.amount_paid,
      currency: invoiceData.currency,
      status: invoiceData.status.toUpperCase(),
      pdfUrl: invoiceData.invoice_pdf,
      periodStart: new Date(invoiceData.period_start * 1000),
      periodEnd: new Date(invoiceData.period_end * 1000),
      paidAt: new Date(),
    },
    update: {
      status: invoiceData.status.toUpperCase(),
      pdfUrl: invoiceData.invoice_pdf,
      paidAt: new Date(),
    },
  });
}
