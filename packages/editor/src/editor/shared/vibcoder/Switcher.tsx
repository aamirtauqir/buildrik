/**
 * Vibcoder Switcher — auto-collapsing horizontal/vertical group.
 *
 * Renders the `bd-switcher` rule from src/themes/components/layouts/switcher.css.
 * Lays children in a row when container width exceeds threshold, else stacks
 * vertically. Pure CSS via flex-basis math — no JS, no media queries, no
 * @container query. Use for responsive form rows, toolbar groups that should
 * reflow on narrow rails.
 *
 * Threshold modifiers map to vendored bd-switcher--threshold-{sm|md|lg}
 * classes (320px/480px/640px). Default = "md" (omits modifier — base class
 * fallback is also 480px).
 *
 * NOTE: do not pass `bd-switcher--*` classes via the className prop. Use the
 * `threshold` prop. Manual class injection produces undefined specificity
 * stacking against the typed prop output.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type SwitcherThreshold = "sm" | "md" | "lg";

export interface SwitcherProps extends HTMLAttributes<HTMLDivElement> {
  /** Breakpoint at which row collapses to stack. Default = "md" (480px, no modifier). */
  threshold?: SwitcherThreshold;
}

export const Switcher = forwardRef<HTMLDivElement, SwitcherProps>(
  ({ threshold = "md", className, children, ...rest }, ref) => {
    const classes = [
      "bd-switcher",
      threshold !== "md" && `bd-switcher--threshold-${threshold}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
Switcher.displayName = "Switcher";
