/**
 * Vibcoder Cluster — horizontal wrapping group primitive.
 *
 * Renders the `bd-cluster` rule from src/themes/components/layouts/cluster.css.
 * Lays children in a row with flex-wrap; ideal for toolbars, tag rows,
 * action groups, breadcrumb segments. Replaces ad-hoc
 * `display:flex; flex-wrap:wrap; gap:Npx` patterns across editor chrome.
 *
 * Horizontal-by-default. For vertical layouts, use the sibling Stack
 * primitive.
 *
 * Gap modifiers map to vendored bd-cluster--{xs|sm|md|lg|xl} classes.
 * Default = "md" (omits modifier — base class has space-3 gap).
 *
 * Align modifiers map to vendored bd-cluster--align-{start|center|end|
 * baseline|stretch} classes. Default = "center" (omits modifier — base
 * class has align-items: center).
 *
 * NOTE: do not pass `bd-cluster--*` classes via the className prop. Use
 * the `gap` and `align` props. Manual class injection produces undefined
 * specificity stacking against the typed prop output.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type ClusterGap = "xs" | "sm" | "md" | "lg" | "xl";
export type ClusterAlign = "start" | "center" | "end" | "baseline" | "stretch";

export interface ClusterProps extends HTMLAttributes<HTMLDivElement> {
  /** Token gap. Default = "md" (no modifier). */
  gap?: ClusterGap;
  /** Cross-axis alignment. Default = "center" (no modifier). */
  align?: ClusterAlign;
}

export const Cluster = forwardRef<HTMLDivElement, ClusterProps>(
  ({ gap = "md", align = "center", className, children, ...rest }, ref) => {
    const classes = [
      "bd-cluster",
      gap !== "md" && `bd-cluster--${gap}`,
      align !== "center" && `bd-cluster--align-${align}`,
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
Cluster.displayName = "Cluster";
