import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type PlanName } from "@/lib/constants/plan-limits";
import { STRIPE_CANCEL_FEEDBACK, type UpgradeInput, type CancelInput } from "@buildrik/shared/schemas/billing";
import { getStripe, isStripeConfigured, getStripePriceId } from "@/server/services/stripe.client";

async function getUsageCounts(workspaceId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // MediaAsset.siteId is a bare string (no relation), so storage is summed by
  // siteId ∈ the workspace's sites. Real figure — was hardcoded 0.
  // `deletedAt: null` for the same reason as usage.service: the `sites` count
  // below already excludes soft-deleted sites, so leaving them in the storage
  // aggregate made the two halves of the same object disagree about which
  // sites the workspace has.
  const siteIds = (
    await prisma.site.findMany({ where: { workspaceId, deletedAt: null }, select: { id: true } })
  ).map((s) => s.id);

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

/**
 * Resolve the workspace's Stripe customer, creating one on first use. Writing
 * `stripeCustomerId` here is safe under the self-grant invariant this file
 * guards: a Stripe customer id carries no entitlement by itself — it is a
 * billing-identity mapping, not a plan. Only the verified webhook (below,
 * `handleCheckoutCompleted` et al. in stripe-webhook.service.ts) may write
 * `Subscription.plan` / `Workspace.plan`.
 */
async function resolveStripeCustomerId(workspaceId: string): Promise<string> {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { stripeCustomerId: true, ownerId: true, name: true },
  });
  if (workspace.stripeCustomerId) return workspace.stripeCustomerId;

  const owner = await prisma.user.findUnique({
    where: { id: workspace.ownerId },
    select: { email: true },
  });
  const customer = await getStripe().customers.create({
    email: owner?.email ?? undefined,
    name: workspace.name,
    metadata: { workspaceId },
  });
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
}

/**
 * Creates a hosted Stripe Checkout session and returns its URL — nothing
 * more. This is the replacement for the old `upgradePlan()`, which used to
 * throw unconditionally (see the git history / the audit that found the
 * self-grant hole this file is named for). The throw is preserved in spirit:
 * this function still writes no plan state. `client_reference_id` carries the
 * workspace id so the webhook (the only writer of `Subscription.plan` /
 * `Workspace.plan`) can resolve which workspace to upgrade once Stripe
 * confirms payment.
 */
export async function createCheckoutSession(
  workspaceId: string,
  input: UpgradeInput,
): Promise<{ url: string }> {
  if (!isStripeConfigured()) throw new Error("PAYMENTS_NOT_CONFIGURED");

  // Subscription.workspaceId is @unique — an existing, non-cancelled row
  // means a second Checkout session would collide. Tier changes for an
  // existing subscriber go through the Portal (createPortalSession below),
  // which lands back as customer.subscription.updated.
  const existing = await prisma.subscription.findUnique({ where: { workspaceId } });
  if (existing && existing.status !== "CANCELLED") {
    throw new Error("ALREADY_SUBSCRIBED");
  }

  const priceId = getStripePriceId(input.planId, input.interval);
  const customerId = await resolveStripeCustomerId(workspaceId);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: workspaceId,
    line_items: [{ price: priceId, quantity: 1 }],
    // Return to Billing (where the flow launched and the new plan shows), not
    // Plans — the ?checkout= param is handled there to confirm + refetch.
    success_url: `${appUrl}/dashboard/settings/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/settings/billing?checkout=cancel`,
  });

  if (!session.url) throw new Error("STRIPE_SESSION_NO_URL");
  return { url: session.url };
}

/**
 * Creates a Stripe Customer Portal session for card changes, cancellation,
 * and invoice history — all handled by Stripe, so no PAN or plan-mutation
 * surface exists in our app.
 */
export async function createPortalSession(workspaceId: string): Promise<{ url: string }> {
  if (!isStripeConfigured()) throw new Error("PAYMENTS_NOT_CONFIGURED");

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { stripeCustomerId: true, plan: true },
  });
  if (!workspace?.stripeCustomerId) {
    // A paid workspace with no Stripe customer was imported/grandfathered
    // outside Stripe — telling them to "upgrade first" is contradictory. Give
    // them a distinct, honest error. A FREE workspace genuinely has no billing
    // account yet.
    throw new Error(workspace?.plan && workspace.plan !== "FREE" ? "GRANDFATHERED_NO_PORTAL" : "NO_STRIPE_CUSTOMER");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await getStripe().billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: `${appUrl}/dashboard/settings/billing`,
  });
  return { url: session.url };
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

/**
 * Flip `cancel_at_period_end` on Stripe, then mirror Stripe's answer locally.
 *
 *   caller ──▶ Stripe subscriptions.update ──▶ mirror response into Prisma
 *                      │                                  │
 *                      │ throws ──▶ NO local write        │ throws ──▶ webhook
 *                      ▼                                  ▼   reconciles from
 *              user sees a real error            customer.subscription.updated
 *
 * The order is the whole point. Until 2026-07-31 these two functions wrote the
 * local flag and never called Stripe at all: the banner said "cancels on
 * <date>", the card was charged at renewal, and the next
 * customer.subscription.updated wrote Stripe's `false` back over our `true`, so
 * the banner vanished with no error anywhere. Local-first has no reconciler.
 * Stripe-first does: `handleSubscriptionUpdated` already writes
 * `cancel_at_period_end` authoritatively, so a Prisma failure after a
 * successful Stripe call self-heals on the webhook.
 */
async function updateStripeCancelAtPeriodEnd(
  subscription: { stripeSubscriptionId: string },
  cancelAtPeriodEnd: boolean,
  details?: { feedback: string; comment?: string },
) {
  try {
    return await getStripe().subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: cancelAtPeriodEnd,
        ...(details
          ? {
              cancellation_details: {
                feedback: details.feedback as "other",
                ...(details.comment ? { comment: details.comment } : {}),
              },
            }
          : {}),
      },
      // A double-clicked Cancel would otherwise fire two updates and emit two
      // customer.subscription.updated events for the same intent.
      { idempotencyKey: `cancel:${subscription.stripeSubscriptionId}:${cancelAtPeriodEnd}` },
    );
  } catch (e: unknown) {
    // Grandfathered rows carry a placeholder id Stripe 404s on (the same case
    // createPortalSession already anticipates). Surface it as its own domain
    // error rather than a 500 — and never write the local flag.
    const code = (e as { code?: string })?.code;
    if (code === "resource_missing") throw new Error("GRANDFATHERED_NO_PORTAL");
    throw e;
  }
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

  const updated = await updateStripeCancelAtPeriodEnd(subscription, true, {
    feedback: STRIPE_CANCEL_FEEDBACK[input.reason],
    comment: input.feedback,
  });

  // Idempotent by intent: if Stripe already reads cancelled, the user's goal is
  // satisfied, so reconcile and return instead of erroring. The old
  // ALREADY_CANCELLED guard fired off our local mirror, which could be stale in
  // either direction — including stale-true from the very bug being fixed here.
  return prisma.subscription.update({
    where: { workspaceId },
    data: {
      cancelAtPeriodEnd: updated.cancel_at_period_end,
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

  // Deliberately NOT sending `cancel_at`. On this API version that is a
  // separate mechanism, and mixing the two produces a cancellation that never
  // clears. Also deliberately not subscriptions.cancel(), which terminates
  // immediately and contradicts "stays active until the end of your period".
  const updated = await updateStripeCancelAtPeriodEnd(subscription, false);

  return prisma.subscription.update({
    where: { workspaceId },
    data: {
      cancelAtPeriodEnd: updated.cancel_at_period_end,
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
