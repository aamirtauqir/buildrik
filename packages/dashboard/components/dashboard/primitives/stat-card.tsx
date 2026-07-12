import type { ReactNode } from "react";
import { cn } from "@lib/utils";

/** Labelled metric tile: eyebrow label + big mono value + optional delta/icon.
 *  One StatCard for the whole app — replaces dashboard/stat-card, team/stat-cards,
 *  site-detail stat boxes, usage tiles, partner Metric. */
export function StatCard({
  label,
  value,
  delta,
  icon,
  mono = true,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  icon?: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border p-4", className)} style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-eyebrow uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>{label}</p>
        {icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
            {icon}
          </span>
        )}
      </div>
      <p className={cn("mt-1.5 text-metric", mono && "font-mono tabular-nums")} style={{ color: "var(--color-text-primary)" }}>{value}</p>
      {delta && <div className="mt-0.5 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{delta}</div>}
    </div>
  );
}
