"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { MetricValue } from "@/components/dashboard/primitives";
import { ErrorState } from "@/components/states";

type PlanName = "FREE" | "PRO" | "BUSINESS";

interface PlanEntry {
  name: string;
  sites: number;
  customDomains: number;
  teamMembers: number;
  priceMonthly: number;
  priceYearly: number;
}

const PLAN_ORDER: PlanName[] = ["FREE", "PRO", "BUSINESS"];

const PLAN_LABEL: Record<PlanName, string> = {
  FREE: "Free",
  PRO: "Pro",
  BUSINESS: "Business",
};

const PLAN_TAGLINE: Record<PlanName, string> = {
  FREE: "For trying things out",
  PRO: "For solo builders",
  BUSINESS: "For studios & teams",
};

function formatMoney(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function priceLabel(plan: PlanEntry, yearly: boolean): { amount: string; suffix: string | null; note: string | null } {
  if (plan.priceMonthly === 0) return { amount: "$0", suffix: "/mo", note: null };
  const perMonth = yearly ? plan.priceYearly : plan.priceMonthly;
  return { amount: `$${formatMoney(perMonth)}`, suffix: "/mo", note: yearly ? "billed yearly" : null };
}

function siteLabel(n: number): string {
  return n === -1 ? "Unlimited sites" : `${n} sites`;
}

function domainLabel(n: number): string {
  if (n === -1) return "Unlimited custom domains";
  if (n === 0) return "No custom domains";
  return `${n} custom domain${n === 1 ? "" : "s"}`;
}

function teamLabel(n: number): string {
  return n === -1 ? "Unlimited team members" : `${n} team member${n === 1 ? "" : "s"}`;
}

// Real limit values only (PLAN_LIMITS is the SSOT) — no invented marketing
// claims like "priority support" that no limit backs.
function planFeatures(plan: PlanEntry): string[] {
  return [siteLabel(plan.sites), domainLabel(plan.customDomains), teamLabel(plan.teamMembers)];
}

export default function PlansPage() {
  const [yearly, setYearly] = useState(false);
  const overviewQuery = trpc.billing.overview.useQuery(undefined, { retry: false });
  const plansQuery = trpc.billing.plans.useQuery();

  const currentPlanId = (overviewQuery.data?.plan as PlanName) ?? "FREE";

  // Without this, `?? 0` fallbacks below render every plan as $0 / 0-limit
  // while the query is in flight or errored — false pricing on the money page.
  if (plansQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-80 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
        ))}
      </div>
    );
  }

  if (plansQuery.isError) {
    return (
      <ErrorState
        title="Couldn't load plans"
        description="Something went wrong fetching pricing. Your current plan is unaffected."
        onRetry={() => plansQuery.refetch()}
      />
    );
  }

  const plans: PlanEntry[] = PLAN_ORDER.map((name) => {
    const found = plansQuery.data?.find((p) => p.name === name);
    return {
      name,
      sites: Number(found?.sites ?? 0),
      customDomains: Number(found?.customDomains ?? 0),
      teamMembers: Number(found?.teamMembers ?? 0),
      priceMonthly: Number(found?.priceMonthly ?? 0),
      priceYearly: Number(found?.priceYearly ?? 0),
    };
  });

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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const planId = plan.name as PlanName;
          const isCurrent = planId === currentPlanId;
          const isInk = planId === "BUSINESS";
          const popular = planId === "PRO";
          const price = priceLabel(plan, yearly);

          const cardStyle = isInk
            ? { backgroundColor: "var(--color-ink)", borderColor: "var(--color-ink)", boxShadow: "var(--shadow-card)" }
            : popular
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
            <div key={plan.name} className="relative flex flex-col rounded-xl border p-5" style={cardStyle}>
              {popular && (
                <span
                  className="absolute -top-2.5 left-5 rounded-pill px-2.5 py-0.5 text-eyebrow font-semibold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  Popular
                </span>
              )}

              <h2 className="text-section-title" style={{ color: nameColor }}>
                {PLAN_LABEL[planId]}
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
                {PLAN_TAGLINE[planId]}
              </p>

              <ul className="mt-5 space-y-2.5">
                {planFeatures(plan).map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-body" style={{ color: featureColor }}>
                    <Check className="h-4 w-4 shrink-0" style={{ color: checkColor }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <PlanCta planId={planId} popular={popular} isCurrent={isCurrent} currentPlanId={currentPlanId} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanCta({
  planId,
  popular,
  isCurrent,
  currentPlanId,
}: {
  planId: PlanName;
  popular: boolean;
  isCurrent: boolean;
  currentPlanId: PlanName;
}) {
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

  const isUpgrade = PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(currentPlanId);
  const label = isUpgrade ? "Upgrade" : "Downgrade";

  if (popular) {
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
