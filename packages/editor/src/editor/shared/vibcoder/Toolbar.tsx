/**
 * Vibcoder Toolbar wrapper — bordered chip-cluster strip.
 * Renders the bd-toolbar composite from
 * src/themes/components/molecules/toolbar.css.
 *
 * Slot composition (Contract A from Phase 2 design):
 *   children  caller composes mixed item types — Button / IconButton /
 *             ToolbarGroup / ToolbarLabel / ToolbarSpacer / SearchInput /
 *             Tabs etc. The bar adds NO visual styling for its children;
 *             its job is layout (wrap, gap, align), framing, optional
 *             group separators.
 *
 * Sub-component manifest (Contract C — sibling exports per Phase 2 spec).
 *   The CSS file ships three named sub-elements; each gets a sibling export
 *   so callers compose them by name (grep-able, tree-shakable, no new
 *   patterns vs Phase 1):
 *     Toolbar         bd-toolbar — root <div role="toolbar">
 *     ToolbarGroup    bd-toolbar__group — inline cluster of related controls
 *                     (CSS auto-adds left-border on adjacent groups via
 *                     `.bd-toolbar__group + .bd-toolbar__group`)
 *     ToolbarLabel    bd-toolbar__label — uppercase muted micro-label
 *                     (e.g. "FILTER", "SORT") for use inside a __group
 *     ToolbarSpacer   bd-toolbar__spacer — flex spacer to push trailing
 *                     groups to the right
 *
 * Polymorphism choice (per Phase 2 Contract D guidance): COMPOSITION.
 *   Items are heterogeneous (search box, button group, label+pill cluster,
 *   etc.) and the source CSS docstring says "the toolbar adds NO visual
 *   styling for its children — its job is layout". A data-driven `items={…}`
 *   API would force a discriminated union over every possible child kind
 *   for zero ergonomic gain. Caller composes children explicitly.
 *
 * Variant union from `vibcoder-variants.mjs molecules/toolbar`:
 *   variants: dense, floating, inset
 *   sizes:    sm
 *
 * No state props on the bar itself — children own their own hover / focus
 * (per CSS docstring: "the bar itself has no hover / focus state. Children
 * own theirs.").
 *
 * forwardRef on every export — root for sticky-position consumers,
 * group/label/spacer for symmetry with the Card / Tooltip sibling pattern.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type ToolbarSize = "sm";
export type ToolbarVariant = "dense" | "floating" | "inset";

export interface ToolbarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  size?: ToolbarSize;
  variant?: ToolbarVariant;
}

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(
  ({ size, variant, className, children, ...rest }, ref) => {
    const classes = [
      "bd-toolbar",
      size && `bd-toolbar--${size}`,
      variant && `bd-toolbar--${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <div ref={ref} role="toolbar" className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
Toolbar.displayName = "Toolbar";

export type ToolbarGroupProps = HTMLAttributes<HTMLDivElement>;

export const ToolbarGroup = forwardRef<HTMLDivElement, ToolbarGroupProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-toolbar__group", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
ToolbarGroup.displayName = "ToolbarGroup";

export type ToolbarLabelProps = HTMLAttributes<HTMLSpanElement>;

export const ToolbarLabel = forwardRef<HTMLSpanElement, ToolbarLabelProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-toolbar__label", className].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
ToolbarLabel.displayName = "ToolbarLabel";

export type ToolbarSpacerProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
>;

export const ToolbarSpacer = forwardRef<HTMLSpanElement, ToolbarSpacerProps>(
  ({ className, ...rest }, ref) => {
    const classes = ["bd-toolbar__spacer", className].filter(Boolean).join(" ");
    return <span ref={ref} aria-hidden="true" className={classes} {...rest} />;
  },
);
ToolbarSpacer.displayName = "ToolbarSpacer";
