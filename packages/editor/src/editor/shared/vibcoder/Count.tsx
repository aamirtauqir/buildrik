/**
 * Vibcoder Count wrapper.
 * Renders the `bd-count` class from src/themes/components/atoms/count.css —
 * the dedicated mini numeric counter slot (lighter than Badge, tabular-nums).
 *
 * Variant + size + state union from `vibcoder-variants.mjs atoms/count`:
 *   sizes: xs (14), sm (16), md (18 base — no modifier), lg (22)
 *   variants (heuristic bucketed all non-size modifiers as variants):
 *     accent, success, warning, error, ink     — tones
 *     dot                                       — modifier (renders as 8px circle)
 *     inline                                    — modifier (inherits font-size)
 *
 * The "neutral" tone is the virtual default — `.bd-count` already paints muted
 * tone (text-muted on bg-subtle). We OMIT a tone modifier when variant is unset
 * or "neutral", matching the Tag pattern.
 *
 * `dot` and `inline` are demoted to boolean props — they're orthogonal modifiers
 * (a dot can be xs/lg, an inline count can be tinted) per the vendored CSS
 * combination rules (`bd-count--dot.bd-count--xs` is legitimate composition).
 *
 * When `dot` is true, the count typically has no children — it's a status-dot
 * affordance with no number. Wrapper does not enforce this; caller owns the
 * decision (and the CSS hides text via `font-size: 0` regardless).
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type CountVariant = "neutral" | "accent" | "success" | "warning" | "error" | "ink";
export type CountSize = "xs" | "sm" | "md" | "lg";

export interface CountProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: CountVariant;
  size?: CountSize;
  /** When true, applies `bd-count--dot` (8px circle, hides text). */
  dot?: boolean;
  /** When true, applies `bd-count--inline` (inherits parent font-size). */
  inline?: boolean;
}

export const Count = forwardRef<HTMLSpanElement, CountProps>(
  (
    {
      variant = "neutral",
      size = "md",
      dot = false,
      inline = false,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const classes = [
      "bd-count",
      // neutral is the virtual base default — `.bd-count` already paints muted
      variant !== "neutral" && `bd-count--${variant}`,
      // md is base default — no `bd-count--md` rule exists in vendored CSS
      size !== "md" && `bd-count--${size}`,
      dot && "bd-count--dot",
      inline && "bd-count--inline",
      className,
    ].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  }
);
Count.displayName = "Count";
