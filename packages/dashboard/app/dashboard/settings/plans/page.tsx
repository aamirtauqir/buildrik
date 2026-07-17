"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { MetricValue } from "@/components/dashboard/primitives";

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
      {/* The settings layout owns the section PageHeader (D10.4) — this page
          keeps only its billing-cycle toggle. */}
      <div className="mb-6 flex justify-end">
        <div
          className="inline-flex shrink-0 rounded-lg border p-0.5"
          style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
          role="tablist"
          aria-label="Billing cycle"
        >
          <button
            role="tab"
            aria-selected={!yearly}
            onClick={() => setYearly(false)}
            className="rounded-md px-4 py-1.5 text-body font-medium transition-colors"
            style={!yearly ? { backgroundColor: "var(--color-primary)", color: "#FFFFFF" } : { color: "var(--color-text-secondary)" }}
          >
            Monthly
          </button>
          <button
            role="tab"
            aria-selected={yearly}
            onClick={() => setYearly(true)}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-body font-medium transition-colors"
            style={yearly ? { backgroundColor: "var(--color-primary)", color: "#FFFFFF" } : { color: "var(--color-text-secondary)" }}
          >
            Yearly
            <span
              className="text-body-sm font-semibold"
              style={{ color: yearly ? "rgba(255,255,255,0.9)" : "var(--color-success)" }}
            >
              &minus;20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isInk = plan.id === "ENTERPRISE";
          const price = priceLabel(plan, yearly);

          const cardStyle = isInk
            ? { backgroundColor: "var(--color-ink)", borderColor: "var(--color-ink)", boxShadow: "var(--shadow-card)" }
            : plan.popular
              ? {
                  backgroundColor: "var(--color-bg-surface)",
                  borderColor: "var(--color-primary)",
                  boxShadow: "0 0 0 1px var(--color-primary), 0 14px 34px -18px rgba(45,109,255,0.5)",
                }
              : {
                  backgroundColor: "var(--color-bg-surface)",
                  borderColor: "var(--color-border-default)",
                  boxShadow: "var(--shadow-card)",
                };

          const nameColor = isInk ? "#FFFFFF" : "var(--color-text-primary)";
          const priceColor = isInk ? "#FFFFFF" : "var(--color-text-primary)";
          const secondaryColor = isInk ? "rgba(255,255,255,0.68)" : "var(--color-text-secondary)";
          const featureColor = isInk ? "rgba(255,255,255,0.9)" : "var(--color-text-primary)";
          const checkColor = isInk ? "var(--color-teal)" : "var(--color-success)";

          return (
            <div key={plan.id} className="relative flex flex-col rounded-xl border p-5" style={cardStyle}>
              {plan.popular && (
                <span
                  className="absolute -top-2.5 left-5 rounded-pill px-2.5 py-0.5 text-eyebrow font-semibold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  Popular
                </span>
              )}

              <h2 className="text-section-title" style={{ color: nameColor }}>
                {plan.name}
              </h2>

              <div className="mt-3 flex items-baseline gap-1">
                <span style={{ color: priceColor }}>
                  <MetricValue className="text-3xl font-extrabold">{price.amount}</MetricValue>
                </span>
                {price.suffix && (
                  <span className="text-body" style={{ color: secondaryColor }}>
                    {price.suffix}
                  </span>
                )}
              </div>
              <div className="mt-1 h-4 text-body-sm" style={{ color: secondaryColor }}>
                {price.note}
              </div>

              <p className="mt-2 text-body" style={{ color: secondaryColor }}>
                {plan.tagline}
              </p>

              <ul className="mt-5 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-body" style={{ color: featureColor }}>
                    <Check className="h-4 w-4 shrink-0" style={{ color: checkColor }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
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
        className="w-full cursor-not-allowed rounded-lg py-2.5 text-center text-body font-semibold"
        style={{ backgroundColor: "var(--color-bg-subtle)", color: "var(--color-text-muted)" }}
      >
        Current plan
      </button>
    );
  }

  if (plan.id === "ENTERPRISE") {
    return (
      <a
        href="mailto:sales@buildrick.com"
        className="block w-full rounded-lg py-2.5 text-center text-body font-semibold transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#FFFFFF", color: "var(--color-ink)" }}
      >
        Contact sales
      </a>
    );
  }

  const isUpgrade = PLAN_ORDER.indexOf(plan.id) > PLAN_ORDER.indexOf(currentPlanId);
  const label = isUpgrade ? "Upgrade" : "Downgrade";

  if (plan.popular) {
    return (
      <Link
        href="/dashboard/settings/billing"
        className="block w-full rounded-lg py-2.5 text-center text-body font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard/settings/billing"
      className="block w-full rounded-lg border py-2.5 text-center text-body font-semibold transition-colors"
      style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-primary)" }}
    >
      {label}
    </Link>
  );
}
