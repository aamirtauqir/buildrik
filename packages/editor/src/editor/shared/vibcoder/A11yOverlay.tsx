/**
 * Vibcoder A11yOverlay — accessibility audit panel (layout-only, no engine).
 *
 * Skin: bd-a11y CSS classes from src/themes/components/organisms/a11y-overlay.css.
 *
 * Sibling exports (Contract C):
 *   A11yOverlay       — root grid (.bd-a11y)
 *   A11yOverlayTile   — single tile (.bd-a11y__tile)
 *   A11yOverlaySwatch — contrast swatch (.bd-a11y__swatch) with `tone` prop
 *                       ("warn" | "fail" — omit for pass)
 *   A11yOverlayRatio  — contrast ratio display (.bd-a11y__ratio)
 *   A11yOverlayHit    — touch target spec (.bd-a11y__hit) with `kind="fail"`
 *
 * Variants discovered via vibcoder-variants.mjs organisms/a11y-overlay:
 *   bd-a11y__swatch: variants = fail, warn
 *   bd-a11y__hit:    variants = fail
 *
 * Plan adaptation (Phase 3 finding for M5):
 *   Plan inventory listed only `A11yOverlay` (single sibling). Source CSS has
 *   a richer subclass tree (tile, swatch with tone variants, ratio, hit).
 *   Sibling list expanded to 5 to mirror the real subclass tree.
 *
 * @license BSD-3-Clause
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export type A11yOverlaySwatchTone = "warn" | "fail";
export type A11yOverlayHitKind = "fail";

export interface A11yOverlayProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface A11yOverlayTileProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export interface A11yOverlaySwatchProps extends HTMLAttributes<HTMLDivElement> {
  tone?: A11yOverlaySwatchTone;
  children?: ReactNode;
}

export interface A11yOverlayRatioProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
}

export interface A11yOverlayHitProps extends HTMLAttributes<HTMLDivElement> {
  kind?: A11yOverlayHitKind;
  children?: ReactNode;
}

export const A11yOverlay = forwardRef<HTMLDivElement, A11yOverlayProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-a11y", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
A11yOverlay.displayName = "A11yOverlay";

export const A11yOverlayTile = forwardRef<HTMLDivElement, A11yOverlayTileProps>(
  ({ children, className, ...rest }, ref) => {
    const classes = ["bd-a11y__tile", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
A11yOverlayTile.displayName = "A11yOverlayTile";

export const A11yOverlaySwatch = forwardRef<
  HTMLDivElement,
  A11yOverlaySwatchProps
>(({ tone, children, className, ...rest }, ref) => {
  const classes = [
    "bd-a11y__swatch",
    tone && `bd-a11y__swatch--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div ref={ref} className={classes} {...rest}>
      {children}
    </div>
  );
});
A11yOverlaySwatch.displayName = "A11yOverlaySwatch";

export const A11yOverlayRatio = forwardRef<
  HTMLSpanElement,
  A11yOverlayRatioProps
>(({ children, className, ...rest }, ref) => {
  const classes = ["bd-a11y__ratio", className].filter(Boolean).join(" ");
  return (
    <span ref={ref} className={classes} {...rest}>
      {children}
    </span>
  );
});
A11yOverlayRatio.displayName = "A11yOverlayRatio";

export const A11yOverlayHit = forwardRef<HTMLDivElement, A11yOverlayHitProps>(
  ({ kind, children, className, ...rest }, ref) => {
    const classes = [
      "bd-a11y__hit",
      kind && `bd-a11y__hit--${kind}`,
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
A11yOverlayHit.displayName = "A11yOverlayHit";
