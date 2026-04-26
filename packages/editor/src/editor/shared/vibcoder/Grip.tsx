/**
 * Vibcoder Grip wrapper.
 * Renders the `bd-grip` class from src/themes/components/atoms/grip.css —
 * always as `<button type="button">`. Drag handles are inherently interactive
 * (need keyboard focus + click semantics), so polymorphism is not exposed.
 *
 * Variant + size union from `vibcoder-variants.mjs atoms/grip`:
 *   variants: horizontal (default vertical 12×16 — omit modifier)
 *   sizes:    sm (10×12), lg (14×20)  (default md = 12×16 — no modifier)
 *
 * Composition: Grip does NOT take a `name` prop. Vendored CSS uses
 * `.bd-grip > svg` to size the inner SVG. Caller passes `<Icon name="grip-vertical">`
 * (or any SVG) as a child:
 *
 *   <Grip aria-label="Drag to reorder">
 *     <Icon name="grip-vertical" />
 *   </Grip>
 *
 * Same composition convention as IconButton — keeps icon resolution in one
 * place (Icon.tsx).
 *
 * A11y: callers MUST pass `aria-label` describing the drag target, e.g.,
 * `aria-label="Drag to reorder row"`. Without it, screen readers announce
 * an unlabeled button. Forwarded via `...rest`.
 *
 * forwardRef targets the `<button>` (drag-and-drop libraries need a stable
 * DOM ref for pointer event wiring).
 *
 * @license BSD-3-Clause
 */
import { type ButtonHTMLAttributes, forwardRef } from "react";

export type GripOrientation = "vertical" | "horizontal";
export type GripSize = "sm" | "md" | "lg";

export interface GripProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  orientation?: GripOrientation;
  size?: GripSize;
  type?: "button" | "submit" | "reset";
}

export const Grip = forwardRef<HTMLButtonElement, GripProps>(
  (
    { orientation = "vertical", size = "md", className, children, type = "button", ...rest },
    ref,
  ) => {
    const classes = [
      "bd-grip",
      // vertical is base default — no `bd-grip--vertical` rule exists
      orientation !== "vertical" && `bd-grip--${orientation}`,
      // md is base default — no `bd-grip--md` rule exists
      size !== "md" && `bd-grip--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <button ref={ref} type={type} className={classes} {...rest}>
        {children}
      </button>
    );
  },
);
Grip.displayName = "Grip";
