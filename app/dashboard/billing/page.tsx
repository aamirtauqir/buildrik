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

const PLAN_NAMES: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  BUSINESS: "Business",
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

export default function BillingPage() {
  const { addToast } = useToast();
  const [showPlans, setShowPlans] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const overviewQuery = trpc.billing.overview.useQuery();
  const invoicesQuery = trpc.billing.invoices.useQuery({ page: 1, perPage: 10 });

  const upgradeMutation = trpc.billing.upgrade.useMutation({
    onSuccess: () => {
      overviewQuery.refetch();
      setShowPlans(false);
      addToast("success", "Plan upgraded successfully");
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
  });

  const overview = overviewQuery.data;
  const isLoading = overviewQuery.isLoading;
  const isDunning = overview?.status === "PAST_DUE";
  const planKey = (overview?.plan ?? "FREE") as PlanKey;

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

  if (showPlans) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Choose a Plan</h1>
          <button onClick={() => setShowPlans(false)} className="rounded-lg border px-4 py-2 text-sm font-medium" style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}>Back to Billing</button>
        </div>
        <div className="mt-6">
          <PlanComparison
            currentPlan={planKey}
            onSelectPlan={(selectedPlan, interval) =>
              upgradeMutation.mutate({ planId: selectedPlan as "PRO" | "BUSINESS", interval })
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Billing</h1>
      {isDunning && <div className="mt-4"><DunningBanner /></div>}
      <div className="mt-6 space-y-6">
        {overview && (
          <PlanCard
            planId={planKey}
            name={PLAN_NAMES[planKey] ?? planKey}
            price={overview.price}
            interval={overview.interval as "MONTHLY" | "YEARLY"}
            currency={overview.currency}
            features={PLAN_FEATURES_MAP[planKey] ?? []}
            isCurrent
            isGrandfathered={overview.isGrandfathered}
            onChangePlan={() => setShowPlans(true)}
          />
        )}
        {overview && <UsageBars items={toUsageItems(overview.usage)} />}
        {overview?.paymentMethod && (
          <PaymentMethodCard
            paymentMethod={overview.paymentMethod}
            onUpdate={() => addToast("info", "Stripe Elements integration required — see PRD BIL-5")}
          />
        )}
        {invoicesQuery.data && invoicesQuery.data.data.length > 0 && (
          <InvoiceTable invoices={invoicesQuery.data.data as Invoice[]} />
        )}
      </div>
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
