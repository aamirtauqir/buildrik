/**
 * Vibcoder SectionHead wrapper — collapsible accordion header molecule.
 * Renders the bd-section-head composite from
 * src/themes/components/molecules/section-head.css.
 *
 * Slots (from CSS):
 *   __lead       left cluster: indicator + title + count
 *   __indicator  caret/chevron, rotates on open (gated by `indicator` prop)
 *   __title      uppercase semibold heading (required slot, flat string)
 *   __count      decorative count slot (optional flat number → renders inside)
 *   __actions    right cluster (children content slot — caller passes IconButtons)
 *
 * Variant + size union from `vibcoder-variants.mjs molecules/section-head`:
 *   sizes:    sm
 *   variants: bordered, ink, inline-title, inset
 *
 * Renders as <button> (CSS sets cursor:pointer, border:none, width:100%,
 * text-align:left). The button rendering matches the upstream CSS state
 * affordances (:hover, :active, :focus-visible, [disabled], [aria-expanded]).
 *
 * Open/closed state via caller-owned ARIA pair:
 *   open  → applies aria-expanded="true";  indicator rotates to 0deg
 *   open=false → aria-expanded="false";    indicator rotates to 90deg
 *   open undefined → no aria-expanded attr; CSS falls back to default rotation
 *
 * The `count` slot composes the Count atom — pass a number and the wrapper
 * wraps it in a __count <span>. Caller can use children + Count manually if
 * they need a non-numeric badge (e.g., "12+").
 *
 * Slot composition (Contract A from Phase 2 design):
 *   title     required structural slot → flat string
 *   count     optional decorative slot → flat number
 *   children  variable content slot (actions cluster)
 *
 * forwardRef targets the <button>.
 *
 * @license BSD-3-Clause
 */
import {
  type ButtonHTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";

export type SectionHeadSize = "sm";
export type SectionHeadVariant = "bordered" | "ink" | "inline-title" | "inset";

export interface SectionHeadProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title" | "children"> {
  title: string;
  count?: number;
  indicator?: ReactNode;
  children?: ReactNode;
  size?: SectionHeadSize;
  variant?: SectionHeadVariant;
  /**
   * When defined, applies `aria-expanded` and the corresponding indicator
   * rotation. Undefined = no aria-expanded attribute emitted.
   */
  open?: boolean;
}

export const SectionHead = forwardRef<HTMLButtonElement, SectionHeadProps>(
  (
    {
      title,
      count,
      indicator,
      children,
      size,
      variant,
      open,
      className,
      type = "button",
      ...rest
    },
    ref,
  ) => {
    const classes = [
      "bd-section-head",
      size && `bd-section-head--${size}`,
      variant && `bd-section-head--${variant}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        aria-expanded={open}
        {...rest}
      >
        <span className="bd-section-head__lead">
          {indicator && (
            <span className="bd-section-head__indicator" aria-hidden="true">
              {indicator}
            </span>
          )}
          <span className="bd-section-head__title">{title}</span>
          {Number.isFinite(count) && (
            <span className="bd-section-head__count">{count}</span>
          )}
        </span>
        {children && (
          <span className="bd-section-head__actions">{children}</span>
        )}
      </button>
    );
  },
);
SectionHead.displayName = "SectionHead";
