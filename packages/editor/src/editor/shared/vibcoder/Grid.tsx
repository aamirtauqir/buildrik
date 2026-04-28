/**
 * Vibcoder Grid — CSS grid primitive.
 *
 * Renders the `bd-grid` rule from src/themes/components/layouts/grid.css.
 * Lays children in a fixed-column or auto-fit responsive grid with
 * token-driven gap. Replaces ad-hoc `display:grid; grid-template-columns:
 * repeat(N, 1fr); gap:Npx` patterns across editor chrome — asset libraries,
 * template galleries, card decks, settings columns.
 *
 * For vertical lists use the sibling Stack primitive. For horizontal
 * wrapping groups use Cluster. For both-axes centering use Center.
 *
 * `cols` is REQUIRED — the vendored `.bd-grid` base class ships no
 * grid-template-columns, so an unspecified `cols` would render as a
 * 1-column grid (rarely intentional).
 *
 * Numeric `cols` (2 | 3 | 4 | 6 | 12) emits `bd-grid--cols-N` (canonical).
 * `cols="auto"` emits `bd-grid--auto` (auto-fit responsive, hardcoded
 * minmax(220px, 1fr) in vendored CSS — not configurable from props).
 *
 * Gap modifiers map to vendored bd-grid--{xs|sm|md|lg|xl} classes.
 * Default = "md" (omits modifier — base class has space-3 gap).
 *
 * `dense` enables `bd-grid--dense` for ragged item heights via
 * grid-auto-flow: dense.
 *
 * NOTE: do not pass `bd-grid--*` classes via the className prop. Use the
 * `cols`, `gap`, and `dense` props. Manual class injection produces
 * undefined specificity stacking against the typed prop output. Legacy
 * aliases (`bd-grid--2/3/4`) are preserved upstream for back-compat but
 * the wrapper only emits canonical `--cols-N` forms.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type GridGap = "xs" | "sm" | "md" | "lg" | "xl";
export type GridCols = 2 | 3 | 4 | 6 | 12 | "auto";

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /** Required. Numeric → bd-grid--cols-N; "auto" → bd-grid--auto (responsive). */
  cols: GridCols;
  /** Token gap. Default = "md" (no modifier — base class has space-3). */
  gap?: GridGap;
  /** When true, applies bd-grid--dense (dense packing). */
  dense?: boolean;
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ cols, gap = "md", dense = false, className, children, ...rest }, ref) => {
    const colsClass = cols === "auto" ? "bd-grid--auto" : `bd-grid--cols-${cols}`;
    const classes = [
      "bd-grid",
      colsClass,
      gap !== "md" && `bd-grid--${gap}`,
      dense && "bd-grid--dense",
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
Grid.displayName = "Grid";
