/**
 * Vibcoder Tooltip wrapper — small dark hover affordance.
 * Renders the bd-tooltip composite from
 * src/themes/components/molecules/popover.css (one CSS file ships three
 * conceptually distinct molecules — Popover + Tooltip + Menu — split into
 * three wrapper files per the Phase 2 plan).
 *
 * Slot composition (Contract A from Phase 2 design):
 *   children  variable content slot — short label OR a composition of
 *             TooltipTitle + TooltipDesc + TooltipKbd siblings
 *
 * Always-rendered. Tooltip ships NO open / onOpenChange (different from
 * Popover): the caller controls visibility via show/hide CSS, conditional
 * render at the call site, or a Phase 3 hover-intent organism. Phase 2
 * keeps this a pure presentation surface.
 *
 * Variants from `vibcoder-variants.mjs molecules/popover` (filtered to
 * bd-tooltip):
 *   variants: multiline (white-space: normal, max-width: 220px,
 *             padding: 8px 10px — for two-line tooltips)
 *
 * Sibling exports (Contract C):
 *   Tooltip       bd-tooltip surface (single-line by default)
 *   TooltipTitle  bd-tooltip__title — semibold heading line (use with
 *                 multiline tooltip when paired with TooltipDesc)
 *   TooltipDesc   bd-tooltip__desc — muted body text (multiline only)
 *   TooltipKbd    bd-tooltip__kbd — inline keyboard shortcut chip
 *
 * forwardRef on every export — Tooltip root is anchor measurement target;
 * sibling spans are visual only but still expose ref for symmetry.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, type ReactNode, forwardRef } from "react";

export interface TooltipProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  /** Toggles the --multiline CSS variant (wraps + widens padding). */
  multiline?: boolean;
  children: ReactNode;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ multiline, className, children, ...rest }, ref) => {
    const classes = [
      "bd-tooltip",
      multiline && "bd-tooltip--multiline",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <div ref={ref} role="tooltip" className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
Tooltip.displayName = "Tooltip";

export type TooltipTitleProps = HTMLAttributes<HTMLSpanElement>;

export const TooltipTitle = forwardRef<HTMLSpanElement, TooltipTitleProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-tooltip__title", className].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
TooltipTitle.displayName = "TooltipTitle";

export type TooltipDescProps = HTMLAttributes<HTMLSpanElement>;

export const TooltipDesc = forwardRef<HTMLSpanElement, TooltipDescProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-tooltip__desc", className].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
TooltipDesc.displayName = "TooltipDesc";

export type TooltipKbdProps = HTMLAttributes<HTMLSpanElement>;

export const TooltipKbd = forwardRef<HTMLSpanElement, TooltipKbdProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-tooltip__kbd", className].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
TooltipKbd.displayName = "TooltipKbd";
