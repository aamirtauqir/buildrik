/**
 * Aquibra Button Component
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Spinner } from "./Spinner";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
}

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
      style,
      ...props
    },
    ref
  ) => {
    const baseStyles: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      border: "none",
      borderRadius: "var(--aqb-radius-md, 8px)",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      fontFamily: "inherit",
      fontWeight: 500,
      transition: "all 0.15s ease",
      opacity: disabled ? 0.5 : 1,
      width: fullWidth ? "100%" : "auto",
      whiteSpace: "nowrap",
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { padding: "6px 12px", fontSize: 12 },
      md: { padding: "8px 16px", fontSize: 14 },
      lg: { padding: "12px 24px", fontSize: 16 },
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: "linear-gradient(135deg, var(--aqb-primary), var(--aqb-primary-hover))",
        color: "#fff",
      },
      secondary: {
        background: "var(--aqb-bg-panel-secondary)",
        color: "var(--aqb-text-primary)",
        border: "1px solid var(--aqb-border)",
      },
      ghost: {
        background: "transparent",
        color: "var(--aqb-text-secondary)",
      },
      danger: {
        background: "var(--aqb-error)",
        color: "#fff",
      },
      success: {
        background: "var(--aqb-success)",
        color: "#fff",
      },
    };

    return (
      <button
        ref={ref}
        className={`aqb-btn aqb-btn-${variant} aqb-btn-${size} ${className}`}
        style={{
          ...baseStyles,
          ...sizeStyles[size],
          ...variantStyles[variant],
          ...style,
        }}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner size={size === "sm" ? 12 : 16} color="currentColor" />}
        {!loading && icon && iconPosition === "left" && icon}
        {children}
        {!loading && icon && iconPosition === "right" && icon}
      </button>
    );
  }
);

export default Button;
