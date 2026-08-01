"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@lib/trpc/client";
import { PLAN_LIMITS } from "@lib/constants/plan-limits";
import { useToast } from "@/components/dashboard/toast-provider";
import { ErrorState } from "@/components/states";
import { PlanCard } from "@/components/billing/plan-card";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { UsageBars } from "@/components/billing/usage-bars";
import type { UsageItem } from "@/components/billing/usage-bars";
import { InvoiceTable } from "@/components/billing/invoice-table";
import type { Invoice } from "@/components/billing/invoice-table";
import { PaymentMethodCard } from "@/components/billing/payment-method-card";
import { CancelModal } from "@/components/billing/cancel-modal";
import { DunningBanner } from "@/components/dashboard/dunning-banner";
import { SectionCard, MetricValue } from "@/components/dashboard/primitives";

type PlanKey = "FREE" | "PRO" | "BUSINESS";
type Interval = "MONTHLY" | "YEARLY";

const PLAN_NAMES: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  BUSINESS: "Business",
};

// Single source of truth: PLAN_LIMITS. Was hardcoded 19/49 while entitlements
// priced 29/79 (codex P2 — 3-way price drift).
const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  PRO: { monthly: Number(PLAN_LIMITS.PRO.priceMonthly), yearly: Number(PLAN_LIMITS.PRO.priceYearly) },
  BUSINESS: { monthly: Number(PLAN_LIMITS.BUSINESS.priceMonthly), yearly: Number(PLAN_LIMITS.BUSINESS.priceYearly) },
};

const PLAN_FEATURES_MAP: Record<string, string[]> = {
  PRO: [
    "15 sites", "5 team members", "3 custom domains",
    "5 GB storage", "10 GB bandwidth", "20 AI generations/mo",
  ],
  BUSINESS: [
    "50 sites", "25 team members", "20 custom domains",
    "50 GB storage", "100 GB bandwidth", "Unlimited AI generations",
  ],
};

