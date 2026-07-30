"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Button as FbButton } from "flowbite-react";

export type ButtonVariant = "primary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

// flowbite-react color slots: blue = accent CTA, light = bordered neutral,
// red = destructive. The variant names stay ours so 70+ call sites hold.
const COLORS: Record<ButtonVariant, string> = {
  primary: "blue",
  ghost: "light",
  danger: "red",
};

/** The one dashboard button shape — flowbite-react Button underneath since the
 *  Flowbite migration. Use ButtonLink for navigation CTAs. */
export function Button({ variant = "primary", size = "md", className, children, ...rest }: { variant?: ButtonVariant; size?: ButtonSize; className?: string; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <FbButton color={COLORS[variant]} size={size} className={className} {...rest}>
      {children}
    </FbButton>
  );
}

/** Same shape as Button, rendered as a Next.js Link for navigation CTAs. */
export function ButtonLink({ variant = "primary", size = "md", className, children, ...rest }: { variant?: ButtonVariant; size?: ButtonSize; className?: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <FbButton as={Link} color={COLORS[variant]} size={size} className={className} {...rest}>
      {children}
    </FbButton>
  );
}
