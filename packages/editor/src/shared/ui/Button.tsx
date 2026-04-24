/**
 * Aquibra Button Component
 *
 * Week 1 primitive reconciliation against project/preview/comp-buttons.html.
 * Variants: primary, secondary, ghost, danger (subtle), success, publish (pill CTA).
 * Tokens: --bd-* only (per plan Premise 2).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import styled from "@emotion/styled";
import { Spinner } from "./Spinner";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "publish";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
}

type Variant = NonNullable<ButtonProps["variant"]>;
type Size = NonNullable<ButtonProps["size"]>;

const sizeMap: Record<Size, { height: number; padding: string; fontSize: string }> = {
  sm: { height: 28, padding: "0 12px", fontSize: "var(--bd-text-sm)" },       // 12px
  md: { height: 36, padding: "0 16px", fontSize: "var(--bd-text-sm-plus)" },  // 13px
  lg: { height: 44, padding: "0 22px", fontSize: "var(--bd-text-md)" },        // 14px
};

interface VariantStyle {
  bg: string;
  color: string;
  border: string;
  hoverBg: string;
  hoverBorder?: string;
  hoverColor?: string;
  pressedBg?: string;
  weight: number;
  radius: string;
}

const variantMap: Record<Variant, VariantStyle> = {
  primary: {
    bg: "var(--bd-accent)",
    color: "var(--bd-fg-on-accent)",
    border: "none",
    hoverBg: "var(--bd-accent-hover)",
    pressedBg: "var(--bd-accent-pressed)",
    weight: 600,
    radius: "var(--bd-radius-md)",
  },
  secondary: {
    bg: "var(--bd-bg-card)",
    color: "var(--bd-fg-primary)",
    border: "1px solid var(--bd-border-medium)",
    hoverBg: "var(--bd-bg-subtle)",
    hoverBorder: "1px solid var(--bd-border-strong)",
    weight: 500,
    radius: "var(--bd-radius-md)",
  },
  ghost: {
    bg: "transparent",
    color: "var(--bd-fg-secondary)",
    border: "none",
    hoverBg: "var(--bd-bg-hover)",
    hoverColor: "var(--bd-fg-primary)",
    weight: 500,
    radius: "var(--bd-radius-md)",
  },
  // Subtle destructive per P0c B4 lock (2026-04-25): white bg + red border + red text
  danger: {
    bg: "var(--bd-bg-card)",
    color: "var(--bd-error)",
    border: "1px solid var(--bd-error-border)",
    hoverBg: "var(--bd-error-bg)",
    hoverBorder: "1px solid var(--bd-error)",
    weight: 500,
    radius: "var(--bd-radius-md)",
  },
  success: {
    bg: "var(--bd-success)",
    color: "var(--bd-fg-on-accent)",
    border: "none",
    hoverBg: "var(--bd-success)",
    weight: 600,
    radius: "var(--bd-radius-md)",
  },
  // Publish CTA — pill radius, matches topbar Publish button in prototype
  publish: {
    bg: "var(--bd-accent)",
    color: "var(--bd-fg-on-accent)",
    border: "none",
    hoverBg: "var(--bd-accent-hover)",
    pressedBg: "var(--bd-accent-pressed)",
    weight: 600,
    radius: "var(--bd-radius-full)",
  },
};

const StyledButton = styled.button<{ v: Variant; s: Size; fw: boolean; busy: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--bd-space-2);
  font-family: inherit;
  font-weight: ${(p) => variantMap[p.v].weight};
  height: ${(p) => sizeMap[p.s].height}px;
  padding: ${(p) => sizeMap[p.s].padding};
  font-size: ${(p) => sizeMap[p.s].fontSize};
  background: ${(p) => variantMap[p.v].bg};
  color: ${(p) => variantMap[p.v].color};
  border: ${(p) => variantMap[p.v].border};
  border-radius: ${(p) => variantMap[p.v].radius};
  width: ${(p) => (p.fw ? "100%" : "auto")};
  white-space: nowrap;
  box-sizing: border-box;
  cursor: ${(p) => (p.busy ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.busy ? 0.5 : 1)};
  transition: var(--bd-transition-colors);

  &:hover:not(:disabled) {
    background: ${(p) => variantMap[p.v].hoverBg};
    ${(p) => (variantMap[p.v].hoverBorder ? `border: ${variantMap[p.v].hoverBorder};` : "")}
    ${(p) => (variantMap[p.v].hoverColor ? `color: ${variantMap[p.v].hoverColor};` : "")}
  }

  &:active:not(:disabled) {
    ${(p) => (variantMap[p.v].pressedBg ? `background: ${variantMap[p.v].pressedBg};` : "")}
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
`;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      iconPosition = "left",
      loading = false,
      fullWidth = false,
      children,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const busy = disabled || loading;
    return (
      <StyledButton
        ref={ref}
        v={variant}
        s={size}
        fw={fullWidth}
        busy={busy}
        disabled={busy}
        aria-busy={loading}
        aria-disabled={busy}
        className={`buildrick-btn buildrick-btn-${variant} buildrick-btn-${size} ${className}`}
        {...props}
      >
        {loading && <Spinner size={size === "sm" ? 12 : 16} color="currentColor" />}
        {!loading && icon && iconPosition === "left" && icon}
        {children}
        {!loading && icon && iconPosition === "right" && icon}
      </StyledButton>
    );
  }
);

Button.displayName = "Button";

export default Button;
