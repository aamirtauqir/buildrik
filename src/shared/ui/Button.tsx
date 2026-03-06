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
      transition: "background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease",
      opacity: disabled || loading ? 0.4 : 1,
      pointerEvents: disabled || loading ? "none" : "auto",
      width: fullWidth ? "100%" : "auto",
      whiteSpace: "nowrap",
      boxSizing: "border-box",
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { height: 28, padding: "0 10px", fontSize: 12, fontWeight: 500 },
      md: { height: 36, padding: "0 16px", fontSize: 14, fontWeight: 500 },
      lg: { height: 44, padding: "0 20px", fontSize: 16, fontWeight: 500 },
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      // Tier 1 — Primary CTA (Publish, Save)
      primary: {
        background: "var(--aqb-primary)",
        color: "#fff",
        fontWeight: 600,
        border: "none",
        boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)",
      },
      // Tier 2 — Secondary (Preview, Export, Cancel)
      secondary: {
        background: "transparent",
        color: "var(--aqb-text-secondary)",
        border: "1px solid var(--aqb-border)",
      },
      // Tier 3 — Ghost (inline actions, toolbar)
      ghost: {
        background: "transparent",
        color: "var(--aqb-text-muted)",
        border: "none",
      },
      danger: {
        background: "var(--aqb-error)",
        color: "#fff",
        border: "none",
      },
      success: {
        background: "var(--aqb-success)",
        color: "#fff",
        border: "none",
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
