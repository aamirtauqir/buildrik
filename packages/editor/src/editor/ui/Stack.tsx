/**
 * Stack — the layout primitive.
 * Gaps come from the token scale, so no surface invents its own rhythm.
 * @license BSD-3-Clause
 */
import React from "react";

export type StackGap = "xs" | "sm" | "md" | "lg" | "xl";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: StackGap;
  row?: boolean;
  separator?: boolean;
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(function Stack(
  { gap = "md", row, separator, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={["bk-stack", `bk-stack--${gap}`, row && "bk-stack--row", separator && "bk-stack--separator", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
});
