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
    /* These overrides MUST carry the tw: prefix. Unprefixed, they lose to
       flowbite's own prefixed base classes (badgeTheme sets tw:flex,
       tw:px-2 tw:py-0.5, tw:text-xs) and the pill rendered as a 4px-radius
       12px box: not inline, not a pill, and never the 11px eyebrow the DS
       text ramp specifies. Measured in the browser, not read. `text-eyebrow`
       cannot be used here at all — it is a globals.css @theme token, and
       tw-flowbite.css compiles against the stock Tailwind theme. */
    <Badge
      color={COLORS[tone]}
      className={cn(
        "tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:px-[9px] tw:py-[3px] tw:text-[11px] tw:font-semibold",
        className,
      )}
    >
      {children}
    </Badge>
  );
}
