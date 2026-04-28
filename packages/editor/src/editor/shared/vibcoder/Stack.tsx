/**
 * Vibcoder Stack — vertical layout primitive.
 *
 * Renders the `bd-stack` rule from src/themes/components/layouts/stack.css.
 * Stacks children vertically with a token-driven gap. Replaces ad-hoc
 * `display:flex; flex-direction:column; gap:Npx` patterns across editor
 * chrome.
 *
 * Vertical only by design — vendored CSS does NOT ship a horizontal modifier.
 * For horizontal/wrap-friendly layout, use the sibling Cluster primitive.
 *
 * Gap modifiers map to vendored bd-stack--{xs|sm|md|lg|xl} classes.
 * Default = "md" (omits modifier — base class already has space-3 gap).
 *
 * `separator` enables hairline divider between adjacent children via
 * `bd-stack--separator > * + *` selector in vendored CSS.
 *
 * @license BSD-3-Clause
 */
import { type HTMLAttributes, forwardRef } from "react";

export type StackGap = "xs" | "sm" | "md" | "lg" | "xl";

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  /** Token gap. Default = "md" (no modifier — base class has space-3). */
  gap?: StackGap;
  /** When true, draws hairline border between adjacent children. */
  separator?: boolean;
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ gap = "md", separator = false, className, children, ...rest }, ref) => {
    const classes = [
      "bd-stack",
      gap !== "md" && `bd-stack--${gap}`,
      separator && "bd-stack--separator",
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
Stack.displayName = "Stack";
