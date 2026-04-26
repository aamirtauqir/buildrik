/**
 * Vibcoder Card + sibling exports.
 * Renders the bd-card composite from src/themes/components/molecules/card.css.
 *
 * Two top-level shapes (one CSS file, one wrapper file, sibling exports):
 *   .bd-card           elevated: header → body → footer, soft shadow
 *   .bd-card--flush    panel-flush: no shadow, simple bordered block
 *
 * Sibling exports (Contract C — same precedent as Spinner+StatusDot, Kbd+KbdSeq):
 *   Card            base container; `flush` toggles --flush variant
 *   CardHeader      bd-card__head — top row, semibold, border-bottom
 *   CardHeaderMeta  bd-card__head-meta — mono micro-meta, sits inside CardHeader
 *   CardBody        bd-card__body — content area
 *   CardFooter      bd-card__foot — right-aligned action row, top-border
 *   CardTitle       bd-card__title — h3 used in the flush variant
 *   CardDesc        bd-card__desc  — p   used in the flush variant
 *
 * Variant union from `vibcoder-variants.mjs molecules/card`:
 *   variants: flush
 *
 * No state props — Card is a pure presentational container. Interactive
 * children (buttons, links) own their own ARIA states.
 *
 * forwardRef on each sibling — Card root is a focus measurement consumer
 * (popover anchoring, scroll-into-view); siblings may anchor floating UI
 * (CardHeader for sticky headers in Phase 3 organisms).
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  flush?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ flush, className, children, ...rest }, ref) => {
    const classes = [
      "bd-card",
      flush && "bd-card--flush",
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
Card.displayName = "Card";

export type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-card__head", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
CardHeader.displayName = "CardHeader";

export type CardHeaderMetaProps = HTMLAttributes<HTMLSpanElement>;

export const CardHeaderMeta = forwardRef<HTMLSpanElement, CardHeaderMetaProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-card__head-meta", className].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {children}
      </span>
    );
  },
);
CardHeaderMeta.displayName = "CardHeaderMeta";

export type CardBodyProps = HTMLAttributes<HTMLDivElement>;

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-card__body", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
CardBody.displayName = "CardBody";

export type CardFooterProps = HTMLAttributes<HTMLDivElement>;

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-card__foot", className].filter(Boolean).join(" ");
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);
CardFooter.displayName = "CardFooter";

export type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-card__title", className].filter(Boolean).join(" ");
    return (
      <h3 ref={ref} className={classes} {...rest}>
        {children}
      </h3>
    );
  },
);
CardTitle.displayName = "CardTitle";

export type CardDescProps = HTMLAttributes<HTMLParagraphElement>;

export const CardDesc = forwardRef<HTMLParagraphElement, CardDescProps>(
  ({ className, children, ...rest }, ref) => {
    const classes = ["bd-card__desc", className].filter(Boolean).join(" ");
    return (
      <p ref={ref} className={classes} {...rest}>
        {children}
      </p>
    );
  },
);
CardDesc.displayName = "CardDesc";
