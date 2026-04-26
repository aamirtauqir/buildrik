/**
 * Vibcoder Rail — icon-only navigation rail (layout-only, no engine).
 *
 * Skin: bd-rail CSS classes from src/themes/components/organisms/rail.css.
 *
 * Sibling exports (Contract C):
 *   Rail       — root (.bd-rail) — <nav>, supports `horizontal` prop for
 *                bd-rail--horizontal modifier (mobile bottom nav variant)
 *   RailButton — single icon button (.bd-rail__btn) with `active` prop
 *                (sets aria-current="page" + bd-rail__btn.is-on)
 *
 * Variants discovered via vibcoder-variants.mjs organisms/rail:
 *   bd-rail: variants = horizontal
 *
 * Plan adaptation (Phase 3 finding for M5):
 *   Plan inventory listed `Rail · RailGroup`. Source CSS has no `__group`
 *   class — it has `__btn` (the icon button) and a top-level `--horizontal`
 *   modifier. Sibling list: Rail + RailButton. Cross-imports: callers nest
 *   the existing vibcoder RailTile (Phase 2 molecule) inside; RailButton is
 *   the canonical bare-button for those that don't need a kbd-hint.
 *
 * @license BSD-3-Clause
 */
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";

export interface RailProps extends HTMLAttributes<HTMLElement> {
  /** Apply the bd-rail--horizontal modifier (mobile bottom-nav variant). */
  horizontal?: boolean;
  /** Default aria-label is "Editor rail". */
  "aria-label"?: string;
  children?: ReactNode;
}

export interface RailButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Active state — sets aria-current="page" + bd-rail__btn.is-on dual selector. */
  active?: boolean;
  children?: ReactNode;
}

export const Rail = forwardRef<HTMLElement, RailProps>(
  ({ horizontal, children, className, ...rest }, ref) => {
    const classes = [
      "bd-rail",
      horizontal && "bd-rail--horizontal",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    const ariaLabel = rest["aria-label"] ?? "Editor rail";
    return (
      <nav ref={ref} className={classes} aria-label={ariaLabel} {...rest}>
        {children}
      </nav>
    );
  },
);
Rail.displayName = "Rail";

export const RailButton = forwardRef<HTMLButtonElement, RailButtonProps>(
  ({ active, children, className, type = "button", ...rest }, ref) => {
    const classes = ["bd-rail__btn", className].filter(Boolean).join(" ");
    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        aria-current={active ? "page" : undefined}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
RailButton.displayName = "RailButton";
