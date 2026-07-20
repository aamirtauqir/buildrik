"use client";

import { cn } from "@lib/utils";
import { Pill, MetricValue } from "@/components/dashboard/primitives";

type PlanId = "FREE" | "PRO" | "BUSINESS";
type Interval = "MONTHLY" | "YEARLY";

export interface PlanCardProps {
  planId: PlanId;
  name: string;
  /**
   * Minor units (cents) — this is `Subscription.price`, stored straight from
   * Stripe's `unit_amount`. Named for the unit because rendering it raw
   * printed "$2900/mo" on a $29 plan; the value read 0 for every workspace
   * until real subscriptions existed, so the bug was invisible until the
   * first payment landed.
   */
  priceMinor: number;
  interval: Interval;
  currency: string;
  features: string[];
  isCurrent: boolean;
  isGrandfathered?: boolean;
  onChangePlan?: () => void;
}

function formatPrice(priceMinor: number, currency: string, interval: Interval): string {
  const symbol = currency.toUpperCase() === "USD" ? "$" : `${currency.toUpperCase()} `;
  const suffix = interval === "MONTHLY" ? "/mo" : "/yr";
  const major = priceMinor / 100;
  // Whole amounts stay "$29", not "$29.00" — plan pricing is whole-dollar.
  const amount = Number.isInteger(major) ? String(major) : major.toFixed(2);
  return `${symbol}${amount}${suffix}`;
}

export function PlanCard({
  name,
  priceMinor,
  interval,
  currency,
  features,
  isCurrent,
  isGrandfathered = false,
  onChangePlan,
}: PlanCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6",
        isCurrent ? "border-[var(--color-primary)]" : "border-[var(--color-border-default)]"
      )}
      style={{ backgroundColor: "var(--color-bg-surface)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Pill tone="neutral">{name}</Pill>
          {isCurrent && <Pill tone="accent">Current Plan</Pill>}
          {isGrandfathered && <Pill tone="warning">Legacy pricing</Pill>}
        </div>
      </div>

      <div className="mt-4">
        <span className="text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          <MetricValue>{formatPrice(priceMinor, currency, interval)}</MetricValue>
        </span>
      </div>

      <ul className="mt-5 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-body" style={{ color: "var(--color-text-primary)" }}>
            <span style={{ color: "var(--color-success)" }}>&#10003;</span>
            {feature}
          </li>
        ))}
      </ul>

      {!isCurrent && onChangePlan && (
        <button
          onClick={onChangePlan}
          className="mt-6 w-full rounded-lg py-2.5 text-body font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Change Plan
        </button>
      )}
      {isCurrent && (
        <div
          className="mt-6 w-full rounded-lg py-2.5 text-center text-body font-semibold"
          style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}
        >
          Active
        </div>
      )}
    </div>
  );
}
