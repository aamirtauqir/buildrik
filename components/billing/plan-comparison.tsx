"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

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

const PLAN_PRICES: Record<PlanKey, { monthly: number; yearly: number }> = {
  FREE: { monthly: 0, yearly: 0 },
  PRO: { monthly: 19, yearly: 15 },
  BUSINESS: { monthly: 49, yearly: 39 },
};

const PLAN_BADGE: Record<PlanKey, { bg: string; color: string; label: string }> = {
  FREE: { bg: "#F3F4F6", color: "#7A7A7A", label: "Free" },
  PRO: { bg: "#EFF6FF", color: "#3B82F6", label: "Pro" },
  BUSINESS: { bg: "#F5F3FF", color: "#8B5CF6", label: "Business" },
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
}: PlanComparisonProps) {
  const [yearly, setYearly] = useState(false);
  const interval = yearly ? "YEARLY" : "MONTHLY";
  const plans: PlanKey[] = ["FREE", "PRO", "BUSINESS"];
  const bestForYou = findBestForYou(currentPlan, nearLimitFeatures);

  return (
    <div>
      <div className="mb-6 flex items-center justify-center gap-3">
        <span className="text-sm font-medium" style={{ color: yearly ? "#7A7A7A" : "#0D0D0D" }}>
          Monthly
        </span>
        <button
          role="switch"
          aria-checked={yearly}
          onClick={() => setYearly((v) => !v)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            yearly ? "bg-[#E42313]" : "bg-[#E8E8E8]"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 translate-x-1 rounded-full bg-white shadow transition-transform",
              yearly && "translate-x-6"
            )}
          />
        </button>
        <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: yearly ? "#0D0D0D" : "#7A7A7A" }}>
          Yearly
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: "#F0FDF4", color: "#22C55E" }}
          >
            Save 20%
          </span>
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E8E8E8]">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "#FAFAFA" }}>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#7A7A7A" }}>
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
                    className={cn("relative px-6 py-4 text-center", isCurrent && "bg-[#FEF2F2]")}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {isBest && (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ backgroundColor: "#F0FDF4", color: "#22C55E" }}
                        >
                          Best for you
                        </span>
                      )}
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold" style={{ color: "#E42313" }}>
                          Current
                        </span>
                      )}
                      <span className="mt-1 text-base font-bold" style={{ color: "#0D0D0D" }}>
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
                    "border-t border-[#E8E8E8]",
                    i % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"
                  )}
                >
                  <td className="px-6 py-3 font-medium" style={{ color: "#0D0D0D" }}>
                    <span className="flex items-center gap-2">
                      {row.label}
                      {showWarning && (
                        <span
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: "#FEF9C3", color: "#A16207" }}
                          title={pct !== null ? `${pct}% used` : "Near limit"}
                        >
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M8 1L15 14H1L8 1Z" fill="#EAB308" stroke="#A16207" strokeWidth="1" />
                            <text x="8" y="12" textAnchor="middle" fontSize="8" fill="#A16207" fontWeight="bold">!</text>
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
                        className={cn("px-6 py-3 text-center text-sm", isCurrent && "bg-[#FEF2F2]")}
                        style={{ color: "#7A7A7A" }}
                      >
                        {row[key]}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          {onSelectPlan && (
            <tfoot>
              <tr className="border-t border-[#E8E8E8] bg-white">
                <td className="px-6 py-4" />
                {plans.map((plan) => {
                  const isCurrent = plan === currentPlan;
                  const isBest = plan === bestForYou;
                  return (
                    <td key={plan} className={cn("px-6 py-4 text-center", isCurrent && "bg-[#FEF2F2]")}>
                      {!isCurrent && plan !== "FREE" && (
                        <button
                          onClick={() => onSelectPlan(plan, interval)}
                          className={cn(
                            "rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90",
                            isBest && "ring-2 ring-[#22C55E] ring-offset-2"
                          )}
                          style={{ backgroundColor: "#E42313" }}
                        >
                          {isBest ? "Upgrade — Best for you" : "Upgrade"}
                        </button>
                      )}
                      {isCurrent && (
                        <span className="text-sm font-semibold" style={{ color: "#E42313" }}>
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
