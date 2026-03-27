import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { UpgradeInput, CancelInput } from "@/lib/validations/billing";
import { getStripe, STRIPE_PRICE_IDS } from "@/lib/stripe";

const PRICE_MAP: Record<string, number> = {
  PRO_MONTHLY: 2900,
  PRO_YEARLY: 2300,
  BUSINESS_MONTHLY: 7900,
  BUSINESS_YEARLY: 6300,
};

async function getUsageCounts(workspaceId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [sites, teamMembers, domains, aiCredits, formSubmissions, redirects] =
    await Promise.all([
      prisma.site.count({ where: { workspaceId } }),
      prisma.workspaceMember.count({ where: { workspaceId } }),
      prisma.domain.count({ where: { site: { workspaceId } } }),
      prisma.aIGenerationJob.count({
        where: { workspaceId, createdAt: { gte: startOfMonth } },
      }),
      prisma.formSubmission.count({
        where: { formBlock: { site: { workspaceId } }, createdAt: { gte: startOfMonth } },
      }),
      prisma.redirect.count({ where: { site: { workspaceId } } }),
    ]);

  return { sites, teamMembers, domains, aiCredits, formSubmissions, redirects };
}

function buildUsage(
  counts: Awaited<ReturnType<typeof getUsageCounts>>,
  plan: PlanName,
) {
  const limits = PLAN_LIMITS[plan];
  return {
    sites: { used: counts.sites, limit: limits.sites as number },
    bandwidth: { usedMB: 0, limitMB: limits.bandwidthMB as number },
    storage: { usedMB: 0, limitMB: limits.storageMB as number },
    teamMembers: { used: counts.teamMembers, limit: limits.teamMembers as number },
    domains: { used: counts.domains, limit: limits.customDomains as number },
    aiCredits: { used: counts.aiCredits, limit: limits.aiGenerations as number },
    formSubmissions: { used: counts.formSubmissions, limit: limits.formSubmissions as number },
    redirects: { used: counts.redirects, limit: limits.urlRedirects as number },
  };
}

export async function getBillingOverview(workspaceId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
    include: { paymentMethod: true },
  });

  const plan = (subscription?.plan ?? "FREE") as PlanName;
  const counts = await getUsageCounts(workspaceId);
  const usage = buildUsage(counts, plan);

  if (!subscription) {
    return {
      plan: "FREE",
      status: "ACTIVE",
      interval: "MONTHLY",
      price: 0,
      currency: "usd",
      cancelAtPeriodEnd: false,
      isGrandfathered: false,
      currentPeriodEnd: new Date(),
      paymentMethod: null,
      usage,
    };
  }

  return {
    plan: subscription.plan,
    status: subscription.status,
    interval: subscription.interval,
    price: subscription.price,
    currency: subscription.currency,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    isGrandfathered: subscription.isGrandfathered,
    currentPeriodEnd: subscription.stripeCurrentPeriodEnd,
    paymentMethod: subscription.paymentMethod
      ? {
          brand: subscription.paymentMethod.brand,
          last4: subscription.paymentMethod.last4,
          expMonth: subscription.paymentMethod.expMonth,
          expYear: subscription.paymentMethod.expYear,
        }
      : null,
    usage,
  };
}

export async function getUsageDetails(workspaceId: string, plan: PlanName) {
  const counts = await getUsageCounts(workspaceId);
  const limits = PLAN_LIMITS[plan];

  function computePercentage(used: number, limit: number): number {
    if (limit === -1) return 0;
    return Math.round((used / limit) * 100);
  }

  return {
    sites: {
      used: counts.sites,
      limit: limits.sites as number,
      percentage: computePercentage(counts.sites, limits.sites as number),
    },
    teamMembers: {
      used: counts.teamMembers,
      limit: limits.teamMembers as number,
      percentage: computePercentage(counts.teamMembers, limits.teamMembers as number),
    },
    domains: {
      used: counts.domains,
      limit: limits.customDomains as number,
      percentage: computePercentage(counts.domains, limits.customDomains as number),
    },
    aiCredits: {
      used: counts.aiCredits,
      limit: limits.aiGenerations as number,
      percentage: computePercentage(counts.aiCredits, limits.aiGenerations as number),
    },
    formSubmissions: {
      used: counts.formSubmissions,
      limit: limits.formSubmissions as number,
      percentage: computePercentage(counts.formSubmissions, limits.formSubmissions as number),
    },
    redirects: {
      used: counts.redirects,
      limit: limits.urlRedirects as number,
      percentage: computePercentage(counts.redirects, limits.urlRedirects as number),
    },
  };
}

export async function listInvoices(
  workspaceId: string,
  page: number,
  perPage: number,
) {
  const [total, data] = await Promise.all([
    prisma.invoice.count({ where: { workspaceId } }),
    prisma.invoice.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return { data, total };
}

export async function upgradePlan(workspaceId: string, input: UpgradeInput) {
  const existing = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  if (existing) {
    throw new Error("ALREADY_SUBSCRIBED");
  }

  const priceKey = `${input.planId}_${input.interval}`;
  const priceId = STRIPE_PRICE_IDS[priceKey];
  if (!priceId) throw new Error("INVALID_PRICE");

  const stripe = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Get or create Stripe customer for this workspace
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { stripeCustomerId: true, name: true },
  });

  let customerId = workspace.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: workspace.name,
      metadata: { workspaceId },
    });
    customerId = customer.id;
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/billing?upgraded=1`,
    cancel_url: `${baseUrl}/dashboard/billing`,
    subscription_data: {
      metadata: { workspaceId, planId: input.planId, interval: input.interval },
    },
  });

  return { checkoutUrl: session.url! };
}

export async function cancelSubscription(
  workspaceId: string,
  input: CancelInput,
) {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  if (!subscription) {
    throw new Error("NO_SUBSCRIPTION");
  }

  if (subscription.cancelAtPeriodEnd) {
    throw new Error("ALREADY_CANCELLED");
  }

  await getStripe().subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  return prisma.subscription.update({
    where: { workspaceId },
    data: {
      cancelAtPeriodEnd: true,
      cancelReason: input.reason,
      cancelFeedback: input.feedback,
    },
  });
}

export async function reactivateSubscription(workspaceId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  if (!subscription) {
    throw new Error("NO_SUBSCRIPTION");
  }

  if (!subscription.cancelAtPeriodEnd) {
    throw new Error("NOT_CANCELLED");
  }

  await getStripe().subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  return prisma.subscription.update({
    where: { workspaceId },
    data: {
      cancelAtPeriodEnd: false,
      cancelReason: null,
      cancelFeedback: null,
    },
  });
}

export function getPlans() {
  return Object.entries(PLAN_LIMITS).map(([name, limits]) => ({
    name,
    sites: limits.sites,
    pagesPerSite: limits.pagesPerSite,
    customDomains: limits.customDomains,
    teamMembers: limits.teamMembers,
    storageMB: limits.storageMB,
    bandwidthMB: limits.bandwidthMB,
    aiGenerations: limits.aiGenerations,
    formSubmissions: limits.formSubmissions,
    urlRedirects: limits.urlRedirects,
    priceMonthly: limits.priceMonthly,
    priceYearly: limits.priceYearly,
  }));
}
