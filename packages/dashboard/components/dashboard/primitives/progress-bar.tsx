import { cn } from "@lib/utils";

type ProgressTone = "accent" | "success" | "warning" | "error";

/** Single progress bar for usage / getting-started / partner / sidebar meters.
 *  Auto-escalates to warning/error near the cap when tone="auto".
 *  The design draws two weights: 6px for compact meters (sidebar, cards) and
 *  8px for a page-level progress bar — size="lg". */
export function ProgressBar({
  pct,
  tone = "accent",
  size = "md",
  className,
}: {
  pct: number;
  tone?: ProgressTone | "auto";
  size?: "md" | "lg";
  className?: string;
}) {
  const clamped = Math.min(Math.max(pct, 0), 100);
  const resolved: ProgressTone = tone === "auto" ? (clamped >= 85 ? "error" : clamped >= 60 ? "warning" : "accent") : tone;
  const color =
    resolved === "error" ? "var(--color-error)" : resolved === "warning" ? "var(--color-warning)" : resolved === "success" ? "var(--color-success)" : "var(--color-primary)";
  return (
    <div className={cn(size === "lg" ? "h-2" : "h-1.5", "w-full overflow-hidden rounded-pill", className)} style={{ backgroundColor: "var(--color-bg-subtle)" }}>
      <div className="h-full rounded-pill transition-all" style={{ width: `${clamped}%`, backgroundColor: color }} />
    </div>
  );
}
