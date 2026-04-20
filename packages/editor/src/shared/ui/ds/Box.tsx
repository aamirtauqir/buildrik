/**
 * <Box> — Token-bound primitive for chrome styling.
 *
 * Survivor #5 (Token Binding Contract) from the editor-chrome DS rollout.
 * Props accept ONLY typed token names. Raw hex/px/rgba values are a
 * TypeScript compile error, not a lint warning.
 *
 * Usage:
 *   <Box bg="panel" p="md" radius="sm" border="default">
 *     ...
 *   </Box>
 *
 * Dynamic values (drag positions, measured dims) use the `style` escape
 * hatch — still subject to the chrome-axiom ESLint rules.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type {
  ChromeBg,
  ChromeText,
  ChromeSpace,
  ChromeRadius,
  ChromeShadow,
  ChromeBorder,
} from "./tokens";
import {
  resolveBg,
  resolveText,
  resolveSpace,
  resolveRadius,
  resolveShadow,
  resolveBorder,
} from "./tokens";

// ============================================================================
// Props
// ============================================================================

export interface BoxProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  // Box is a div-only wrapper by design — real polymorphism requires
  // per-tag prop/ref typing which we don't need in Week 2. If a consumer
  // needs <a>/<button>/<section> semantics, use the appropriate form atom
  // (Button, IconButton) or compose Box as a child of the right tag.

  // Surface
  bg?: ChromeBg;
  color?: ChromeText;

  // Spacing — shorthand or axis-specific.
  p?: ChromeSpace;
  px?: ChromeSpace;
  py?: ChromeSpace;
  pt?: ChromeSpace;
  pr?: ChromeSpace;
  pb?: ChromeSpace;
  pl?: ChromeSpace;

  m?: ChromeSpace;
  mx?: ChromeSpace;
  my?: ChromeSpace;

  gap?: ChromeSpace;

  // Shape
  radius?: ChromeRadius;
  shadow?: ChromeShadow;
  border?: ChromeBorder;

  // Layout
  flex?: boolean | "row" | "column";
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
}

// ============================================================================
// Component
// ============================================================================

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  (
    {
      bg,
      color,
      p,
      px,
      py,
      pt,
      pr,
      pb,
      pl,
      m,
      mx,
      my,
      gap,
      radius,
      shadow,
      border,
      flex,
      align,
      justify,
      style,
      children,
      ...rest
    },
    ref
  ) => {
    const computed: React.CSSProperties = {
      background: resolveBg(bg),
      color: resolveText(color),

      padding: resolveSpace(p),
      paddingLeft: resolveSpace(pl ?? px),
      paddingRight: resolveSpace(pr ?? px),
      paddingTop: resolveSpace(pt ?? py),
      paddingBottom: resolveSpace(pb ?? py),

      margin: resolveSpace(m),
      marginLeft: resolveSpace(mx),
      marginRight: resolveSpace(mx),
      marginTop: resolveSpace(my),
      marginBottom: resolveSpace(my),

      gap: resolveSpace(gap),

      borderRadius: resolveRadius(radius),
      boxShadow: resolveShadow(shadow),
      border: resolveBorder(border),

      display: flex ? "flex" : undefined,
      flexDirection:
        flex === "column" ? "column" : flex === "row" || flex === true ? "row" : undefined,
      alignItems:
        align === "start"
          ? "flex-start"
          : align === "end"
          ? "flex-end"
          : align,
      justifyContent:
        justify === "start"
          ? "flex-start"
          : justify === "end"
          ? "flex-end"
          : justify === "between"
          ? "space-between"
          : justify === "around"
          ? "space-around"
          : justify,

      ...style,
    };

    // Strip undefined so inline style stays tidy in DevTools.
    const cleaned: React.CSSProperties = {};
    (Object.keys(computed) as Array<keyof React.CSSProperties>).forEach((k) => {
      const v = computed[k];
      if (v !== undefined) (cleaned as Record<string, unknown>)[k as string] = v;
    });

    return (
      <div ref={ref} style={cleaned} {...rest}>
        {children}
      </div>
    );
  }
);

Box.displayName = "Box";
