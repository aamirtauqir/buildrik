"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { PlanCard } from "@/components/billing/plan-card";
import { PlanComparison } from "@/components/billing/plan-comparison";
import { UsageBars } from "@/components/billing/usage-bars";
import { InvoiceTable } from "@/components/billing/invoice-table";
import { PaymentMethodCard } from "@/components/billing/payment-method-card";
import { CancelModal } from "@/components/billing/cancel-modal";
import { DunningBanner } from "@/components/dashboard/dunning-banner";

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
            currentPlan={overview?.plan ?? "FREE"}
            onUpgrade={(planId, interval) =>
              upgradeMutation.mutate({ planId: planId as "PRO" | "BUSINESS", interval: interval as "MONTHLY" | "YEARLY" })
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
            plan={overview.plan}
            price={overview.price}
            interval={overview.interval}
            currency={overview.currency}
            cancelAtPeriodEnd={overview.cancelAtPeriodEnd}
            isGrandfathered={overview.isGrandfathered}
            currentPeriodEnd={overview.currentPeriodEnd}
            onChangePlan={() => setShowPlans(true)}
            onCancel={() => setShowCancel(true)}
            onReactivate={() => reactivateMutation.mutate()}
          />
        )}
        {overview && <UsageBars usage={overview.usage} />}
        {overview?.paymentMethod && (
          <PaymentMethodCard
            brand={overview.paymentMethod.brand}
            last4={overview.paymentMethod.last4}
            expMonth={overview.paymentMethod.expMonth}
            expYear={overview.paymentMethod.expYear}
            onUpdate={() => addToast("info", "Payment method update coming soon")}
          />
        )}
        {invoicesQuery.data && invoicesQuery.data.data.length > 0 && (
          <InvoiceTable invoices={invoicesQuery.data.data} />
        )}
      </div>
      <CancelModal
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={(reason, feedback) =>
          cancelMutation.mutate({ reason: reason as "TOO_EXPENSIVE" | "MISSING_FEATURES" | "SWITCHING" | "NOT_USING" | "TEMPORARY" | "OTHER", feedback })
        }
        periodEnd={overview?.currentPeriodEnd ?? new Date()}
      />
    </div>
  );
}
