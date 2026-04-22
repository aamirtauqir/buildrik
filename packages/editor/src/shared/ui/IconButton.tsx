/**
 * IconButton — compact button for toolbar actions + inspector controls.
 *
 * Phase 2 primitive port (augment, props API preserved).
 * Previous impl used inline style objects, raw hex fallbacks, a background
 * gradient (gate violation), and useState-based hover. This version:
 * Emotion styled.button, --bd-* tokens, CSS :hover, flat background.
 *
 * Props preserved for existing consumers: icon, tooltip, ariaLabel, size,
 * variant, active, rounded, disabled, className, plus standard button attrs
 * via rest.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import styled from "@emotion/styled";
import { Tooltip } from "./Tooltip";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  tooltip?: string;
  /** More descriptive aria-label for screen readers (defaults to tooltip) */
  ariaLabel?: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "subtle" | "solid";
  active?: boolean;
  rounded?: boolean;
}

type Size = NonNullable<IconButtonProps["size"]>;
type Variant = NonNullable<IconButtonProps["variant"]>;

const sizePx: Record<Size, number> = { sm: 24, md: 32, lg: 44 };
const iconPx: Record<Size, number> = { sm: 14, md: 16, lg: 20 };

const Btn = styled.button<{ s: Size; v: Variant; a: boolean; r: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${(p) => sizePx[p.s]}px;
  height: ${(p) => sizePx[p.s]}px;
  border: none;
  border-radius: ${(p) => (p.r ? "var(--buildrick-radius-full)" : "var(--buildrick-radius-md)")};
  cursor: pointer;
  transition: var(--buildrick-transition-colors);
  flex-shrink: 0;
  padding: 0;
  background: ${(p) => {
    if (p.a) return "var(--bd-accent-subtle)";
    if (p.v === "subtle") return "var(--bd-bg-subtle)";
    if (p.v === "solid") return "var(--bd-accent)";
    return "transparent";
  }};
  color: ${(p) => {
    if (p.a) return "var(--bd-accent)";
    if (p.v === "solid") return "var(--bd-fg-on-accent)";
    return "var(--bd-fg-secondary)";
  }};

  &:hover:not(:disabled) {
    background: ${(p) => {
      if (p.a) return "var(--bd-accent-subtle)";
      if (p.v === "solid") return "var(--bd-accent-hover)";
      return "var(--bd-bg-hover)";
    }};
    color: ${(p) => {
      if (p.a) return "var(--bd-accent)";
      if (p.v === "solid") return "var(--bd-fg-on-accent)";
      return "var(--bd-fg-primary)";
    }};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const IconSpan = styled.span<{ s: Size }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(p) => iconPx[p.s]}px;
  height: ${(p) => iconPx[p.s]}px;
`;

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      tooltip,
      ariaLabel,
      size = "md",
      variant = "ghost",
      active = false,
      rounded = false,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const button = (
      <Btn
        ref={ref}
        s={size}
        v={variant}
        a={active}
        r={rounded}
        disabled={disabled}
        aria-pressed={active}
        aria-label={ariaLabel || tooltip}
        className={className}
        {...props}
      >
        <IconSpan s={size}>{icon}</IconSpan>
      </Btn>
    );

    if (tooltip) {
      return (
        <Tooltip content={tooltip} position="bottom">
          {button}
        </Tooltip>
      );
    }
    return button;
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
