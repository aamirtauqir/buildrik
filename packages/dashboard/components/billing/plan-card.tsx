"use client";

import { cn } from "@lib/utils";
import { Pill, MetricValue } from "@/components/dashboard/primitives";

type PlanId = "FREE" | "PRO" | "BUSINESS";
/**
 * `Subscription.interval` is a plain String column with no DB constraint, and
 * Stripe's own vocabulary for the same idea is "month"/"year". Accept both, so
 * a row carrying Stripe's spelling can't be mistaken for the other period.
 */
type Interval = string;

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
}

/**
 * "/mo" or "/yr" — or "" when the stored interval matches neither vocabulary.
 * This was `interval === "MONTHLY" ? "/mo" : "/yr"`, which fails OPEN on a
 * money figure: a row holding Stripe's "month" printed "$79/yr" on a $79/month
 * subscription, telling the customer they pay 12× less than they do. An
 * unrecognised period is printed as no period at all — "$79" is incomplete,
 * "$79/yr" is wrong.
 */
function intervalSuffix(interval: Interval): string {
  switch (interval.trim().toUpperCase()) {
    case "MONTHLY":
    case "MONTH":
      return "/mo";
    case "YEARLY":
    case "YEAR":
    case "ANNUAL":
      return "/yr";
    default:
      return "";
  }
}

function formatPrice(priceMinor: number, currency: string, interval: Interval): string {
  const symbol = currency.toUpperCase() === "USD" ? "$" : `${currency.toUpperCase()} `;
  const suffix = intervalSuffix(interval);
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
}: PlanCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-6",
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

      {/* No CTA. This component has one call site (billing/page.tsx) and it
          passes `isCurrent` unconditionally, so a `{!isCurrent && ...}` branch
          could never render — it was dead code holding a live `Button` import.
          The plan-change door is the "View Plans" action on the title row. */}
      {/* No "Active" block. It was a div painted as a full-width primary
          button — the largest, most button-shaped thing on the Billing screen,
          and it did nothing. The card already says the same thing twice above:
          the accent "Current Plan" pill on the title row. */}
    </div>
  );
}
