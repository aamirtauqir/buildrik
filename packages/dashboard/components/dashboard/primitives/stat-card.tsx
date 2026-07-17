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
        <p className="text-[10.5px] font-bold uppercase tracking-[0.07em]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
        {visual ? (
          <div className="shrink-0">{visual}</div>
        ) : icon ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>{icon}</span>
        ) : null}
      </div>
      <p
        className={cn("mt-[7px] text-[27px] leading-none tracking-[-0.02em]", mono && "tabular-nums")}
        style={{ color: "var(--color-text-primary)", fontWeight: 730 }}
      >{value}</p>
      {delta && <div className="mt-[5px] text-[12px]" style={{ color: "var(--color-text-secondary)" }}>{delta}</div>}
    </>
  );
  // Artifact stat tile: 10px radius, 15/16/13 padding, subtle two-stop card shadow.
  const cardStyle = {
    borderColor: "var(--color-border-default)",
    backgroundColor: "var(--color-bg-surface)",
    borderRadius: "10px",
    padding: "15px 16px 13px",
    boxShadow: "0 1px 2px rgba(15,23,41,.04), 0 1px 3px rgba(15,23,41,.05)",
  };
  if (href) {
    return (
      <Link href={href} className={cn("block border transition-colors hover:border-[var(--color-primary)]", className)} style={cardStyle}>{inner}</Link>
    );
  }
  return <div className={cn("border", className)} style={cardStyle}>{inner}</div>;
}
