/**
 * Vibcoder Center — both-axes centering primitive.
 *
 * Renders the `bd-center` rule from src/themes/components/layouts/center.css.
 * Centers a single child on both axes via flexbox. Replaces ad-hoc
 * `display:flex; align-items:center; justify-content:center` patterns
 * across editor chrome — modal demo stages, empty-state mounts, loader
 * containers, "drop one thing in the middle of a region" cases.
 *
 * Presentational only — Center owns no state and no behavior; it is the
 * rendered counterpart of the vendored CSS rule. For vertical lists use
 * the sibling Stack primitive, for horizontal wrapping groups use Cluster.
 *
 * Modifiers are additive (no default-omits-modifier value):
 *   - `page`: bd-center--page (min-height: 100vh) — splash, empty app state.
 *   - `inline`: bd-center--inline (display: inline-flex) — intrinsic sizing.
 *
 * NOTE: do not pass `bd-center--*` classes via the className prop. Use the
 * `page` and `inline` props. Manual class injection produces undefined
 * specificity stacking against the typed prop output.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export interface CenterProps extends HTMLAttributes<HTMLDivElement> {
  /** When true, applies bd-center--page (min-height: 100vh). */
  page?: boolean;
  /** When true, applies bd-center--inline (display: inline-flex). */
  inline?: boolean;
}

export const Center = forwardRef<HTMLDivElement, CenterProps>(
  ({ page = false, inline = false, className, children, ...rest }, ref) => {
    const classes = [
      "bd-center",
      page && "bd-center--page",
      inline && "bd-center--inline",
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
Center.displayName = "Center";
