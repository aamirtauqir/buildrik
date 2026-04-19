/**
 * IconButton Component
 * Compact button for toolbar actions with tooltip
 * @license BSD-3-Clause
 */

import * as React from "react";
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
      className = "",
      style,
      ...props
    },
    ref
  ) => {
    const sizeMap = {
      sm: { size: 24, iconSize: 14, padding: 5 },
      md: { size: 32, iconSize: 16, padding: 8 },
      lg: { size: 44, iconSize: 20, padding: 12 }, // 44px for WCAG touch target compliance
    };

    const config = sizeMap[size];

    const baseStyles: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: config.size,
      height: config.size,
      padding: config.padding,
      border: "none",
      borderRadius: rounded ? "var(--buildrick-design-radius-full)" : "var(--buildrick-design-radius-md)",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all var(--buildrick-transition-fast)",
      opacity: disabled ? 0.4 : 1,
      flexShrink: 0,
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      ghost: {
        background: active ? "var(--buildrick-accent-subtle)" : "transparent",
        color: active ? "var(--buildrick-accent)" : "var(--buildrick-text-secondary)",
      },
      subtle: {
        background: active ? "var(--buildrick-accent-subtle)" : "var(--buildrick-surface-3)",
        color: active ? "var(--buildrick-accent)" : "var(--buildrick-text-secondary)",
      },
      solid: {
        background: active
          ? "var(--buildrick-accent)"
          : "linear-gradient(135deg, var(--buildrick-surface-3), var(--buildrick-surface-4))",
        color: active ? "#fff" : "var(--buildrick-text-primary)",
      },
    };

    const hoverStyles = {
      ghost: { background: "var(--buildrick-bg-hover)", color: "var(--buildrick-text-primary)" },
      subtle: { background: "var(--buildrick-surface-4)", color: "var(--buildrick-text-primary)" },
      solid: { background: "var(--buildrick-accent)", color: "#fff" },
    };

    const [isHovered, setIsHovered] = React.useState(false);

    const computedStyles: React.CSSProperties = {
      ...baseStyles,
      ...variantStyles[variant],
      ...(isHovered && !disabled && !active ? hoverStyles[variant] : {}),
      ...style,
    };

    const button = (
      <button
        ref={ref}
        className={`buildrick-icon-btn buildrick-icon-btn-${variant} buildrick-icon-btn-${size} ${active ? "active" : ""} ${className}`}
        style={computedStyles}
        disabled={disabled}
        aria-pressed={active}
        aria-label={ariaLabel || tooltip}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: config.iconSize,
            height: config.iconSize,
          }}
        >
          {icon}
        </span>
      </button>
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
