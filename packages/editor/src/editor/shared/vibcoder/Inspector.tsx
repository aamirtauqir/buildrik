/**
 * Vibcoder Inspector — 280px right-side property panel (layout-only, no engine).
 *
 * Skin: bd-inspector CSS classes from src/themes/components/organisms/inspector.css.
 *
 * Sibling exports (Contract C):
 *   Inspector             — root (.bd-inspector)
 *   InspectorCrumbs       — breadcrumbs strip (.bd-inspector__crumbs)
 *   InspectorHead         — element header section (.bd-inspector__head)
 *   InspectorHeadIcon     — icon tile inside head (.bd-inspector__head-icon)
 *   InspectorSection      — collapsible section (.bd-inspector__sec); supports
 *                           `expanded` prop (sets aria-expanded + .is-open)
 *   InspectorSectionHead  — section header button (.bd-inspector__sec-head)
 *   InspectorSectionBody  — section body (.bd-inspector__sec-body)
 *
 * Variants discovered via vibcoder-variants.mjs organisms/inspector:
 *   (none — no .bd-X--Y modifier classes; state via aria-expanded + .is-open)
 *
 * Plan adaptation (Phase 3 finding for M5):
 *   Plan inventory listed `Inspector · InspectorSection · InspectorHeader`. The
 *   source CSS uses `__head` (not `__header`) plus a richer set of subclasses
 *   for crumbs, head-icon, section-head, section-body. Sibling list expanded
 *   to 7 to mirror the real subclass tree.
 *
 * @license BSD-3-Clause
 */
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export interface InspectorProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface InspectorCrumbsProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface InspectorHeadProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface InspectorHeadIconProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface InspectorSectionProps extends HTMLAttributes<HTMLDivElement> {
  /** Expanded state — sets aria-expanded="true" + .is-open dual selector. */
  expanded?: boolean;
  children?: ReactNode;
}

export interface InspectorSectionHeadProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

export interface InspectorSectionBodyProps
  extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const Inspector = forwardRef<HTMLDivElement, InspectorProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-inspector", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
Inspector.displayName = "Inspector";

export const InspectorCrumbs = forwardRef<HTMLDivElement, InspectorCrumbsProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-inspector__crumbs", className]
      .filter(Boolean)
      .join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
InspectorCrumbs.displayName = "InspectorCrumbs";

export const InspectorHead = forwardRef<HTMLDivElement, InspectorHeadProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-inspector__head", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
InspectorHead.displayName = "InspectorHead";

export const InspectorHeadIcon = forwardRef<
  HTMLDivElement,
  InspectorHeadIconProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-inspector__head-icon", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});
InspectorHeadIcon.displayName = "InspectorHeadIcon";

export const InspectorSection = forwardRef<
  HTMLDivElement,
  InspectorSectionProps
>(({ expanded, children, className, ...rest }, ref) => {
  const classes = ["bd-inspector__sec", className].filter(Boolean).join(" ");
  return (
    <div
      ref={ref}
      className={classes}
      aria-expanded={expanded ? "true" : "false"}
      {...rest}
    >
      {children}
    </div>
  );
});
InspectorSection.displayName = "InspectorSection";

export const InspectorSectionHead = forwardRef<
  HTMLButtonElement,
  InspectorSectionHeadProps
>(({ children, className, type = "button", ...rest }, ref) => {
  const classes = ["bd-inspector__sec-head", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button ref={ref} type={type} className={classes} {...rest}>
      {children}
    </button>
  );
});
InspectorSectionHead.displayName = "InspectorSectionHead";

export const InspectorSectionBody = forwardRef<
  HTMLDivElement,
  InspectorSectionBodyProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-inspector__sec-body", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});
InspectorSectionBody.displayName = "InspectorSectionBody";
