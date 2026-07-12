import type { ReactNode } from "react";
import { cn } from "@lib/utils";

/** Numeric/data value in mono with tabular figures. Wrap every count, $, size,
 *  seat, or date display so data typography is consistent (dc: Geist Mono). */
export function MetricValue({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono tabular-nums", className)}>{children}</span>;
}
