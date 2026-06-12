import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { UpgradeInput, CancelInput } from "@buildrik/shared/schemas/billing";

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
      prisma.site.count({ where: { workspaceId, deletedAt: null } }),
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
  // Payments are not wired yet (Stripe pending). Without this gate any
  // authenticated user can call billing.upgrade directly over tRPC and
  // provision an ACTIVE paid plan backed by placeholder_* Stripe IDs —
  // a free upgrade with no payment. Refuse until Stripe is configured.
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("PAYMENTS_NOT_CONFIGURED");
  }

  const existing = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  if (existing) {
    throw new Error("ALREADY_SUBSCRIBED");
  }

  const priceKey = `${input.planId}_${input.interval}`;
  const price = PRICE_MAP[priceKey];

  const [subscription] = await prisma.$transaction([
    prisma.subscription.create({
      data: {
        workspaceId,
        plan: input.planId,
        status: "ACTIVE",
        interval: input.interval,
        price,
        currency: "usd",
        cancelAtPeriodEnd: false,
        isGrandfathered: false,
        stripeSubscriptionId: `placeholder_${workspaceId}_${Date.now()}`,
        stripePriceId: `placeholder_price_${priceKey}`,
        stripeCurrentPeriodStart: new Date(),
        stripeCurrentPeriodEnd: new Date(
          Date.now() + (input.interval === "YEARLY" ? 365 : 30) * 86400000,
        ),
      },
    }),
    prisma.workspace.update({
      where: { id: workspaceId },
      data: { plan: input.planId },
    }),
  ]);

  return subscription;
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
