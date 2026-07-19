import { prisma } from "@/lib/prisma";
import { sendPaymentFailedEmail } from "@/server/services/email.service";
import { getStripe, resolvePlanFromPriceId } from "@/server/services/stripe.client";

const STRIPE_STATUS_MAP: Record<string, string> = {
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELLED",
};

export async function handleChargeFailed(stripeSubscriptionId: string): Promise<void> {
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
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    items: { data: Array<{ price: { id: string; unit_amount: number | null } }> };
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
  const price = data.items.data[0]?.price;
  const priceId = price?.id ?? subscription.stripePriceId;
  const resolved = resolvePlanFromPriceId(priceId);

  // Workspace.plan is written in the same transaction as Subscription.plan —
  // a Portal tier change used to update period/status/priceId but never the
  // plan itself, so the billing page would show the new tier while every
  // entitlement gate (which reads Workspace.plan) stayed on the old one.
  await prisma.$transaction([
    prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        status,
        stripeCurrentPeriodStart: new Date(data.current_period_start * 1000),
        stripeCurrentPeriodEnd: new Date(data.current_period_end * 1000),
        cancelAtPeriodEnd: data.cancel_at_period_end,
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

  await prisma.subscription.update({
    where: { stripeSubscriptionId },
    data: { status: "CANCELLED" },
  });

  await prisma.workspace.update({
    where: { id: subscription.workspaceId },
    data: { plan: "FREE" },
  });
}

export async function handleInvoicePaid(invoiceData: {
  id: string;
  subscription: string;
  amount_paid: number;
  currency: string;
  status: string;
  invoice_pdf: string | null;
  period_start: number;
  period_end: number;
}): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoiceData.subscription },
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
