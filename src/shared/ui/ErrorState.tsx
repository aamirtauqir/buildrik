/**
 * Aquibra ErrorState Component
 * Professional error display with recovery options
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "./Button";

export type ErrorSeverity = "error" | "warning" | "info";

export interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error message or description */
  message: string;
  /** Error details (technical info, stack trace, etc.) */
  details?: string;
  /** Error severity level */
  severity?: ErrorSeverity;
  /** Retry action */
  onRetry?: () => void;
  /** Retry button label */
  retryLabel?: string;
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Show details toggle */
  showDetailsToggle?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Inline mode (for smaller spaces) */
  inline?: boolean;
  /** Additional class name */
  className?: string;
}

const severityConfig: Record<
  ErrorSeverity,
  { icon: string; color: string; bgColor: string; borderColor: string }
> = {
  error: {
    icon: "✕",
    color: "var(--aqb-error, #ef4444)",
    bgColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  warning: {
    icon: "⚠",
    color: "var(--aqb-warning, #f59e0b)",
    bgColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  info: {
    icon: "ℹ",
    color: "var(--aqb-info, #3b82f6)",
    bgColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.3)",
  },
};

const sizeStyles = {
  sm: {
    padding: "16px",
    iconSize: 24,
    iconPadding: 8,
    titleSize: 13,
    messageSize: 12,
    gap: 8,
  },
  md: {
    padding: "24px",
    iconSize: 32,
    iconPadding: 12,
    titleSize: 15,
    messageSize: 13,
    gap: 12,
  },
  lg: {
    padding: "40px",
    iconSize: 48,
    iconPadding: 16,
    titleSize: 18,
    messageSize: 14,
    gap: 16,
  },
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  details,
  severity = "error",
  onRetry,
  retryLabel = "Try again",
  secondaryAction,
  showDetailsToggle = true,
  size = "md",
  inline = false,
  className = "",
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const config = severityConfig[severity];
  const sizes = sizeStyles[size];

  const defaultTitles: Record<ErrorSeverity, string> = {
    error: "Something went wrong",
    warning: "Warning",
    info: "Information",
  };

  if (inline) {
    return (
      <div
        className={`aqb-error-state aqb-error-state-inline aqb-error-${severity} ${className}`}
        role="alert"
        aria-live="polite"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          background: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          borderRadius: "var(--aqb-radius-md, 8px)",
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: config.color,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: "bold",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {config.icon}
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 13,
            color: "var(--aqb-text-primary, #f8fafc)",
          }}
        >
          {message}
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              background: "transparent",
              border: "none",
              color: config.color,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            {retryLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`aqb-error-state aqb-error-state-${size} aqb-error-${severity} ${className}`}
      role="alert"
      aria-live="polite"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: sizes.padding,
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: "var(--aqb-radius-lg, 12px)",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: sizes.iconSize + sizes.iconPadding * 2,
          height: sizes.iconSize + sizes.iconPadding * 2,
          borderRadius: "50%",
          background: config.bgColor,
          border: `2px solid ${config.borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: sizes.gap,
        }}
        aria-hidden="true"
      >
        <span
          style={{
            fontSize: sizes.iconSize * 0.5,
            color: config.color,
            fontWeight: "bold",
          }}
        >
          {config.icon}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          margin: 0,
          marginBottom: sizes.gap / 2,
          fontSize: sizes.titleSize,
          fontWeight: 600,
          color: "var(--aqb-text-primary, #f8fafc)",
        }}
      >
        {title || defaultTitles[severity]}
      </h3>

      {/* Message */}
      <p
        style={{
          margin: 0,
          marginBottom: sizes.gap,
          fontSize: sizes.messageSize,
          color: "var(--aqb-text-muted, #64748b)",
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        {message}
      </p>

      {/* Details toggle */}
      {details && showDetailsToggle && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--aqb-text-secondary, #94a3b8)",
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginBottom: sizes.gap,
          }}
          aria-expanded={showDetails}
        >
          <span
            style={{
              transform: showDetails ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 150ms ease",
            }}
          >
            ▶
          </span>
          {showDetails ? "Hide details" : "Show details"}
        </button>
      )}

      {/* Details content */}
      {details && showDetails && (
        <pre
          style={{
            margin: 0,
            marginBottom: sizes.gap,
            padding: 12,
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: "var(--aqb-radius-md, 8px)",
            border: "1px solid var(--aqb-border, #334155)",
            fontSize: 11,
            fontFamily: "var(--aqb-font-mono, monospace)",
            color: "var(--aqb-text-secondary, #94a3b8)",
            textAlign: "left",
            maxWidth: "100%",
            maxHeight: 200,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {details}
        </pre>
      )}

      {/* Actions */}
      {(onRetry || secondaryAction) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: sizes.gap / 2,
          }}
        >
          {onRetry && (
            <Button
              variant="primary"
              size={size === "lg" ? "md" : "sm"}
              onClick={onRetry}
              icon={
                <svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M1 4v6h6M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
                </svg>
              }
            >
              {retryLabel}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size={size === "lg" ? "md" : "sm"}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Form Field Error - for inline form validation
export interface FieldErrorProps {
  message: string;
  className?: string;
}

export const FieldError: React.FC<FieldErrorProps> = ({ message, className = "" }) => {
  return (
    <span
      className={`aqb-field-error ${className}`}
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
        fontSize: 12,
        color: "var(--aqb-error, #ef4444)",
      }}
    >
      <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" opacity={0.2} />
        <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
      </svg>
      {message}
    </span>
  );
};

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorState
          title="Something went wrong"
          message="An unexpected error occurred in this component."
          details={this.state.error?.stack}
          onRetry={this.handleReset}
          retryLabel="Reset"
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorState;
