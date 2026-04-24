/**
 * Badge — pill-shaped label for status/counter/tag.
 *
 * Week 1 reconciliation per P0c audit BD1, BD3, BD4.
 * BD2 (premium variant) deferred pending PRO tier UI copy confirmation.
 *
 * Props API:
 *   variant = default | primary | success | warning | error | info
 *   size    = xs | sm | md | lg
 *              xs = tab-counter (10px font, 1px 6px pad) — NEW per BD3
 *              sm/md/lg = standard status pills
 *   dot     = when true + children: render small dot as prefix INSIDE pill
 *             when true + no children: render standalone colored dot (back-compat)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import styled from "@emotion/styled";

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info";
  size?: "xs" | "sm" | "md" | "lg";
  /** Show a colored dot. If children, dot prefixes children inside the pill.
   *  If no children, renders a standalone dot element (back-compat). */
  dot?: boolean;
  className?: string;
}

type Variant = NonNullable<BadgeProps["variant"]>;
type Size = NonNullable<BadgeProps["size"]>;

// info === accent family per DESIGN.md. Canonical --buildrick-info shares
// the same cobalt value as --buildrick-accent (see color.css).
const variantFg: Record<Variant, string> = {
  default: "var(--bd-fg-muted)",
  primary: "var(--bd-accent)",
  success: "var(--bd-success)",
  warning: "var(--bd-warning)",
  error: "var(--bd-error)",
  info: "var(--bd-accent)",
};

const variantBg: Record<Variant, string> = {
  default: "var(--bd-bg-subtle)",
  primary: "var(--bd-accent-tint)",
  success: "var(--bd-success-bg)",
  warning: "var(--bd-warning-bg)",
  error: "var(--bd-error-bg)",
  info: "var(--bd-accent-tint)",
};

const variantBorder: Record<Variant, string> = {
  default: "var(--bd-border)",
  primary: "var(--bd-accent-subtle)",
  success: "var(--bd-success-border)",
  warning: "var(--bd-warning-border)",
  error: "var(--bd-error-border)",
  info: "var(--bd-accent-subtle)",
};

// BD3: xs size per prototype .tab-badge (10px font, 1px 6px pad).
const sizePad: Record<Size, string> = {
  xs: "1px 6px",
  sm: "1px 6px",
  md: "2px 8px",
  lg: "3px 10px",
};

const sizeFont: Record<Size, string> = {
  xs: "var(--bd-text-2xs)",
  sm: "var(--bd-text-2xs)",
  md: "var(--bd-text-xs)",
  lg: "var(--bd-text-sm)",
};

const dotSize: Record<Size, string> = {
  xs: "4px",
  sm: "5px",
  md: "6px",
  lg: "8px",
};

const Pill = styled.span<{ v: Variant; s: Size }>`
  display: inline-flex;
  align-items: center;
  gap: var(--bd-space-2);
  padding: ${(p) => sizePad[p.s]};
  font-family: var(--bd-font);
  font-size: ${(p) => sizeFont[p.s]};
  font-weight: var(--bd-weight-semibold);
  letter-spacing: var(--bd-track-wide);
  /* xs is a numeric counter — never uppercase */
  text-transform: ${(p) => (p.v === "default" || p.s === "xs" ? "none" : "uppercase")};
  border-radius: var(--bd-radius-full);
  border: 1px solid ${(p) => variantBorder[p.v]};
  background: ${(p) => variantBg[p.v]};
  color: ${(p) => variantFg[p.v]};
  line-height: 1.2;
`;

const Dot = styled.span<{ v: Variant; s: Size }>`
  display: inline-block;
  width: ${(p) => dotSize[p.s]};
  height: ${(p) => dotSize[p.s]};
  border-radius: var(--bd-radius-full);
  background: ${(p) => variantFg[p.v]};
  flex-shrink: 0;
`;

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className,
}) => {
  // BD4 — dot prefix semantics:
  //   dot + children  -> pill with colored dot prefix inside
  //   dot + no children -> standalone dot (back-compat with prior API)
  //   no dot + children -> plain pill
  if (dot && !children) {
    return <Dot v={variant} s={size} className={className} aria-hidden />;
  }
  return (
    <Pill v={variant} s={size} className={className}>
      {dot && <Dot v={variant} s={size} aria-hidden />}
      {children}
    </Pill>
  );
};

export default Badge;
