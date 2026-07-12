"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { PageHeader, MetricValue, Pill } from "@/components/dashboard/primitives";

type PlanId = "STARTER" | "FREELANCER" | "AGENCY" | "ENTERPRISE";

interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number | null; // null = custom
  tagline: string;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "STARTER",
    name: "Starter",
    priceMonthly: 0,
    tagline: "For trying things out",
    features: ["2 sites", "Buildrick subdomain", "Community support"],
  },
  {
    id: "FREELANCER",
    name: "Freelancer",
    priceMonthly: 18,
    tagline: "For solo builders",
    features: ["10 sites", "Custom domains", "Remove Buildrick badge"],
    popular: true,
  },
  {
    id: "AGENCY",
    name: "Agency",
    priceMonthly: 58,
    tagline: "For studios & teams",
    features: ["Unlimited sites", "Client billing", "Priority support"],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    priceMonthly: null,
    tagline: "For large orgs",
    features: ["SSO & SAML", "SLA & DPA", "Dedicated CSM"],
  },
];

const PLAN_ORDER: PlanId[] = ["STARTER", "FREELANCER", "AGENCY", "ENTERPRISE"];

// The billing query speaks FREE/PRO/BUSINESS; map onto the display plans.
const BILLING_TO_PLAN: Record<string, PlanId> = {
  FREE: "STARTER",
  PRO: "FREELANCER",
  BUSINESS: "AGENCY",
};

function formatMoney(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function priceLabel(plan: Plan, yearly: boolean): { amount: string; suffix: string | null; note: string | null } {
  if (plan.priceMonthly === null) return { amount: "Custom", suffix: null, note: null };
  if (plan.priceMonthly === 0) return { amount: "$0", suffix: "/mo", note: null };
  const perMonth = yearly ? plan.priceMonthly * 0.8 : plan.priceMonthly;
  return { amount: `$${formatMoney(perMonth)}`, suffix: "/mo", note: yearly ? "billed yearly" : null };
}

export default function PlansPage() {
  const [yearly, setYearly] = useState(false);
  const overviewQuery = trpc.billing.overview.useQuery(undefined, { retry: false });

  const currentPlanId: PlanId = overviewQuery.data?.plan
    ? BILLING_TO_PLAN[overviewQuery.data.plan] ?? "STARTER"
    : "STARTER";

  return (
    <div>
      <PageHeader
        title="Plans"
        description="Upgrade, downgrade, or switch billing cycle anytime."
        actions={
          <div className="inline-flex shrink-0 rounded-lg border p-0.5" style={{ borderColor: "var(--color-border-default)" }} role="tablist" aria-label="Billing cycle">
            <button
              role="tab"
              aria-selected={!yearly}
              onClick={() => setYearly(false)}
              className="rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
              style={!yearly ? { backgroundColor: "var(--color-primary)", color: "#FFFFFF" } : { color: "var(--color-text-secondary)" }}
            >
              Monthly
            </button>
            <button
              role="tab"
              aria-selected={yearly}
              onClick={() => setYearly(true)}
              className="rounded-md px-4 py-1.5 text-sm font-medium transition-colors"
              style={yearly ? { backgroundColor: "var(--color-primary)", color: "#FFFFFF" } : { color: "var(--color-text-secondary)" }}
            >
              Yearly &minus;20%
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const highlighted = isCurrent || plan.popular;
          const price = priceLabel(plan, yearly);

          return (
            <div
              key={plan.id}
              className="relative flex flex-col rounded-xl border p-5"
              style={{
                backgroundColor: "var(--color-bg-surface)",
                borderColor: highlighted ? "var(--color-primary)" : "var(--color-border-default)",
                boxShadow: plan.popular ? "0 0 0 1px var(--color-primary)" : undefined,
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{plan.name}</h2>
                {plan.popular && <Pill tone="accent">Popular</Pill>}
                {isCurrent && !plan.popular && <Pill tone="accent">Current</Pill>}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}><MetricValue>{price.amount}</MetricValue></span>
                {price.suffix && <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{price.suffix}</span>}
              </div>
              <div className="mt-1 h-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>{price.note}</div>

              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>{plan.tagline}</p>

              <ul className="mt-5 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-primary)" }}>
                    <Check className="h-4 w-4 shrink-0" style={{ color: "var(--color-success)" }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-1">
                <PlanCta plan={plan} isCurrent={isCurrent} currentPlanId={currentPlanId} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanCta({ plan, isCurrent, currentPlanId }: { plan: Plan; isCurrent: boolean; currentPlanId: PlanId }) {
  if (isCurrent) {
    return (
      <button
        disabled
        className="w-full cursor-not-allowed rounded-lg py-2.5 text-center text-sm font-semibold"
        style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}
      >
        Current plan
      </button>
    );
  }

  if (plan.id === "ENTERPRISE") {
    return (
      <a
        href="mailto:sales@buildrick.com"
        className="block w-full rounded-lg border py-2.5 text-center text-sm font-semibold transition-colors"
        style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
      >
        Contact sales
      </a>
    );
  }

  const isUpgrade = PLAN_ORDER.indexOf(plan.id) > PLAN_ORDER.indexOf(currentPlanId);
  return (
    <Link
      href="/dashboard/billing"
      className="block w-full rounded-lg py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      {isUpgrade ? "Upgrade" : "Downgrade"}
    </Link>
  );
}
