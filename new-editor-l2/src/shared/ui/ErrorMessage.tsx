/**
 * ErrorMessage Component
 * Shows errors with title, why, and action (UX Audit 2026 Task 5)
 *
 * Usage:
 * <ErrorMessage
 *   title="Can't drop here"
 *   why="Text elements can only be dropped inside containers"
 *   action="Try dropping into a Section or Div"
 * />
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface ErrorMessageProps {
  /** What happened (short title) */
  title: string;
  /** Why it happened (explanation) */
  why?: string;
  /** How to fix it (actionable guidance) */
  action?: string;
  /** Visual variant */
  variant?: "error" | "warning" | "info";
  /** Size */
  size?: "sm" | "md";
  /** Optional dismiss callback */
  onDismiss?: () => void;
  /** Additional CSS class */
  className?: string;
  /** Inline style override */
  style?: React.CSSProperties;
}

/**
 * ErrorMessage - Explains errors with context
 *
 * Pattern:
 * 1. Title: "What" - brief statement of the problem
 * 2. Why: "Because" - explains the reason (optional but recommended)
 * 3. Action: "Fix" - tells user what to do (optional but recommended)
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  why,
  action,
  variant = "error",
  size = "md",
  onDismiss,
  className = "",
  style,
}) => {
  const colors = VARIANT_COLORS[variant];
  const sizes = SIZE_STYLES[size];

  return (
    <div
      role="alert"
      className={`aqb-error-message ${className}`}
      style={{
        ...containerStyles,
        background: colors.bg,
        borderColor: colors.border,
        padding: sizes.padding,
        ...style,
      }}
    >
      {/* Icon */}
      <div style={{ ...iconContainerStyles, color: colors.icon }}>
        {variant === "error" && <ErrorIcon size={sizes.iconSize} />}
        {variant === "warning" && <WarningIcon size={sizes.iconSize} />}
        {variant === "info" && <InfoIcon size={sizes.iconSize} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title (What) */}
        <div
          style={{
            fontWeight: 600,
            fontSize: sizes.titleSize,
            color: colors.title,
            marginBottom: why || action ? 4 : 0,
          }}
        >
          {title}
        </div>

        {/* Why (Explanation) */}
        {why && (
          <div
            style={{
              fontSize: sizes.textSize,
              color: colors.text,
              lineHeight: 1.4,
              marginBottom: action ? 4 : 0,
            }}
          >
            {why}
          </div>
        )}

        {/* Action (Fix) */}
        {action && (
          <div
            style={{
              fontSize: sizes.textSize,
              color: colors.action,
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            💡 {action}
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <button onClick={onDismiss} style={dismissButtonStyles} aria-label="Dismiss message">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

// ============================================
// Variant Colors
// ============================================

const VARIANT_COLORS = {
  error: {
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.2)",
    icon: "var(--aqb-error)",
    title: "var(--aqb-text-primary)",
    text: "var(--aqb-text-secondary)",
    action: "var(--aqb-accent-blue)",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.2)",
    icon: "var(--aqb-warning)",
    title: "var(--aqb-text-primary)",
    text: "var(--aqb-text-secondary)",
    action: "var(--aqb-accent-blue)",
  },
  info: {
    bg: "rgba(59, 130, 246, 0.08)",
    border: "rgba(59, 130, 246, 0.2)",
    icon: "var(--aqb-info)",
    title: "var(--aqb-text-primary)",
    text: "var(--aqb-text-secondary)",
    action: "var(--aqb-accent-blue)",
  },
};

// ============================================
// Size Styles
// ============================================

const SIZE_STYLES = {
  sm: {
    padding: "8px 10px",
    iconSize: 14,
    titleSize: 12,
    textSize: 11,
  },
  md: {
    padding: "12px 14px",
    iconSize: 18,
    titleSize: 13,
    textSize: 12,
  },
};

// ============================================
// Base Styles
// ============================================

const containerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 10,
  borderRadius: "var(--aqb-radius-md)",
  border: "1px solid",
};

const iconContainerStyles: React.CSSProperties = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 1,
};

const dismissButtonStyles: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--aqb-text-tertiary)",
  cursor: "pointer",
  padding: 4,
  borderRadius: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: -2,
  marginRight: -4,
};

// ============================================
// Icons
// ============================================

interface IconProps {
  size: number;
}

const ErrorIcon: React.FC<IconProps> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const WarningIcon: React.FC<IconProps> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon: React.FC<IconProps> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

export default ErrorMessage;
