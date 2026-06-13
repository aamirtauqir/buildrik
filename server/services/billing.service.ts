import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import type { UpgradeInput, CancelInput } from "@buildrik/shared/schemas/billing";

async function getUsageCounts(workspaceId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // MediaAsset.siteId is a bare string (no relation), so storage is summed by
  // siteId ∈ the workspace's sites. Real figure — was hardcoded 0.
  const siteIds = (await prisma.site.findMany({ where: { workspaceId }, select: { id: true } })).map((s) => s.id);

  const [sites, teamMembers, domains, aiCredits, formSubmissions, redirects, storageAgg] =
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
      prisma.mediaAsset.aggregate({ _sum: { bytes: true }, where: { siteId: { in: siteIds } } }),
    ]);

  const storageMB = Math.round((storageAgg._sum?.bytes ?? 0) / (1024 * 1024));
  return { sites, teamMembers, domains, aiCredits, formSubmissions, redirects, storageMB };
}

function buildUsage(
  counts: Awaited<ReturnType<typeof getUsageCounts>>,
  plan: PlanName,
) {
  const limits = PLAN_LIMITS[plan];
  return {
    sites: { used: counts.sites, limit: limits.sites as number },
    // bandwidth has no tracking pipeline yet (used stays 0); the UI hides its
    // meter rather than show a fake 0/limit gauge.
    bandwidth: { usedMB: 0, limitMB: limits.bandwidthMB as number },
    storage: { usedMB: counts.storageMB, limitMB: limits.storageMB as number },
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

export async function upgradePlan(_workspaceId: string, _input: UpgradeInput) {
  // HARD-DISABLED. This procedure receives only { planId, interval } — no
  // proof of payment — so it can never legitimately grant a paid plan. The
  // previous implementation gated on STRIPE_SECRET_KEY *presence* and then
  // wrote placeholder_* Stripe IDs while flipping the plan to ACTIVE: the
  // moment a key existed in prod, ANY authenticated user could self-grant a
  // paid plan for free by calling billing.upgrade directly.
  //
  // Real upgrades must flow through Stripe Checkout: the client is sent to a
  // hosted checkout session, and the plan is flipped to ACTIVE only by the
  // verified `invoice.paid` / `customer.subscription.updated` webhook
  // (handleInvoicePaid / handleSubscriptionUpdated in
  // stripe-webhook.service.ts). Until that checkout-session creation is
  // wired (needs the Stripe SDK), this path stays closed — no DB write, no
  // self-grant surface.
  throw new Error("PAYMENTS_NOT_CONFIGURED");
}

/**
 * Reconcile a workspace's resources to the FREE plan after a downgrade.
 * Non-destructive: published sites beyond the FREE cap are UNPUBLISHED (kept
 * as drafts, fully reversible on re-upgrade), most-recently-published kept.
 * Nothing is deleted — a downgrade must never destroy user data. Returns the
 * number of sites unpublished.
 */
export async function reconcileWorkspaceToFreePlan(workspaceId: string): Promise<number> {
  const cap = PLAN_LIMITS.FREE.sites as number;
  const published = await prisma.site.findMany({
    where: { workspaceId, deletedAt: null, status: "PUBLISHED" },
    orderBy: { lastPublishedAt: "desc" },
    select: { id: true },
  });
  const excess = published.slice(cap); // keep the newest `cap`, unpublish the rest
  if (excess.length === 0) return 0;

  await prisma.site.updateMany({
    where: { id: { in: excess.map((s) => s.id) } },
    data: { status: "DRAFT", publishedUrl: null },
  });
  return excess.length;
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
