import type { ReactNode } from "react";
import { cn } from "@lib/utils";

/** UI kit §4 — Colored icon chip. The accent at low alpha behind a solid-accent
 *  glyph. `color` is any CSS colour (usually a `var(--color-*)` categorical
 *  token or a per-brand hex); it is decorative only, never an action colour. */
export function IconChip({
  color = "var(--color-primary)",
  size = "md",
  children,
  className,
}: {
  color?: string;
  /** md = 40px (standalone tiles), sm = 36px (inside entry cards / rows) */
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md",
        size === "sm" ? "h-9 w-9" : "h-10 w-10",
        className
      )}
      style={{ backgroundColor: `color-mix(in srgb, ${color} 13%, white)`, color }}
    >
      {children}
    </span>
  );
}
