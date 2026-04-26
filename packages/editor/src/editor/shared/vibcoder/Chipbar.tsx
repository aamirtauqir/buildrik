/**
 * Vibcoder Chipbar wrapper — wrapping closeable-tag bar with optional
 * "+ add" affordance and overflow indicator.
 * Renders the bd-chipbar composite from
 * src/themes/components/molecules/chipbar.css.
 *
 * Slots (from CSS):
 *   __add       small dashed circle/pill add button
 *   __overflow  "+N more" indicator chip (text, no border)
 *
 * Polymorphism choice (per Phase 2 Contract D guidance): UNIFORM
 * COMPOSITION.
 *   Children are homogeneous Tag atoms (closeable variant). Bar adds
 *   layout (wrap, gap, align) only — NO visual styling for the chips
 *   themselves. Caller renders <Tag /> instances directly. No
 *   data-driven `items={…}` API.
 *
 * Sibling exports (Contract C):
 *   Chipbar          bd-chipbar — root wrap container
 *   ChipbarAdd       bd-chipbar__add — dashed "+" affordance (button)
 *   ChipbarOverflow  bd-chipbar__overflow — "+N more" text indicator
 *
 * Variant + size union from `vibcoder-variants.mjs molecules/chipbar`:
 *   bd-chipbar:           variants: inset
 *   bd-chipbar__add:      sizes: sm
 *   bd-chipbar__overflow: sizes: sm
 *
 * @license BSD-3-Clause
 */
import {
  type HTMLAttributes,
  type ButtonHTMLAttributes,
  forwardRef,
} from "react";

export interface ChipbarProps extends HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

export const Chipbar = forwardRef<HTMLDivElement, ChipbarProps>(
  ({ inset, className, children, ...rest }, ref) => {
    const classes = [
      "bd-chipbar",
      inset && "bd-chipbar--inset",
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
Chipbar.displayName = "Chipbar";

export type ChipbarAddSize = "sm";

export interface ChipbarAddProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ChipbarAddSize;
}

export const ChipbarAdd = forwardRef<HTMLButtonElement, ChipbarAddProps>(
  ({ size, className, children, type = "button", ...rest }, ref) => {
    const classes = [
      "bd-chipbar__add",
      size && `bd-chipbar__add--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <button ref={ref} type={type} className={classes} {...rest}>
        {children ?? "+"}
      </button>
    );
  },
);
ChipbarAdd.displayName = "ChipbarAdd";

export type ChipbarOverflowSize = "sm";

export interface ChipbarOverflowProps extends HTMLAttributes<HTMLSpanElement> {
  size?: ChipbarOverflowSize;
}

export const ChipbarOverflow = forwardRef<
  HTMLSpanElement,
  ChipbarOverflowProps
>(({ size, className, children, ...rest }, ref) => {
  const classes = [
    "bd-chipbar__overflow",
    size && `bd-chipbar__overflow--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span ref={ref} className={classes} {...rest}>
      {children}
    </span>
  );
});
ChipbarOverflow.displayName = "ChipbarOverflow";
