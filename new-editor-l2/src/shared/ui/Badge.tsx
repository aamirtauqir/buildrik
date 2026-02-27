/**
 * Aquibra Badge Component
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: "var(--aqb-bg-panel-secondary)",
      color: "var(--aqb-text-secondary)",
    },
    primary: { background: "var(--aqb-primary)", color: "#fff" },
    success: { background: "var(--aqb-success)", color: "#fff" },
    warning: { background: "var(--aqb-warning)", color: "#fff" },
    error: { background: "var(--aqb-error)", color: "#fff" },
    info: { background: "var(--aqb-info)", color: "#fff" },
  };

  const sizeStyles = {
    sm: { padding: "2px 6px", fontSize: 10 },
    md: { padding: "4px 8px", fontSize: 11 },
  };

  if (dot) {
    return (
      <span
        className={`aqb-badge-dot aqb-badge-${variant}`}
        style={{
          width: size === "sm" ? 6 : 8,
          height: size === "sm" ? 6 : 8,
          borderRadius: "50%",
          display: "inline-block",
          ...variantStyles[variant],
        }}
      />
    );
  }

  return (
    <span
      className={`aqb-badge aqb-badge-${variant}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 100,
        fontWeight: 600,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
    >
      {children}
    </span>
  );
};

export default Badge;
