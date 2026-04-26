/**
 * Vibcoder SurfaceHead wrapper — surface header strip molecule.
 * Renders the bd-surface-head composite from
 * src/themes/components/molecules/surface-head.css.
 *
 * Slots (from CSS):
 *   __body     left flex column (eyebrow + title + meta + tag wrapper)
 *   __eyebrow  optional small uppercase mono label above the title
 *   __title    primary heading (required slot, flat string)
 *   __meta     optional secondary muted line below the title
 *   __tag      optional inline tag/badge slot (composes Tag/Badge)
 *   __actions  optional right cluster (children content slot)
 *
 * Variant + size union from `vibcoder-variants.mjs molecules/surface-head`:
 *   sizes:    sm, lg
 *   variants: centered, flush, inset, sticky, subtle
 *
 * Slot composition (Contract A from Phase 2 design):
 *   title      required structural slot → flat string
 *   eyebrow    optional decorative slot → flat string
 *   meta       optional decorative slot → flat string
 *   tag        optional ReactNode slot — caller passes Tag/Badge component
 *   children   variable content slot (actions cluster)
 *
 * Rendered as <header> (semantic landmark for surface chrome).
 *
 * forwardRef targets the <header> element.
 *
 * @license BSD-3-Clause
 */
import {
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";

export type SurfaceHeadSize = "sm" | "lg";
export type SurfaceHeadVariant =
  | "centered"
  | "flush"
  | "inset"
  | "sticky"
  | "subtle";

export interface SurfaceHeadProps
  extends Omit<HTMLAttributes<HTMLElement>, "title" | "children"> {
  title: string;
  eyebrow?: string;
  meta?: string;
  tag?: ReactNode;
  children?: ReactNode;
  size?: SurfaceHeadSize;
  variant?: SurfaceHeadVariant;
}

export const SurfaceHead = forwardRef<HTMLElement, SurfaceHeadProps>(
  (
    {
      title,
      eyebrow,
      meta,
      tag,
      children,
      size,
      variant,
      className,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      "bd-surface-head",
      size && `bd-surface-head--${size}`,
      variant && `bd-surface-head--${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <header ref={ref} className={classes} {...rest}>
        <div className="bd-surface-head__body">
          {eyebrow && (
            <span className="bd-surface-head__eyebrow">{eyebrow}</span>
          )}
          <h2 className="bd-surface-head__title">{title}</h2>
          {meta && <span className="bd-surface-head__meta">{meta}</span>}
          {tag && <span className="bd-surface-head__tag">{tag}</span>}
        </div>
        {children && (
          <div className="bd-surface-head__actions">{children}</div>
        )}
      </header>
    );
  },
);
SurfaceHead.displayName = "SurfaceHead";
