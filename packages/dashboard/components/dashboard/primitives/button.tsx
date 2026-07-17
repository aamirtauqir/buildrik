import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@lib/utils";

export type ButtonVariant = "primary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[9px] font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-[14px] py-[11px] text-[13.5px]",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
  ghost:
    "border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]",
  danger: "bg-[var(--color-error)] text-white hover:bg-[var(--color-error-text)]",
};

function buttonClasses(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(BASE, SIZES[size], VARIANTS[variant], className);
}

type SharedProps = { variant?: ButtonVariant; size?: ButtonSize; className?: string; children: ReactNode };

/** The one dashboard button shape. Kills the per-call padding/font/hover drift
 *  (and the retired red-hover). Use ButtonLink for navigation CTAs. */
export function Button({ variant = "primary", size = "md", className, children, ...rest }: SharedProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

/** Same shape as Button, rendered as a Next.js Link for navigation CTAs. */
export function ButtonLink({ variant = "primary", size = "md", className, children, ...rest }: SharedProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
