"use client";

import { useState } from "react";
import { cn } from "@lib/utils";
import { PLAN_LIMITS } from "@lib/constants/plan-limits";

export const PLAN_FEATURES = [
  { label: "Sites", free: "3", pro: "15", business: "50" },
  { label: "Pages per site", free: "10", pro: "30", business: "50" },
  { label: "Custom domains", free: "0", pro: "3", business: "20" },
  { label: "Team members", free: "1", pro: "5", business: "25" },
  { label: "Storage", free: "500 MB", pro: "5 GB", business: "50 GB" },
  { label: "Bandwidth", free: "1 GB", pro: "10 GB", business: "100 GB" },
  { label: "AI generations", free: "3/mo", pro: "20/mo", business: "Unlimited" },
  { label: "File upload max", free: "10 MB", pro: "50 MB", business: "200 MB" },
  { label: "Form submissions", free: "100/mo", pro: "2,500/mo", business: "Unlimited" },
  { label: "URL redirects", free: "100", pro: "500", business: "Unlimited" },
  { label: "Integrations", free: "0", pro: "2", business: "Unlimited" },
  { label: "Analytics retention", free: "7 days", pro: "30 days", business: "90 days" },
] as const;

type PlanKey = "FREE" | "PRO" | "BUSINESS";

// Prices derive from the single source of truth (PLAN_LIMITS), not hardcoded —
// the UI used to show 19/49 while entitlements priced 29/79 (codex P2).
const PLAN_PRICES: Record<PlanKey, { monthly: number; yearly: number }> = {
  FREE: { monthly: Number(PLAN_LIMITS.FREE.priceMonthly), yearly: Number(PLAN_LIMITS.FREE.priceYearly) },
  PRO: { monthly: Number(PLAN_LIMITS.PRO.priceMonthly), yearly: Number(PLAN_LIMITS.PRO.priceYearly) },
  BUSINESS: { monthly: Number(PLAN_LIMITS.BUSINESS.priceMonthly), yearly: Number(PLAN_LIMITS.BUSINESS.priceYearly) },
};

const PLAN_BADGE: Record<PlanKey, { bg: string; color: string; label: string }> = {
  FREE: { bg: "var(--color-bg-subtle)", color: "var(--color-text-secondary)", label: "Free" },
  PRO: { bg: "var(--color-bg-subtle)", color: "var(--color-text-primary)", label: "Pro" },
  BUSINESS: { bg: "var(--color-text-primary)", color: "#FFFFFF", label: "Business" },
};

export interface UsageMetric {
  label: string;
  used: number;
  limit: number;
}

interface PlanComparisonProps {
  currentPlan: PlanKey;
  nearLimitFeatures?: string[];
  usage?: UsageMetric[];
  onSelectPlan?: (plan: PlanKey, interval: "MONTHLY" | "YEARLY") => void;
  /** Renders Upgrade buttons disabled with a "Coming soon" label (payments not live yet). */
  upgradesDisabled?: boolean;
}

function getWarningPercent(usage: UsageMetric[], label: string): number | null {
  const metric = usage.find((m) => m.label === label);
  if (!metric || metric.limit <= 0) return null;
  return Math.round((metric.used / metric.limit) * 100);
}

function findBestForYou(
  currentPlan: PlanKey,
  nearLimitFeatures: string[],
): PlanKey | null {
  if (nearLimitFeatures.length === 0) return null;

  const planOrder: PlanKey[] = ["FREE", "PRO", "BUSINESS"];
  const currentIdx = planOrder.indexOf(currentPlan);

  // Find the cheapest plan above current that covers all warned metrics
  // For simplicity, if current is FREE and there are warnings, PRO is best
  // If current is PRO, BUSINESS is best
  if (currentIdx < planOrder.length - 1) {
    return planOrder[currentIdx + 1];
  }
  return null;
}

