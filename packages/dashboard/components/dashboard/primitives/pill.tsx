import type { ReactNode } from "react";
import { cn } from "@lib/utils";

export type PillTone = "neutral" | "success" | "warning" | "error" | "accent";

const TONES: Record<PillTone, { bg: string; color: string }> = {
  neutral: { bg: "var(--color-bg-subtle)", color: "var(--color-text-secondary)" },
  success: { bg: "#DCFCE7", color: "#166534" },
  warning: { bg: "#FEF9C3", color: "#854D0E" },
  error: { bg: "#FEF2F2", color: "var(--color-error)" },
  accent: { bg: "var(--color-primary-subtle)", color: "var(--color-primary)" },
};

/** Status/label pill. One tone system for every badge (status, plan, role,
 *  Popular, Current) — replaces the scattered inline pill styling. */
export function Pill({ tone = "neutral", children, className }: { tone?: PillTone; children: ReactNode; className?: string }) {
  const t = TONES[tone];
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-eyebrow font-medium", className)}
      style={{ backgroundColor: t.bg, color: t.color }}
    >
      {children}
    </span>
  );
}
