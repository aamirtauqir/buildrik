/**
 * Vibcoder Skeleton wrapper.
 * Renders the `bd-skeleton` atom from src/themes/components/atoms/skeleton.css
 * with chained shape + size modifier classes.
 *
 * Variant + size union from `vibcoder-variants.mjs atoms/skeleton`:
 *   shapes: rect (default), line, circle  — exposed as `shape` prop
 *   sizes:  xs, sm, lg                    — default md = no modifier
 *   states: (none — purely presentational)
 *
 * The variants script bucketed shapes under "variants" because they share
 * the modifier-class shape; semantically they're a shape enum (mutually
 * exclusive), exposed via `shape` here.
 *
 * IMPORTANT — `size` is a NO-OP when `shape="line"`. The vendored CSS only
 * defines size rules for `bd-skeleton--<size>.bd-skeleton--rect` and
 * `bd-skeleton--<size>.bd-skeleton--circle`. Lines remain 12px regardless
 * of size. Callers wanting wider/narrower lines should use `style={{ width }}`
 * (matching the upstream HTML demo at skeleton.html line 17-19).
 *
 * A11y: skeletons are decorative loading placeholders. Defaults to
 * `aria-hidden="true"` per upstream HTML demo. Caller can override by
 * passing `aria-hidden={false}` (or any aria-* attr) via ...rest, which
 * displaces the default per JSX attribute order.
 *
 * forwardRef targets the wrapper div.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type SkeletonShape = "rect" | "line" | "circle";
export type SkeletonSize = "xs" | "sm" | "lg";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shape?: SkeletonShape;
  /** No-op when `shape="line"` (vendored CSS has no line size rules). */
  size?: SkeletonSize;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ shape = "rect", size, className, ...rest }, ref) => {
    const classes = [
      "bd-skeleton",
      `bd-skeleton--${shape}`,
      // md is the base default — no `bd-skeleton--md` rule exists in vendored CSS
      size && `bd-skeleton--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return <div ref={ref} aria-hidden="true" className={classes} {...rest} />;
  },
);
Skeleton.displayName = "Skeleton";
