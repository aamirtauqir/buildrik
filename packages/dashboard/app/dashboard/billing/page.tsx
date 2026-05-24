"use client";

import { useState } from "react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { PlanCard } from "@/components/billing/plan-card";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { UsageBars } from "@/components/billing/usage-bars";
import type { UsageItem } from "@/components/billing/usage-bars";
import { InvoiceTable } from "@/components/billing/invoice-table";
import type { Invoice } from "@/components/billing/invoice-table";
import { PaymentMethodCard } from "@/components/billing/payment-method-card";
import { CancelModal } from "@/components/billing/cancel-modal";
import { DunningBanner } from "@/components/dashboard/dunning-banner";

type PlanKey = "FREE" | "PRO" | "BUSINESS";
type Interval = "MONTHLY" | "YEARLY";

const PLAN_NAMES: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  BUSINESS: "Business",
};

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  PRO: { monthly: 19, yearly: 15 },
  BUSINESS: { monthly: 49, yearly: 39 },
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
  return [
    { label: "Sites", used: usage.sites.used, limit: usage.sites.limit },
    { label: "Bandwidth", used: usage.bandwidth.usedMB, limit: usage.bandwidth.limitMB, unit: "MB" },
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

export default function BillingPage() {
  const { addToast } = useToast();
  const [showPlans, setShowPlans] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [switchInterval, setSwitchInterval] = useState<Interval | null>(null);
  const [invoicePage, setInvoicePage] = useState(1);

  const overviewQuery = trpc.billing.overview.useQuery();
  const invoicesQuery = trpc.billing.invoices.useQuery({ page: invoicePage, perPage: 10 });

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

  const switchIntervalMutation = trpc.billing.switchInterval.useMutation({
    onSuccess: () => {
      overviewQuery.refetch();
      setSwitchInterval(null);
      addToast("success", "Billing interval switched successfully");
    },
    onError: (err) => addToast("error", "Switch failed", err.message),
  });

  const overview = overviewQuery.data;
  const isLoading = overviewQuery.isLoading;
  const isDunning = overview?.status === "PAST_DUE";
  const planKey = (overview?.plan ?? "FREE") as PlanKey;
  const currentInterval = (overview?.interval ?? "MONTHLY") as Interval;
  const cancelAtPeriodEnd = overview?.cancelAtPeriodEnd === true;

  if (isLoading) {
    return (
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>Billing</h1>
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
          ))}
        </div>
      </div>
    );
  }


  /* Plan comparison view */
  if (showPlans) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>Choose a Plan</h1>
          <button
            onClick={() => setShowPlans(false)}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
          >
            Back to Billing
          </button>
        </div>
        <div className="mt-6">
          <div className="space-y-4">
            <div
              className="rounded-xl border p-4 text-center"
              style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-page)" }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                Payment processing coming soon
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                We&apos;re integrating Stripe. Upgrades will be available here once it&apos;s ready.
              </p>
            </div>
            <PlanComparison
              currentPlan={planKey}
              onSelectPlan={() => {}}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>Billing</h1>
        {planKey === "FREE" && (
          <button
            onClick={() => setShowPlans(true)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            View Plans
          </button>
        )}
      </div>

      {/* D) Dunning countdown */}
      {isDunning && <div className="mt-4"><DunningBanner /></div>}

      {/* B) Reactivation banner */}
      {cancelAtPeriodEnd && overview?.currentPeriodEnd && (
        <div
          className="mt-4 flex items-center justify-between rounded-xl border px-5 py-3"
          style={{ borderColor: "#F59E0B", backgroundColor: "#FFFBEB" }}
        >
          <p className="text-sm font-medium" style={{ color: "#92400E" }}>
            Your plan cancels on {formatDate(overview.currentPeriodEnd)}
          </p>
          <button
            onClick={() => reactivateMutation.mutate()}
            disabled={reactivateMutation.isPending}
            className="ml-4 shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {reactivateMutation.isPending ? "Reactivating..." : "Reactivate"}
          </button>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {overview && (
          <>
            <PlanCard
              planId={planKey}
              name={PLAN_NAMES[planKey] ?? planKey}
              price={overview.price}
              interval={currentInterval}
              currency={overview.currency}
              features={PLAN_FEATURES_MAP[planKey] ?? []}
              isCurrent
              isGrandfathered={overview.isGrandfathered}
              onChangePlan={() => setShowPlans(true)}
            />

            {/* C) Interval switch */}
            {planKey !== "FREE" && (
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-border-default)] bg-white px-5 py-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    Billing interval
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    Currently billed {currentInterval === "YEARLY" ? "annually" : "monthly"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSwitchInterval(currentInterval === "MONTHLY" ? "YEARLY" : "MONTHLY")
                  }
                  className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-bg-page)]"
                  style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
                >
                  Switch to {currentInterval === "MONTHLY" ? "Yearly" : "Monthly"}
                </button>
              </div>
            )}
          </>
        )}

        {overview && <UsageBars items={toUsageItems(overview.usage)} />}

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

      {/* C) Interval switch confirmation modal */}
      {switchInterval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
              Switch to {PLAN_NAMES[planKey]} {switchInterval === "YEARLY" ? "Yearly" : "Monthly"}?
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              You&apos;ll be charged a prorated amount for the remainder of your current billing period.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSwitchInterval(null)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-bg-page)]"
                style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => switchIntervalMutation.mutate({ interval: switchInterval })}
                disabled={switchIntervalMutation.isPending}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {switchIntervalMutation.isPending ? "Switching..." : "Confirm Switch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
