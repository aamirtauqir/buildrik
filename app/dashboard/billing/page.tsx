"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
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

interface UpgradeConfirmation {
  plan: PlanKey;
  interval: Interval;
}

export default function BillingPage() {
  const { addToast } = useToast();
  const [showPlans, setShowPlans] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [upgradeConfirm, setUpgradeConfirm] = useState<UpgradeConfirmation | null>(null);
  const [switchInterval, setSwitchInterval] = useState<Interval | null>(null);
  const [invoicePage, setInvoicePage] = useState(1);

  const overviewQuery = trpc.billing.overview.useQuery();
  const invoicesQuery = trpc.billing.invoices.useQuery({ page: invoicePage, perPage: 10 });

  const upgradeMutation = trpc.billing.upgrade.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      overviewQuery.refetch();
      setUpgradeConfirm(null);
      setShowPlans(false);
    },
    onError: (err) => addToast("error", "Upgrade failed", err.message),
  });

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
        <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Billing</h1>
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />
          ))}
        </div>
      </div>
    );
  }

  /* A) Upgrade confirmation flow */
  if (upgradeConfirm) {
    const planName = PLAN_NAMES[upgradeConfirm.plan] ?? upgradeConfirm.plan;
    const prices = PLAN_PRICES[upgradeConfirm.plan];
    const price = prices
      ? (upgradeConfirm.interval === "YEARLY" ? prices.yearly : prices.monthly)
      : 0;
    const intervalLabel = upgradeConfirm.interval === "YEARLY" ? "yr" : "mo";

    return (
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Confirm Upgrade</h1>
        <div className="mt-6 max-w-md rounded-2xl border border-[#E8E8E8] bg-white p-6">
          <div className="text-center">
            <span
              className="inline-block rounded-full px-3 py-1 text-sm font-semibold"
              style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}
            >
              {planName}
            </span>
            <div className="mt-3">
              <span className="text-3xl font-bold" style={{ color: "#0D0D0D" }}>
                ${price}/{intervalLabel}
              </span>
            </div>
            <p className="mt-1 text-sm" style={{ color: "#7A7A7A" }}>
              Billed {upgradeConfirm.interval === "YEARLY" ? "annually" : "monthly"}
            </p>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium" style={{ color: "#0D0D0D" }}>
              Card details
            </label>
            <div
              className="mt-2 flex items-center rounded-lg border px-4 py-3"
              style={{ borderColor: "#E8E8E8", backgroundColor: "#FAFAFA" }}
            >
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#B0B0B0]"
                disabled
                style={{ color: "#0D0D0D" }}
              />
              <div className="ml-3 flex gap-2">
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-16 bg-transparent text-center text-sm outline-none placeholder:text-[#B0B0B0]"
                  disabled
                  style={{ color: "#0D0D0D" }}
                />
                <input
                  type="text"
                  placeholder="CVC"
                  className="w-12 bg-transparent text-center text-sm outline-none placeholder:text-[#B0B0B0]"
                  disabled
                  style={{ color: "#0D0D0D" }}
                />
              </div>
            </div>
            <p className="mt-1.5 text-xs" style={{ color: "#B0B0B0" }}>
              Stripe Elements will replace this placeholder
            </p>
          </div>

          <button
            onClick={() =>
              upgradeMutation.mutate({
                planId: upgradeConfirm.plan as "PRO" | "BUSINESS",
                interval: upgradeConfirm.interval,
              })
            }
            disabled={upgradeMutation.isPending}
            className="mt-6 w-full rounded-lg py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#E42313" }}
          >
            {upgradeMutation.isPending
              ? "Processing..."
              : `Start ${planName} — $${price}/${intervalLabel}`}
          </button>

          <button
            onClick={() => setUpgradeConfirm(null)}
            className="mt-3 w-full rounded-lg py-2.5 text-sm font-medium transition-colors hover:bg-[#FAFAFA]"
            style={{ color: "#7A7A7A" }}
          >
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  /* Plan comparison view */
  if (showPlans) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Choose a Plan</h1>
          <button
            onClick={() => setShowPlans(false)}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}
          >
            Back to Billing
          </button>
        </div>
        <div className="mt-6">
          <PlanComparison
            currentPlan={planKey}
            onSelectPlan={(selectedPlan, interval) =>
              setUpgradeConfirm({ plan: selectedPlan as PlanKey, interval })
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Billing</h1>

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
            style={{ backgroundColor: "#E42313" }}
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
              <div className="flex items-center justify-between rounded-xl border border-[#E8E8E8] bg-white px-5 py-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>
                    Billing interval
                  </p>
                  <p className="text-xs" style={{ color: "#7A7A7A" }}>
                    Currently billed {currentInterval === "YEARLY" ? "annually" : "monthly"}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSwitchInterval(currentInterval === "MONTHLY" ? "YEARLY" : "MONTHLY")
                  }
                  className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[#FAFAFA]"
                  style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
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
            <h2 className="text-lg font-bold" style={{ color: "#0D0D0D" }}>
              Switch to {PLAN_NAMES[planKey]} {switchInterval === "YEARLY" ? "Yearly" : "Monthly"}?
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#7A7A7A" }}>
              You&apos;ll be charged a prorated amount for the remainder of your current billing period.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSwitchInterval(null)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:bg-[#FAFAFA]"
                style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
              >
                Cancel
              </button>
              <button
                onClick={() => switchIntervalMutation.mutate({ interval: switchInterval })}
                disabled={switchIntervalMutation.isPending}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#E42313" }}
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
