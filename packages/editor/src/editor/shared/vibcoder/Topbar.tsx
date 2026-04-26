/**
 * Vibcoder Topbar — editor chrome top bar (layout-only, no engine).
 *
 * Skin: bd-topbar CSS classes from src/themes/components/organisms/topbar.css.
 *
 * Sibling exports (Contract C):
 *   Topbar          — root (.bd-topbar) — role="banner"
 *   TopbarGroup     — column group (.bd-topbar__group) with `center` prop
 *                     for the centered slot (--center modifier)
 *   TopbarBrand     — brand label (.bd-topbar__brand)
 *   TopbarStatus    — status chip (.bd-topbar__status)
 *   TopbarStatusDot — status indicator dot (.bd-topbar__status-dot)
 *
 * Variants discovered via vibcoder-variants.mjs organisms/topbar:
 *   bd-topbar__group: variants = center
 *
 * Plan adaptation (Phase 3 finding for M5):
 *   Plan inventory listed `Topbar · TopbarBrand · TopbarActions`. Source CSS
 *   has no `__actions` class — instead it uses `__group` (with `--center`
 *   modifier for the middle slot), `__status`, `__status-dot`. Sibling list
 *   updated to match actual CSS. TopbarGroup gains a `center` prop to emit
 *   the `--center` modifier (default-omit: no center prop = left/right group).
 *
 * @license BSD-3-Clause
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export interface TopbarProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

export interface TopbarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Apply the bd-topbar__group--center modifier (centered slot). */
  center?: boolean;
  children?: ReactNode;
}

export interface TopbarBrandProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface TopbarStatusProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface TopbarStatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  // pure visual element; no children expected
}

export const Topbar = forwardRef<HTMLElement, TopbarProps>(
  ({ children, className, role = "banner", ...rest }, ref) => {
    const classes = ["bd-topbar", className].filter(Boolean).join(" ");
    return (
      <header ref={ref} className={classes} role={role} {...rest}>
        {children}
      </header>
    );
  },
);
Topbar.displayName = "Topbar";

export const TopbarGroup = forwardRef<HTMLDivElement, TopbarGroupProps>(
  ({ center, children, className, ...rest }, ref) => {
    const classes = [
      "bd-topbar__group",
      center && "bd-topbar__group--center",
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
TopbarGroup.displayName = "TopbarGroup";

export const TopbarBrand = forwardRef<HTMLDivElement, TopbarBrandProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-topbar__brand", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
TopbarBrand.displayName = "TopbarBrand";

export const TopbarStatus = forwardRef<HTMLDivElement, TopbarStatusProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-topbar__status", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
TopbarStatus.displayName = "TopbarStatus";

export const TopbarStatusDot = forwardRef<HTMLSpanElement, TopbarStatusDotProps>(
  ({ className, ...rest }, ref) => {
    const classes = ["bd-topbar__status-dot", className]
      .filter(Boolean)
      .join(" ");
    return <span ref={ref} className={classes} aria-hidden="true" {...rest} />;
  },
);
TopbarStatusDot.displayName = "TopbarStatusDot";