export function PlanComparison({
  currentPlan,
  nearLimitFeatures = [],
  usage = [],
  onSelectPlan,
  upgradesDisabled = false,
}: PlanComparisonProps) {
  const [yearly, setYearly] = useState(false);
  const interval = yearly ? "YEARLY" : "MONTHLY";
  const plans: PlanKey[] = ["FREE", "PRO", "BUSINESS"];
  const bestForYou = findBestForYou(currentPlan, nearLimitFeatures);

  return (
    <div>
      <div className="mb-6 flex items-center justify-center gap-3">
        <span className="text-body font-medium" style={{ color: yearly ? "var(--color-text-secondary)" : "var(--color-text-primary)" }}>
          Monthly
        </span>
        <button
          role="switch"
          aria-checked={yearly}
          onClick={() => setYearly((v) => !v)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            yearly ? "bg-[var(--color-primary)]" : "bg-[var(--color-border-default)]"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 translate-x-1 rounded-full bg-white shadow transition-transform",
              yearly && "translate-x-6"
            )}
          />
        </button>
        <span className="flex items-center gap-1.5 text-body font-medium" style={{ color: yearly ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
          Yearly
          <span
            className="rounded-full px-2 py-0.5 text-body-sm font-semibold"
            style={{ backgroundColor: "#F3FAF7", color: "var(--color-success)" }}
          >
            Save 20%
          </span>
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border-default)]">
        <table className="w-full text-body">
          <thead>
            <tr style={{ backgroundColor: "var(--color-bg-page)" }}>
              <th className="px-6 py-4 text-left text-body-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                Feature
              </th>
              {plans.map((plan) => {
                const badge = PLAN_BADGE[plan];
                const price = PLAN_PRICES[plan][yearly ? "yearly" : "monthly"];
                const isCurrent = plan === currentPlan;
                const isBest = plan === bestForYou;
                return (
                  <th
                    key={plan}
                    className={cn("relative px-6 py-4 text-center", isCurrent && "bg-[var(--color-primary-subtle)]")}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {isBest && (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ backgroundColor: "#F3FAF7", color: "var(--color-success)" }}
                        >
                          Best for you
                        </span>
                      )}
                      <span
                        className="rounded-full px-2.5 py-1 text-body-sm font-semibold"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold" style={{ color: "var(--color-primary)" }}>
                          Current
                        </span>
                      )}
                      <span className="mt-1 text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                        {price === 0 ? "Free" : `$${price}/mo`}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PLAN_FEATURES.map((row, i) => {
              const isNearLimit = nearLimitFeatures.includes(row.label);
              const pct = getWarningPercent(usage, row.label);
              const showWarning = isNearLimit || (pct !== null && pct >= 80);
              return (
                <tr
                  key={row.label}
                  className={cn(
                    "border-t border-[var(--color-border-default)]",
                    i % 2 === 0 ? "bg-white" : "bg-[var(--color-bg-page)]"
                  )}
                >
                  <td className="px-6 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                    <span className="flex items-center gap-2">
                      {row.label}
                      {showWarning && (
                        <span
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: "#FDF6B2", color: "#8E4B10" }}
                          title={pct !== null ? `${pct}% used` : "Near limit"}
                        >
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M8 1L15 14H1L8 1Z" fill="#C27803" stroke="#8E4B10" strokeWidth="1" />
                            <text x="8" y="12" textAnchor="middle" fontSize="8" fill="#8E4B10" fontWeight="bold">!</text>
                          </svg>
                          {pct !== null ? `${pct}%` : "Near limit"}
                        </span>
                      )}
                    </span>
                  </td>
                  {(["free", "pro", "business"] as const).map((key, idx) => {
                    const planKey = plans[idx];
                    const isCurrent = planKey === currentPlan;
                    return (
                      <td
                        key={key}
                        className={cn("px-6 py-3 text-center text-body", isCurrent && "bg-[var(--color-primary-subtle)]")}
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {row[key]}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          {(onSelectPlan || upgradesDisabled) && (
            <tfoot>
              <tr className="border-t border-[var(--color-border-default)] bg-white">
                <td className="px-6 py-4" />
                {plans.map((plan) => {
                  const isCurrent = plan === currentPlan;
                  const isBest = plan === bestForYou;
                  return (
                    <td key={plan} className={cn("px-6 py-4 text-center", isCurrent && "bg-[var(--color-primary-subtle)]")}>
                      {!isCurrent && plan !== "FREE" && (
                        <button
                          onClick={() => onSelectPlan?.(plan, interval)}
                          disabled={upgradesDisabled}
                          title={upgradesDisabled ? "Payment processing is coming soon" : undefined}
                          className={cn(
                            "rounded-lg px-4 py-2 text-body font-semibold text-white transition-opacity",
                            upgradesDisabled
                              ? "cursor-not-allowed opacity-50"
                              : "hover:opacity-90",
                            !upgradesDisabled && isBest && "ring-2 ring-[var(--color-success)] ring-offset-2"
                          )}
                          style={{ backgroundColor: "var(--color-primary)" }}
                        >
                          {upgradesDisabled
                            ? "Coming soon"
                            : isBest
                              ? "Upgrade — Best for you"
                              : "Upgrade"}
                        </button>
                      )}
                      {isCurrent && (
                        <span className="text-body font-semibold" style={{ color: "var(--color-primary)" }}>
                          Current Plan
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
