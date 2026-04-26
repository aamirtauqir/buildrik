/**
 * Vibcoder NotificationCenter — persistent notification panel (380px wide).
 *
 * IMPORTANT — plan adaptation (Phase 3 finding for M5):
 *   The plan code-block in §T2.C designed this as a Radix.Toast queue
 *   (Provider + Viewport + Root with `tone` variants info/success/warning/danger).
 *   The actual vendored notification-center.css is NOT a toast queue — it's a
 *   persistent dropdown notification panel composed of:
 *     - bd-nc (root, 380px wide)
 *     - bd-nc__tabs / bd-nc__tab (tab strip)
 *     - bd-nc__body / bd-nc__group / bd-nc__group-label (body w/ day grouping)
 *     - bd-nc__mark (mark-all-read action)
 *     - bd-nc__foot (footer CTA link)
 *   It composes other vibcoder primitives (SurfaceHead, ListRow, Avatar, Count)
 *   for its head + items rather than defining them itself.
 *
 *   Per plan reminder #1 (variants script is source of truth) — the wrapper
 *   matches the ACTUAL CSS, not the plan's toast-queue misreading. There's no
 *   `tone` variant in CSS; no `bd-notification--info` etc. Radix.Toast is NOT
 *   used. This becomes a layout-only organism (no engine, no portal, no
 *   always-controlled state — Contracts B + E3 + E5 do not apply).
 *
 * Skin: bd-nc CSS classes from src/themes/components/organisms/notification-center.css.
 *
 * Sibling exports (Contract C):
 *   NotificationCenter      — root panel (.bd-nc)
 *   NotificationCenterMark  — mark-all-read text button (.bd-nc__mark)
 *   NotificationCenterTabs  — tab strip container (.bd-nc__tabs)
 *   NotificationCenterTab   — single tab button (.bd-nc__tab); supports `active` prop
 *   NotificationCenterBody  — scrollable body (.bd-nc__body)
 *   NotificationCenterGroup — day grouping (.bd-nc__group) with optional `label`
 *   NotificationCenterFoot  — footer CTA (.bd-nc__foot)
 *
 * Composes Phase 1 atoms / Phase 2 molecules per Contract D — callers nest
 * SurfaceHead inside NotificationCenter for the head, ListRow + Avatar inside
 * NotificationCenterGroup for items.
 *
 * @license BSD-3-Clause
 */
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export interface NotificationCenterProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface NotificationCenterMarkProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export interface NotificationCenterTabsProps
  extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface NotificationCenterTabProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Active state — sets aria-selected="true" + bd-nc__tab.is-on dual selector. */
  active?: boolean;
  children: ReactNode;
}

export interface NotificationCenterBodyProps
  extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface NotificationCenterGroupProps
  extends HTMLAttributes<HTMLDivElement> {
  /** Day-grouping label (e.g. "Today", "Yesterday"). Renders inside .bd-nc__group-label. */
  label?: ReactNode;
  children?: ReactNode;
}

export interface NotificationCenterFootProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export const NotificationCenter = forwardRef<
  HTMLDivElement,
  NotificationCenterProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-nc", className].filter(Boolean).join(" ");
  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});
NotificationCenter.displayName = "NotificationCenter";

export const NotificationCenterMark = forwardRef<
  HTMLButtonElement,
  NotificationCenterMarkProps
>(({ children, className, type = "button", ...rest }, ref) => {
  const classes = ["bd-nc__mark", className].filter(Boolean).join(" ");
  return (
    <button ref={ref} type={type} className={classes} {...rest}>
      {children}
    </button>
  );
});
NotificationCenterMark.displayName = "NotificationCenterMark";

export const NotificationCenterTabs = forwardRef<
  HTMLDivElement,
  NotificationCenterTabsProps
>(({ children, className, role = "tablist", ...rest }, ref) => {
  const classes = ["bd-nc__tabs", className].filter(Boolean).join(" ");
  return (
    <div ref={ref} className={classes} role={role} {...rest}>
      {children}
    </div>
  );
});
NotificationCenterTabs.displayName = "NotificationCenterTabs";

export const NotificationCenterTab = forwardRef<
  HTMLButtonElement,
  NotificationCenterTabProps
>(({ active, children, className, type = "button", role = "tab", ...rest }, ref) => {
  const classes = ["bd-nc__tab", className].filter(Boolean).join(" ");
  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      role={role}
      aria-selected={active ? "true" : "false"}
      {...rest}
    >
      {children}
    </button>
  );
});
NotificationCenterTab.displayName = "NotificationCenterTab";

export const NotificationCenterBody = forwardRef<
  HTMLDivElement,
  NotificationCenterBodyProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-nc__body", className].filter(Boolean).join(" ");
  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});
NotificationCenterBody.displayName = "NotificationCenterBody";

export const NotificationCenterGroup = forwardRef<
  HTMLDivElement,
  NotificationCenterGroupProps
>(({ label, children, className, ...rest }, ref) => {
  const classes = ["bd-nc__group", className].filter(Boolean).join(" ");
  return (
    <div ref={ref} className={classes} {...rest}>
      {label !== undefined && <p className="bd-nc__group-label">{label}</p>}
      {children}
    </div>
  );
});
NotificationCenterGroup.displayName = "NotificationCenterGroup";

export const NotificationCenterFoot = forwardRef<
  HTMLButtonElement,
  NotificationCenterFootProps
>(({ children, className, type = "button", ...rest }, ref) => {
  const classes = ["bd-nc__foot", className].filter(Boolean).join(" ");
  return (
    <button ref={ref} type={type} className={classes} {...rest}>
      {children}
    </button>
  );
});
NotificationCenterFoot.displayName = "NotificationCenterFoot";
