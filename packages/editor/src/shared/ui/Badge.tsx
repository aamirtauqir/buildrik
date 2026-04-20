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
      background: "var(--buildrick-surface-2)",
      color: "var(--buildrick-text-muted)",
    },
    primary: { background: "rgba(45, 109, 255, 0.12)", color: "var(--buildrick-accent, #2D6DFF)" },
    success: { background: "rgba(34, 197, 94, 0.12)", color: "var(--buildrick-success, #22c55e)" },
    warning: { background: "rgba(245, 158, 11, 0.12)", color: "var(--buildrick-warning, #f59e0b)" },
    error: { background: "rgba(239, 68, 68, 0.12)", color: "var(--buildrick-error, #ef4444)" },
    info: { background: "rgba(75, 141, 255, 0.12)", color: "var(--buildrick-accent)" },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "0 6px", height: 18, fontSize: 11, lineHeight: "18px" },
    md: { padding: "0 8px", height: 22, fontSize: 11, lineHeight: "22px" },
    lg: { padding: "0 10px", height: 26, fontSize: 12, lineHeight: "26px" },
  };

  if (dot) {
    return (
      <span
        className={`buildrick-badge-dot buildrick-badge-${variant}`}
        style={{
          width: size === "sm" ? 6 : 8,
          height: size === "sm" ? 6 : 8,
          borderRadius: "var(--buildrick-radius-full)",
          display: "inline-block",
          ...variantStyles[variant],
        }}
      />
    );
  }

  return (
    <span
      className={`buildrick-badge buildrick-badge-${variant}`}
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
