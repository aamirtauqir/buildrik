"use client";

import { cn } from "@lib/utils";

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

function barColor(pct: number): string {
  if (pct >= 85) return "#EF4444";
  if (pct >= 60) return "#EAB308";
  return "#3B82F6";
}

function formatValue(value: number, unit?: string): string {
  if (!unit) return String(value);
  return `${value} ${unit}`;
}

function BarItem({ item }: { item: UsageItem }) {
  const pct = item.limit === 0 ? 0 : Math.min(100, Math.round((item.used / item.limit) * 100));
  const color = barColor(pct);
  const isNearLimit = pct >= 60;

  const defaultCta = DEFAULT_USAGE_ITEMS.find((d) => d.label === item.label);
  const ctaLabel = item.ctaLabel ?? defaultCta?.ctaLabel;
  const ctaHref = item.ctaHref ?? defaultCta?.ctaHref;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-medium" style={{ color: "#0D0D0D" }}>
          {item.label}
        </span>
        <span className="text-xs" style={{ color: isNearLimit ? color : "#7A7A7A" }}>
          {formatValue(item.used, item.unit)} / {formatValue(item.limit, item.unit)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#E8E8E8" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {ctaLabel && ctaHref && (
        <a
          href={ctaHref}
          className="mt-1 inline-block text-xs font-medium underline-offset-2 hover:underline"
          style={{ color: "#7A7A7A" }}
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
