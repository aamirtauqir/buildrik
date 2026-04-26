/**
 * Vibcoder Badge wrapper.
 * Renders the `bd-badge` class from src/themes/components/atoms/badge.css with
 * one of 8 status variants and an optional `__dot` child affordance.
 *
 * Variant union from `vibcoder-variants.mjs atoms/badge`:
 *   variants (REQUIRED — no neutral default):
 *     published, draft, issues, unsaved, syncing, new, premium, count
 *   NO size variants. NO state modifiers.
 *
 * Status badges have NO neutral fallback: every variant is its own meaningful
 * tone, so callers must pick. Default props are deliberately absent — TS will
 * flag missing `variant` at the call site.
 *
 * `__dot` slot exposed via boolean prop. Status badges in the chrome routinely
 * combine a tinted dot with text (e.g., "● Published"); making it a slot prop
 * keeps the BEM class out of caller JSX.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type BadgeVariant =
  | "published"
  | "draft"
  | "issues"
  | "unsaved"
  | "syncing"
  | "new"
  | "premium"
  | "count";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
  /** When true, renders a `bd-badge__dot` child before the badge text. */
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant, dot = false, className, children, ...rest }, ref) => {
    const classes = [
      "bd-badge",
      `bd-badge--${variant}`,
      className,
    ].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {dot && <span className="bd-badge__dot" />}
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";
