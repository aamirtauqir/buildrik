/**
 * Badge — pill-shaped label for status/counter/tag.
 *
 * Phase 2 primitive port — uses --bd-* tokens (alias layer → canonical).
 * Props API preserved for existing consumers (~20 callers):
 * variant = default | primary | success | warning | error | info
 * size    = sm | md | lg
 * dot     = small circle variant
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import styled from "@emotion/styled";

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  className?: string;
}

type Variant = NonNullable<BadgeProps["variant"]>;
type Size = NonNullable<BadgeProps["size"]>;

// info === accent family per canonical (--buildrick-info equals --buildrick-accent
// at #2D6DFF, per color.css). Wire info consistently to accent-family tokens to
// avoid mixing info fg with accent bg/border.
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

const sizePad: Record<Size, string> = {
  sm: "1px 6px",
  md: "2px 8px",
  lg: "3px 10px",
};

const sizeFont: Record<Size, string> = {
  sm: "var(--bd-text-2xs)",
  md: "var(--bd-text-xs)",
  lg: "var(--bd-text-sm)",
};

const Pill = styled.span<{ v: Variant; s: Size }>`
  display: inline-flex;
  align-items: center;
  gap: var(--buildrick-space-2);
  padding: ${(p) => sizePad[p.s]};
  font-family: var(--bd-font);
  font-size: ${(p) => sizeFont[p.s]};
  font-weight: var(--bd-weight-semibold);
  letter-spacing: var(--bd-track-wide);
  text-transform: ${(p) => (p.v === "default" ? "none" : "uppercase")};
  border-radius: var(--buildrick-radius-full);
  border: 1px solid ${(p) => variantBorder[p.v]};
  background: ${(p) => variantBg[p.v]};
  color: ${(p) => variantFg[p.v]};
  line-height: 1.2;
`;

const Dot = styled.span<{ v: Variant; s: Size }>`
  display: inline-block;
  width: ${(p) => (p.s === "sm" ? "5px" : p.s === "lg" ? "8px" : "6px")};
  height: ${(p) => (p.s === "sm" ? "5px" : p.s === "lg" ? "8px" : "6px")};
  border-radius: var(--buildrick-radius-full);
  background: ${(p) => variantFg[p.v]};
`;

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className,
}) => {
  if (dot) {
    return <Dot v={variant} s={size} className={className} aria-hidden />;
  }
  return (
    <Pill v={variant} s={size} className={className}>
      {children}
    </Pill>
  );
};

export default Badge;
