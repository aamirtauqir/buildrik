"use client";

import Link from "next/link";
import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Button as FbButton } from "flowbite-react";
import { cn } from "@lib/utils";

export type ButtonVariant = "primary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

// flowbite-react color slots: blue = accent CTA, light = bordered neutral,
// red = destructive. The variant names stay ours so 70+ call sites hold.
const COLORS: Record<ButtonVariant, string> = {
  primary: "blue",
  ghost: "light",
  danger: "red",
};

/**
 * `ghost` is flowbite's `light`: a BORDERED WHITE button, and it stays that way
 * — 78 call sites depend on the meaning.
 *
 * What was wrong is its hover. flowbite ships `hover:bg-gray-100` = #F3F4F6,
 * which is EXACTLY `--color-bg-page` (and `--color-bg-subtle`, which holds the
 * same value). So a white bordered button sitting on the page background
 * disappeared into it on hover — backwards from what a hover is for. Repointed
 * at `--color-bg-hover`, one step further down the ramp and distinct from both
 * surfaces. Measured: rest #FFFFFF -> hover #E5E7EB.
 *
 * A third, TRANSPARENT neutral variant was considered and rejected on the
 * numbers. 48 call sites hand-roll `hover:bg-[var(--color-bg-subtle)]`, which
 * looked like demand for one — but every single one is a `w-full` menu row or
 * list item, not a standalone button. Zero standalone transparent buttons
 * exist. Adding the variant would have shipped a surface with no door.
 */
const VARIANT_OVERRIDES: Record<ButtonVariant, string> = {
  primary: "",
  ghost: "tw:hover:bg-[var(--color-bg-hover)]",
  danger: "",
};

/**
 * Focus ring, shared by both exports.
 *
 * flowbite ships `focus:ring-4` with a per-colour ring: blue-300 for primary,
 * and **gray-100 (#F3F4F6) for `light`**, which is what `ghost` maps to.
 * Measured on /dashboard/settings/team: the ghost focus ring computed to
 * `rgb(243,244,246) 0 0 0 4px` — about 1.1:1 against the white card it sits on.
 * WCAG 1.4.11 wants 3:1 for a focus indicator, so the keyboard ring on every
 * secondary button in the dashboard was effectively invisible.
 *
 * DESIGN.md specifies a soft 2px accent ring. One accent ring for all three
 * variants, and `focus-visible` rather than `focus` so a mouse click does not
 * flash a halo — the chrome steps out of the way.
 */
const FOCUS_RING =
  "tw:focus:ring-0 tw:focus-visible:outline-none " +
  "tw:focus-visible:ring-2 tw:focus-visible:ring-[rgba(26,86,219,0.30)]";

/** The one dashboard button shape — flowbite-react Button underneath since the
 *  Flowbite migration. Use ButtonLink for navigation CTAs. */
/* forwardRef, because a popover / dropdown / tooltip trigger needs the node.
   Without it every such trigger had to stay a raw <button> — which is one more
   reason screens hand-rolled instead of composing. */
export const Button = forwardRef<
  HTMLButtonElement,
  { variant?: ButtonVariant; size?: ButtonSize; className?: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>
>(({ variant = "primary", size = "md", className, children, ...rest }, ref) => (
  <FbButton ref={ref} color={COLORS[variant]} size={size} className={cn(FOCUS_RING, VARIANT_OVERRIDES[variant], className)} {...rest}>
    {children}
  </FbButton>
));
Button.displayName = "Button";

/** Same shape as Button, rendered as a Next.js Link for navigation CTAs. */
export function ButtonLink({ variant = "primary", size = "md", className, children, ...rest }: { variant?: ButtonVariant; size?: ButtonSize; className?: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <FbButton as={Link} color={COLORS[variant]} size={size} className={cn(FOCUS_RING, VARIANT_OVERRIDES[variant], className)} {...rest}>
      {children}
    </FbButton>
  );
}
