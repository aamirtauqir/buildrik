"use client";

import { ProgressBar, MetricValue } from "@/components/dashboard/primitives";

export interface UsageItem {
  label: string;
  used: number;
  limit: number;
  unit?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

const DEFAULT_USAGE_ITEMS: Pick<UsageItem, "label" | "ctaLabel" | "ctaHref">[] = [
  { label: "Sites", ctaLabel: "Create site", ctaHref: "/dashboard/sites/new" },
  { label: "Bandwidth", ctaLabel: "View usage", ctaHref: "/dashboard/settings/billing" },
  { label: "Team members", ctaLabel: "Invite member", ctaHref: "/dashboard/settings/team" },
  { label: "Custom domains", ctaLabel: "Connect domain", ctaHref: "/dashboard/domains" },
  { label: "Storage", ctaLabel: "Manage files", ctaHref: "/dashboard/settings/billing" },
  { label: "AI credits", ctaLabel: "View usage", ctaHref: "/dashboard/settings/billing" },
  { label: "Form submissions", ctaLabel: "View forms", ctaHref: "/dashboard/forms" },
  { label: "Redirects", ctaLabel: "Manage redirects", ctaHref: "/dashboard/redirects" },
];

interface UsageBarsProps {
  items: UsageItem[];
}

function formatValue(value: number, unit?: string): string {
  if (!unit) return String(value);
  return `${value} ${unit}`;
}

function BarItem({ item }: { item: UsageItem }) {
  const pct = item.limit === 0 ? 0 : Math.min(100, Math.round((item.used / item.limit) * 100));

  const defaultCta = DEFAULT_USAGE_ITEMS.find((d) => d.label === item.label);
  const ctaLabel = item.ctaLabel ?? defaultCta?.ctaLabel;
  const ctaHref = item.ctaHref ?? defaultCta?.ctaHref;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          {item.label}
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          <MetricValue>{formatValue(item.used, item.unit)}</MetricValue> / <MetricValue>{formatValue(item.limit, item.unit)}</MetricValue>
        </span>
      </div>
      <ProgressBar pct={pct} tone="auto" />
      {ctaLabel && ctaHref && (
        <a
          href={ctaHref}
          className="mt-1 inline-block text-xs font-medium underline-offset-2 hover:underline"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {ctaLabel}
        </a>
      )}
    </div>
  );
}

export function UsageBars({ items }: UsageBarsProps) {
  return (
    <div className="space-y-5">
      {items.map((item) => (
        <BarItem key={item.label} item={item} />
      ))}
    </div>
  );
}
