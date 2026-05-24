"use client";

import { cn } from "@lib/utils";

type PlanId = "FREE" | "PRO" | "BUSINESS";
type Interval = "MONTHLY" | "YEARLY";

export interface PlanCardProps {
  planId: PlanId;
  name: string;
  price: number;
  interval: Interval;
  currency: string;
  features: string[];
  isCurrent: boolean;
  isGrandfathered?: boolean;
  onChangePlan?: () => void;
}

const PLAN_BADGE: Record<PlanId, { bg: string; color: string }> = {
  FREE: { bg: "#F4F4F4", color: "#7A7A7A" },
  PRO: { bg: "#F4F4F4", color: "#0D0D0D" },
  BUSINESS: { bg: "#0D0D0D", color: "#FFFFFF" },
};

function formatPrice(price: number, currency: string, interval: Interval): string {
  const symbol = currency.toUpperCase() === "USD" ? "$" : currency;
  const suffix = interval === "MONTHLY" ? "/mo" : "/yr";
  return `${symbol}${price}${suffix}`;
}

export function PlanCard({
  planId,
  name,
  price,
  interval,
  currency,
  features,
  isCurrent,
  isGrandfathered = false,
  onChangePlan,
}: PlanCardProps) {
  const badge = PLAN_BADGE[planId];

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-6",
        isCurrent ? "border-[var(--color-primary)]" : "border-[#E8E8E8]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {name}
          </span>
          {isCurrent && (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: "#FEF2F2", color: "var(--color-primary)" }}
            >
              Current Plan
            </span>
          )}
          {isGrandfathered && (
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
            >
              Legacy pricing
            </span>
          )}
        </div>
      </div>

      <div className="mt-4">
        <span className="text-3xl font-bold" style={{ color: "#0D0D0D" }}>
          {formatPrice(price, currency, interval)}
        </span>
      </div>

      <ul className="mt-5 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm" style={{ color: "#0D0D0D" }}>
            <span style={{ color: "#22C55E" }}>&#10003;</span>
            {feature}
          </li>
        ))}
      </ul>

      {!isCurrent && onChangePlan && (
        <button
          onClick={onChangePlan}
          className="mt-6 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Change Plan
        </button>
      )}
      {isCurrent && (
        <div
          className="mt-6 w-full rounded-lg py-2.5 text-center text-sm font-semibold"
          style={{ backgroundColor: "#FEF2F2", color: "var(--color-primary)" }}
        >
          Active
        </div>
      )}
    </div>
  );
}
