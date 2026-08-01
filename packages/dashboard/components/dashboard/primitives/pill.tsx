import type { ReactNode } from "react";
import { Badge } from "flowbite-react";
import { cn } from "@lib/utils";

export type PillTone = "neutral" | "success" | "warning" | "error" | "accent";

const COLORS: Record<PillTone, string> = {
  neutral: "gray",
  success: "green",
  warning: "yellow",
  error: "red",
  accent: "blue",
};

/** Status/label pill — flowbite-react Badge underneath. One tone system for
 *  every badge (status, plan, role, Popular, Current). */
export function Pill({ tone = "neutral", children, className }: { tone?: PillTone; children: ReactNode; className?: string }) {
  return (
    <Badge color={COLORS[tone]} className={cn("inline-flex items-center gap-1 rounded-full px-[9px] py-[3px] text-eyebrow", className)}>
      {children}
    </Badge>
  );
}
