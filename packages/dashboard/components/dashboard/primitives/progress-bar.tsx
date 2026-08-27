import { Progress } from "flowbite-react";
import { cn } from "@lib/utils";

type ProgressTone = "accent" | "success" | "warning" | "error";

const COLORS: Record<ProgressTone, string> = {
  accent: "blue",
  success: "green",
  warning: "yellow",
  error: "red",
};

/** Single progress bar for usage / getting-started / partner / sidebar meters —
 *  flowbite-react Progress underneath. Auto-escalates to warning/error near the
 *  cap when tone="auto". size="lg" is the page-level weight. */
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
  return (
    /* The fill colour comes from flowbite's theme, not from className — the bar
       is an inner element. Stock progressTheme.color.blue is bg-blue-600
       (#1C64F2), which is a SECOND blue: DESIGN.md's accent section is titled
       "the guard against a second blue" and names #1A56DB. Measured live on
       /dashboard/settings/usage before the fix: rgb(28, 100, 242). */
    <Progress
      progress={clamped}
      color={COLORS[resolved]}
      size={size === "lg" ? "md" : "sm"}
      className={cn("w-full", className)}
      theme={{ color: { blue: "tw:bg-[var(--color-primary)]" } }}
    />
  );
}
