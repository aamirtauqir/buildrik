/**
 * Vibcoder EmptyState — empty / zero / error state organism (layout-only).
 *
 * Skin: bd-empty CSS classes from src/themes/components/organisms/empty-state.css.
 *
 * Sibling exports (Contract C):
 *   EmptyState        — root (.bd-empty) with `size: "compact" | "tall"`
 *   EmptyStateArt     — art container slot (.bd-empty__art)
 *   EmptyStateSpot    — circular icon spot (.bd-empty__spot) with `tone` prop
 *                       ("accent" | "success" | "warning" | "error" — omit for default)
 *   EmptyStateTitle   — title heading (.bd-empty__title)
 *   EmptyStateDesc    — description paragraph (.bd-empty__desc)
 *   EmptyStateActions — action button group (.bd-empty__actions)
 *   EmptyStateCode    — footer code/hint chip (.bd-empty__code)
 *
 * Variants discovered via vibcoder-variants.mjs organisms/empty-state:
 *   bd-empty:       variants = compact, tall
 *   bd-empty__spot: variants = accent, error, success, warning
 *
 * Plan adaptation (Phase 3 finding for M5):
 *   Plan inventory listed `EmptyState · EmptyStateIcon · EmptyStateTitle ·
 *   EmptyStateDesc · EmptyStateAction`. Source CSS root is `.bd-empty` (not
 *   `.bd-empty-state`); icon container is `__spot` (not `__icon`); actions
 *   uses plural `__actions`. Sibling list updated to match.
 *
 * @license BSD-3-Clause
 */
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";

export type EmptyStateSize = "compact" | "tall";
export type EmptyStateSpotTone = "accent" | "success" | "warning" | "error";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  size?: EmptyStateSize;
  children?: ReactNode;
}

export interface EmptyStateArtProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface EmptyStateSpotProps extends HTMLAttributes<HTMLDivElement> {
  tone?: EmptyStateSpotTone;
  children?: ReactNode;
}

export interface EmptyStateTitleProps
  extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
}

export interface EmptyStateDescProps
  extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}

export interface EmptyStateActionsProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface EmptyStateCodeProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ size, children, className, ...rest }, ref) => {
    const classes = [
      "bd-empty",
      size && `bd-empty--${size}`,
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
EmptyState.displayName = "EmptyState";

export const EmptyStateArt = forwardRef<HTMLDivElement, EmptyStateArtProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-empty__art", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
EmptyStateArt.displayName = "EmptyStateArt";

export const EmptyStateSpot = forwardRef<HTMLDivElement, EmptyStateSpotProps>(
  ({ tone, children, className, ...rest }, ref) => {
    const classes = [
      "bd-empty__spot",
      tone && `bd-empty__spot--${tone}`,
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
EmptyStateSpot.displayName = "EmptyStateSpot";

export const EmptyStateTitle = forwardRef<
  HTMLHeadingElement,
  EmptyStateTitleProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-empty__title", className].filter(Boolean).join(" ");
  return (
    <h3 ref={ref} className={classes} {...rest}>
      {children}
    </h3>
  );
});
EmptyStateTitle.displayName = "EmptyStateTitle";

export const EmptyStateDesc = forwardRef<
  HTMLParagraphElement,
  EmptyStateDescProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-empty__desc", className].filter(Boolean).join(" ");
  return (
    <p ref={ref} className={classes} {...rest}>
      {children}
    </p>
  );
});
EmptyStateDesc.displayName = "EmptyStateDesc";

export const EmptyStateActions = forwardRef<
  HTMLDivElement,
  EmptyStateActionsProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-empty__actions", className].filter(Boolean).join(" ");
  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});
EmptyStateActions.displayName = "EmptyStateActions";

export const EmptyStateCode = forwardRef<HTMLSpanElement, EmptyStateCodeProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-empty__code", className].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
EmptyStateCode.displayName = "EmptyStateCode";
