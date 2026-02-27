/**
 * Aquibra EmptyState Component
 * Unified empty state display for panels and content areas
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, type ButtonProps } from "./Button";

export interface EmptyStateProps {
  /** Icon or emoji to display */
  icon?: React.ReactNode;
  /** Main title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps["variant"];
    icon?: React.ReactNode;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Visual style variant */
  variant?: "default" | "dashed" | "minimal";
  /** Additional class name */
  className?: string;
}

const sizeStyles = {
  sm: {
    padding: "24px 16px",
    iconSize: 32,
    titleSize: 13,
    descSize: 12,
    gap: 8,
  },
  md: {
    padding: "40px 24px",
    iconSize: 48,
    titleSize: 15,
    descSize: 13,
    gap: 12,
  },
  lg: {
    padding: "60px 32px",
    iconSize: 64,
    titleSize: 18,
    descSize: 14,
    gap: 16,
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = "md",
  variant = "default",
  className = "",
}) => {
  const sizes = sizeStyles[size];

  const baseStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: sizes.padding,
    borderRadius: "var(--aqb-radius-lg, 12px)",
    transition: "all var(--aqb-transition-normal, 250ms ease)",
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      background: "rgba(255, 255, 255, 0.02)",
      border: "1px solid rgba(255, 255, 255, 0.06)",
    },
    dashed: {
      background: "transparent",
      border: "1px dashed var(--aqb-border, #334155)",
    },
    minimal: {
      background: "transparent",
      border: "none",
    },
  };

  return (
    <div
      className={`aqb-empty-state aqb-empty-state-${size} aqb-empty-state-${variant} ${className}`}
      style={{ ...baseStyles, ...variantStyles[variant] }}
      role="status"
      aria-label={title}
    >
      {icon && (
        <div
          className="aqb-empty-state-icon"
          style={{
            fontSize: sizes.iconSize,
            marginBottom: sizes.gap,
            opacity: 0.5,
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3
        className="aqb-empty-state-title"
        style={{
          fontSize: sizes.titleSize,
          fontWeight: 600,
          color: "var(--aqb-text-primary, #f8fafc)",
          marginBottom: description ? sizes.gap / 2 : 0,
          margin: 0,
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          className="aqb-empty-state-desc"
          style={{
            fontSize: sizes.descSize,
            color: "var(--aqb-text-muted, #64748b)",
            maxWidth: 300,
            lineHeight: 1.5,
            margin: 0,
            marginBottom: action ? sizes.gap : 0,
          }}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div
          className="aqb-empty-state-actions"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: sizes.gap,
          }}
        >
          {action && (
            <Button
              variant={action.variant || "primary"}
              size={size === "lg" ? "md" : "sm"}
              icon={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--aqb-text-secondary, #94a3b8)",
                fontSize: size === "sm" ? 12 : 13,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