function toUsageItems(usage: {
  sites: { used: number; limit: number };
  bandwidth: { usedMB: number; limitMB: number };
  storage: { usedMB: number; limitMB: number };
  teamMembers: { used: number; limit: number };
  domains: { used: number; limit: number };
  aiCredits: { used: number; limit: number };
  formSubmissions: { used: number; limit: number };
  redirects: { used: number; limit: number };
}): UsageItem[] {
  // Bandwidth omitted — there's no bandwidth-tracking pipeline yet, so a
  // 0/limit gauge would be fake. Storage is now real (summed media bytes).
  return [
    { label: "Sites", used: usage.sites.used, limit: usage.sites.limit },
    { label: "Team members", used: usage.teamMembers.used, limit: usage.teamMembers.limit },
    { label: "Custom domains", used: usage.domains.used, limit: usage.domains.limit },
    { label: "Storage", used: usage.storage.usedMB, limit: usage.storage.limitMB, unit: "MB" },
    { label: "AI credits", used: usage.aiCredits.used, limit: usage.aiCredits.limit },
    { label: "Form submissions", used: usage.formSubmissions.used, limit: usage.formSubmissions.limit },
    { label: "Redirects", used: usage.redirects.used, limit: usage.redirects.limit },
  ];
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BillingPageInner() {
  const { addToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPlans, setShowPlans] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [invoicePage, setInvoicePage] = useState(1);

  const overviewQuery = trpc.billing.overview.useQuery();
  const invoicesQuery = trpc.billing.invoices.useQuery({ page: invoicePage, perPage: 10 });

  // Post-Stripe-Checkout return. The success plan only lands once the webhook
  // fires, so refetch — the row may still be flipping when the user gets back.
  const checkoutResult = searchParams.get("checkout");
  useEffect(() => {
    if (checkoutResult === "success") {
      addToast("success", "Payment received", "Your plan is being updated — this can take a few seconds.");
      overviewQuery.refetch();
    } else if (checkoutResult === "cancel") {
      addToast("info", "Checkout cancelled", "No changes were made to your plan.");
    }
    if (checkoutResult) router.replace("/dashboard/settings/billing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutResult]);

  const cancelMutation = trpc.billing.cancel.useMutation({
    onSuccess: () => {
      overviewQuery.refetch();
      setShowCancel(false);
      addToast("info", "Subscription will cancel at period end");
    },
    onError: (err) => addToast("error", "Cancel failed", err.message),
  });

  const reactivateMutation = trpc.billing.reactivate.useMutation({
    onSuccess: () => {
      overviewQuery.refetch();
      addToast("success", "Subscription reactivated");
    },
    onError: (err) => addToast("error", "Reactivation failed", err.message),
  });

  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => window.location.assign(data.url),
    onError: (err) => addToast("error", "Couldn't start checkout", err.message),
  });

  // Existing subscribers change tier (and card/cancel) through the Stripe
  // Portal — createCheckoutSession throws ALREADY_SUBSCRIBED for them, so the
  // PlanComparison/checkout path is FREE→paid only.
  const portalMutation = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => window.location.assign(data.url),
    onError: (err) => addToast("error", "Couldn't open billing portal", err.message),
  });

  const overview = overviewQuery.data;
  const isLoading = overviewQuery.isLoading;
  const isDunning = overview?.status === "PAST_DUE";
  const planKey = (overview?.plan ?? "FREE") as PlanKey;
  const currentInterval = (overview?.interval ?? "MONTHLY") as Interval;
  const cancelAtPeriodEnd = overview?.cancelAtPeriodEnd === true;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
        ))}
      </div>
    );
  }

  if (overviewQuery.isError) {
    return (
      <ErrorState
        title="Couldn't load billing"
        description="Something went wrong on our end. Your subscription is unaffected."
        onRetry={() => overviewQuery.refetch()}
      />
    );
  }


  /* Plan comparison view */
  if (showPlans) {
    return (
      <div>
        {/* The settings layout owns the section PageHeader (D10.4). */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
            Choose a plan — upgrade or downgrade your workspace subscription.
          </p>
          <button
            onClick={() => setShowPlans(false)}
            className="shrink-0 rounded-lg border px-4 py-2 text-body font-medium"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
          >
            Back to Billing
          </button>
        </div>
        <div className="space-y-4">
          <PlanComparison
            currentPlan={planKey}
            onSelectPlan={(plan, interval) => {
              if (plan === "FREE") return;
              checkoutMutation.mutate({ planId: plan, interval });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* The settings layout owns the section PageHeader (D10.4) — this page
          keeps a plan-change action. This MUST render for paid plans too:
          it is the only reachable trigger for PlanComparison, which is the only
          caller of createCheckoutSession. Gating it to FREE (the prior bug) left
          PRO/BUSINESS with no in-app path to change tier — the PlanCard's own
          "Change Plan" button never renders because that card is always isCurrent. */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => (planKey === "FREE" ? setShowPlans(true) : portalMutation.mutate())}
          disabled={portalMutation.isPending}
          className="rounded-lg px-4 py-2 text-body font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {planKey === "FREE"
            ? "View Plans"
            : portalMutation.isPending
              ? "Opening…"
              : isDunning
                ? "Update payment method"
                : "Change plan"}
        </button>
      </div>

      {/* D) Dunning countdown — grace end matches the billing-downgrade cron
          (7 days after the period end). */}
      {isDunning && (
        <div className="mb-4">
          <DunningBanner
            graceEndsAt={
              overview?.currentPeriodEnd
                ? new Date(new Date(overview.currentPeriodEnd).getTime() + 7 * 24 * 60 * 60 * 1000)
                : null
            }
          />
        </div>
      )}

      {/* B) Reactivation banner */}
      {cancelAtPeriodEnd && overview?.currentPeriodEnd && (
        <div
          className="mb-4 flex items-center justify-between rounded-lg border px-5 py-3"
          style={{ borderColor: "#C27803", backgroundColor: "#FDFDEA" }}
        >
          <p className="text-body font-medium" style={{ color: "#723B13" }}>
            Your plan cancels on <MetricValue>{formatDate(overview.currentPeriodEnd)}</MetricValue>
          </p>
          <button
            onClick={() => reactivateMutation.mutate()}
            disabled={reactivateMutation.isPending}
            className="ml-4 shrink-0 rounded-lg px-4 py-1.5 text-body font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {reactivateMutation.isPending ? "Reactivating..." : "Reactivate"}
          </button>
        </div>
      )}

      <div className="space-y-6">
        {overview && (
          <>
            <PlanCard
              planId={planKey}
              name={PLAN_NAMES[planKey] ?? planKey}
              priceMinor={overview.price}
              interval={currentInterval}
              currency={overview.currency}
              features={PLAN_FEATURES_MAP[planKey] ?? []}
              isCurrent
              isGrandfathered={overview.isGrandfathered}
              onChangePlan={() => setShowPlans(true)}
            />

            {/* C) Interval switch — hidden until real Stripe. The mutation
                did a raw subscription.update({interval}) with no reprice /
                proration (and bypassed the service), so flipping it on a real
                subscription would desync billing. Re-enable with Stripe. */}

            {/* Cancel subscription — opens CancelModal. Was unreachable
                (nothing called setShowCancel). cancelSubscription is real
                (sets cancelAtPeriodEnd; Reactivate undoes it). */}
            {planKey !== "FREE" && !cancelAtPeriodEnd && (
              <div
                className="flex items-center justify-between rounded-lg border px-5 py-4"
                style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
              >
                <div>
                  <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                    Cancel subscription
                  </p>
                  <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Stays active until the end of your billing period
                  </p>
                </div>
                <button
                  onClick={() => setShowCancel(true)}
                  className="rounded-lg border px-4 py-2 text-body font-medium transition-colors hover:bg-[var(--color-bg-page)]"
                  style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
                >
                  Cancel subscription
                </button>
              </div>
            )}
          </>
        )}

        {overview && (
          <SectionCard title="Usage">
            <UsageBars items={toUsageItems(overview.usage)} />
          </SectionCard>
        )}

        {overview?.paymentMethod && (
          <PaymentMethodCard paymentMethod={overview.paymentMethod} />
        )}

        {invoicesQuery.data && invoicesQuery.data.data.length > 0 && (
          <InvoiceTable
            invoices={invoicesQuery.data.data as Invoice[]}
            page={invoicePage}
            totalPages={Math.ceil((invoicesQuery.data.total ?? invoicesQuery.data.data.length) / 10)}
            onPageChange={setInvoicePage}
          />
        )}
      </div>

      {/* Cancel modal */}
      {showCancel && (
        <CancelModal
          onClose={() => setShowCancel(false)}
          onConfirm={(reason, feedback) =>
            cancelMutation.mutate({ reason, feedback })
          }
          periodEnd={overview?.currentPeriodEnd ?? new Date()}
          planFeatures={PLAN_FEATURES_MAP[planKey] ?? []}
          isLoading={cancelMutation.isPending}
        />
      )}

    </div>
  );
}

export default function BillingPage() {
  // useSearchParams (?checkout=success post-Stripe-return) needs a Suspense
  // boundary to prerender — matches every other useSearchParams page here.
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }} />}>
      <BillingPageInner />
    </Suspense>
  );
}
