/**
 * Vibcoder ActionBar wrapper — sticky save/action bar molecule.
 * Renders the bd-actionbar composite from
 * src/themes/components/molecules/actionbar.css.
 *
 * Slots (from CSS):
 *   __status   left status cluster (text + status-dot)
 *   __actions  right action cluster (Button / IconButton list)
 *
 * Variant union from `vibcoder-variants.mjs molecules/actionbar`:
 *   variants: dirty, floating, inset
 *   (no sizes; no states)
 *
 * Polymorphism choice (per Phase 2 Contract D guidance): COMPOSITION.
 *   The bar is a layout shell only — caller composes <Button>, <IconButton>,
 *   <StatusDot> children inside the optional __status / __actions slot
 *   wrappers. Source CSS docstring explicitly says "Buttons inside follow
 *   their own a11y baseline; the bar is a layout shell." No item-kind enum
 *   surfaced in the bundle, so a data-driven `items={[…]}` API would invent
 *   a contract the source doesn't support.
 *
 * Sibling exports (Contract C):
 *   ActionBar         bd-actionbar — root container
 *   ActionBarStatus   bd-actionbar__status — left cluster
 *   ActionBarActions  bd-actionbar__actions — right cluster
 *
 * No __separator class exists in the vendored CSS; visual separation
 * between actions comes from the cluster's flex `gap`. Callers needing an
 * explicit divider use the Divider atom (orientation="vertical").
 *
 * No state props on the root — `dirty` is a visual variant set by the
 * caller's own state machine, not something the wrapper toggles.
 *
 * forwardRef on every export — root is a measurement consumer (sticky
 * bottom + floating positioning may need anchoring); slot wrappers may
 * anchor floating UI in Phase 3 organisms.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type ActionBarVariant = "floating" | "inset" | "dirty";

export interface ActionBarProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ActionBarVariant;
}

export const ActionBar = forwardRef<HTMLDivElement, ActionBarProps>(
  ({ variant, className, children, ...rest }, ref) => {
    const classes = [
      "bd-actionbar",
      variant && `bd-actionbar--${variant}`,
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
ActionBar.displayName = "ActionBar";

export type ActionBarStatusProps = HTMLAttributes<HTMLDivElement>;

export const ActionBarStatus = forwardRef<HTMLDivElement, ActionBarStatusProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-actionbar__status", className]
      .filter(Boolean)
      .join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
ActionBarStatus.displayName = "ActionBarStatus";

export type ActionBarActionsProps = HTMLAttributes<HTMLDivElement>;

export const ActionBarActions = forwardRef<HTMLDivElement, ActionBarActionsProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-actionbar__actions", className]
      .filter(Boolean)
      .join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
ActionBarActions.displayName = "ActionBarActions";
