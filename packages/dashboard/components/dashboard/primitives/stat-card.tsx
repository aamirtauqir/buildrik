import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@lib/utils";

/** Labelled metric tile: eyebrow label + big mono value + optional delta.
 *  `icon` renders a small accent tile (top-right); `visual` renders any node
 *  (donut/sparkline/avatars) top-right instead. `href` makes the whole card a
 *  link. One StatCard for the whole app. */
export function StatCard({
  label,
  value,
  delta,
  icon,
  visual,
  href,
  mono = true,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  icon?: ReactNode;
  visual?: ReactNode;
  href?: string;
  mono?: boolean;
  className?: string;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-eyebrow uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>{label}</p>
        {visual ? (
          <div className="shrink-0">{visual}</div>
        ) : icon ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>{icon}</span>
        ) : null}
      </div>
      <p className={cn("mt-1.5 text-metric", mono && "font-mono tabular-nums")} style={{ color: "var(--color-text-primary)" }}>{value}</p>
      {delta && <div className="mt-0.5 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{delta}</div>}
    </>
  );
  const cardStyle = { borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" };
  if (href) {
    return (
      <Link href={href} className={cn("block rounded-xl border p-4 transition-colors hover:border-[var(--color-primary)]", className)} style={cardStyle}>{inner}</Link>
    );
  }
  return <div className={cn("rounded-xl border p-4", className)} style={cardStyle}>{inner}</div>;
}
