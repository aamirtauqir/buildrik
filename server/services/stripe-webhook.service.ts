import { prisma } from "@/lib/prisma";
import { sendPaymentFailedEmail } from "@/server/services/email.service";

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

export async function handleSubscriptionUpdated(
  stripeSubscriptionId: string,
  data: {
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    items: { data: Array<{ price: { id: string } }> };
  },
): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (!subscription) return;

  const status = STRIPE_STATUS_MAP[data.status] ?? data.status.toUpperCase();
  const priceId = data.items.data[0]?.price.id ?? subscription.stripePriceId;

  await prisma.subscription.update({
    where: { stripeSubscriptionId },
    data: {
      status,
      stripeCurrentPeriodStart: new Date(data.current_period_start * 1000),
      stripeCurrentPeriodEnd: new Date(data.current_period_end * 1000),
      cancelAtPeriodEnd: data.cancel_at_period_end,
      stripePriceId: priceId,
    },
  });
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

  if (!subscription) return;

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
