import type { ReactNode } from "react";
import { cn } from "@lib/utils";

export type PillTone = "neutral" | "success" | "warning" | "error" | "accent";

const TONES: Record<PillTone, { bg: string; color: string }> = {
  neutral: { bg: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" },
  success: { bg: "var(--color-success-subtle)", color: "var(--color-success-text)" },
  warning: { bg: "var(--color-warning-subtle)", color: "var(--color-warning-text)" },
  error: { bg: "var(--color-error-subtle)", color: "var(--color-error-text)" },
  accent: { bg: "var(--color-primary-subtle)", color: "var(--color-primary)" },
};

/** Status/label pill. One tone system for every badge (status, plan, role,
 *  Popular, Current) — replaces the scattered inline pill styling. */
export function Pill({ tone = "neutral", children, className }: { tone?: PillTone; children: ReactNode; className?: string }) {
  const t = TONES[tone];
  return (
    <span
      // UI kit §4 — Status pill: 11px / 600, radius-pill, padding 3px 9px.
      className={cn("inline-flex items-center gap-1 rounded-pill px-[9px] py-[3px] text-eyebrow font-semibold", className)}
      style={{ backgroundColor: t.bg, color: t.color }}
    >
      {children}
    </span>
  );
}
