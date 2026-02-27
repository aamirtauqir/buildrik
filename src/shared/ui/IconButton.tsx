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
      borderRadius: rounded ? "var(--aqb-radius-full)" : "var(--aqb-radius-md)",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all var(--aqb-transition-fast)",
      opacity: disabled ? 0.4 : 1,
      flexShrink: 0,
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      ghost: {
        background: active ? "var(--aqb-primary-light)" : "transparent",
        color: active ? "var(--aqb-primary)" : "var(--aqb-text-secondary)",
      },
      subtle: {
        background: active ? "var(--aqb-primary-light)" : "var(--aqb-surface-3)",
        color: active ? "var(--aqb-primary)" : "var(--aqb-text-secondary)",
      },
      solid: {
        background: active
          ? "var(--aqb-primary)"
          : "linear-gradient(135deg, var(--aqb-surface-3), var(--aqb-surface-4))",
        color: active ? "#fff" : "var(--aqb-text-primary)",
      },
    };

    const hoverStyles = {
      ghost: { background: "var(--aqb-bg-hover)", color: "var(--aqb-text-primary)" },
      subtle: { background: "var(--aqb-surface-4)", color: "var(--aqb-text-primary)" },
      solid: { background: "var(--aqb-primary)", color: "#fff" },
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
        className={`aqb-icon-btn aqb-icon-btn-${variant} aqb-icon-btn-${size} ${active ? "active" : ""} ${className}`}
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
