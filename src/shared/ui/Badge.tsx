/**
 * Aquibra Badge Component
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
}) => {
  const isStatus = variant !== "default";

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: "var(--aqb-surface-2)",
      color: "var(--aqb-text-muted)",
    },
    primary: { background: "rgba(99, 102, 241, 0.12)", color: "var(--aqb-primary, #6366F1)" },
    success: { background: "rgba(34, 197, 94, 0.12)", color: "var(--aqb-success, #22c55e)" },
    warning: { background: "rgba(245, 158, 11, 0.12)", color: "var(--aqb-warning, #f59e0b)" },
    error: { background: "rgba(239, 68, 68, 0.12)", color: "var(--aqb-error, #ef4444)" },
    info: { background: "rgba(75, 141, 255, 0.12)", color: "var(--blue, #4b8dff)" },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "0 6px", height: 18, fontSize: 11, lineHeight: "18px" },
    md: { padding: "0 8px", height: 22, fontSize: 11, lineHeight: "22px" },
    lg: { padding: "0 10px", height: 26, fontSize: 12, lineHeight: "26px" },
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
        borderRadius: 4,
        fontWeight: isStatus ? 600 : 500,
        textTransform: isStatus ? "uppercase" : undefined,
        letterSpacing: isStatus ? "0.5px" : undefined,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
    >
      {children}
    </span>
  );
};

export default Badge;
