/**
 * Aquibra FormField Component
 * Professional form field wrapper with validation UI
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface FormFieldProps {
  /** Field label */
  label?: string;
  /** Field description/help text */
  description?: string;
  /** Error message */
  error?: string;
  /** Warning message */
  warning?: string;
  /** Success message */
  success?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the field is optional (shows "Optional" badge) */
  optional?: boolean;
  /** Field ID for accessibility */
  htmlFor?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Layout direction */
  layout?: "vertical" | "horizontal";
  /** Children (input element) */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

const sizeStyles = {
  sm: { labelSize: 11, descSize: 11, gap: 4, inputGap: 6 },
  md: { labelSize: 12, descSize: 12, gap: 6, inputGap: 8 },
  lg: { labelSize: 14, descSize: 13, gap: 8, inputGap: 10 },
};

export const FormField: React.FC<FormFieldProps> = ({
  label,
  description,
  error,
  warning,
  success,
  required = false,
  disabled = false,
  optional = false,
  htmlFor,
  size = "md",
  layout = "vertical",
  children,
  className = "",
}) => {
  const sizes = sizeStyles[size];
  const hasMessage = error || warning || success;
  const messageType = error ? "error" : warning ? "warning" : success ? "success" : null;
  const message = error || warning || success;

  const messageColors = {
    error: "var(--aqb-error, #ef4444)",
    warning: "var(--aqb-warning, #f59e0b)",
    success: "var(--aqb-success, #10b981)",
  };

  const messageIcons = {
    error: (
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    warning: (
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    success: (
      <svg
        width={12}
        height={12}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  };

  const isHorizontal = layout === "horizontal";

  return (
    <div
      className={`aqb-form-field aqb-form-field-${size} aqb-form-field-${layout} ${
        error ? "aqb-form-field-error" : ""
      } ${disabled ? "aqb-form-field-disabled" : ""} ${className}`}
      style={{
        display: "flex",
        flexDirection: isHorizontal ? "row" : "column",
        gap: isHorizontal ? 12 : sizes.gap,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {/* Label Section */}
      {label && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            ...(isHorizontal ? { minWidth: 100, paddingTop: 8 } : {}),
          }}
        >
          <label
            htmlFor={htmlFor}
            style={{
              fontSize: sizes.labelSize,
              fontWeight: 600,
              color: "var(--aqb-text-secondary, #94a3b8)",
              letterSpacing: "0.3px",
            }}
          >
            {label}
          </label>
          {required && (
            <span
              style={{
                color: "var(--aqb-error, #ef4444)",
                fontWeight: 600,
                fontSize: sizes.labelSize,
              }}
              aria-hidden="true"
            >
              *
            </span>
          )}
          {optional && !required && (
            <span
              style={{
                fontSize: 12,
                color: "var(--aqb-text-muted, #64748b)",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              Optional
            </span>
          )}
        </div>
      )}

      {/* Input Section */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: sizes.inputGap }}>
        {/* Description above input */}
        {description && !hasMessage && (
          <p
            style={{
              margin: 0,
              fontSize: sizes.descSize,
              color: "var(--aqb-text-muted, #64748b)",
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        )}

        {/* Input element with error styling context */}
        <div
          className={`aqb-form-field-input ${error ? "has-error" : ""}`}
          style={
            error
              ? ({
                  "--input-border-color": "var(--aqb-error)",
                  "--input-focus-shadow": "0 0 0 2px rgba(239, 68, 68, 0.2)",
                } as React.CSSProperties)
              : undefined
          }
        >
          {children}
        </div>

        {/* Message below input */}
        {hasMessage && messageType && (
          <div
            className={`aqb-form-field-message aqb-form-field-${messageType}`}
            role={messageType === "error" ? "alert" : "status"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: sizes.descSize,
              color: messageColors[messageType],
            }}
          >
            <span style={{ flexShrink: 0 }}>{messageIcons[messageType]}</span>
            <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Form Group - for grouping related fields
export interface FormGroupProps {
  /** Group title */
  title?: string;
  /** Group description */
  description?: string;
  /** Children fields */
  children: React.ReactNode;
  /** Layout direction */
  layout?: "vertical" | "horizontal" | "grid";
  /** Number of columns for grid layout */
  columns?: number;
  /** Gap between fields */
  gap?: number;
  /** Additional class name */
  className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  title,
  description,
  children,
  layout = "vertical",
  columns = 2,
  gap = 16,
  className = "",
}) => {
  const layoutStyles: Record<string, React.CSSProperties> = {
    vertical: { display: "flex", flexDirection: "column", gap },
    horizontal: { display: "flex", flexDirection: "row", gap, flexWrap: "wrap" },
    grid: { display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap },
  };

  return (
    <fieldset
      className={`aqb-form-group aqb-form-group-${layout} ${className}`}
      style={{
        margin: 0,
        padding: 0,
        border: "none",
      }}
    >
      {(title || description) && (
        <div style={{ marginBottom: 16 }}>
          {title && (
            <legend
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--aqb-text-primary, #f8fafc)",
                marginBottom: description ? 4 : 0,
              }}
            >
              {title}
            </legend>
          )}
          {description && (
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "var(--aqb-text-muted, #64748b)",
              }}
            >
              {description}
            </p>
          )}
        </div>
      )}
      <div style={layoutStyles[layout]}>{children}</div>
    </fieldset>
  );
};

// Form Actions - for form buttons
export interface FormActionsProps {
  children: React.ReactNode;
  /** Alignment */
  align?: "left" | "center" | "right" | "between";
  /** Gap between buttons */
  gap?: number;
  /** Add top border */
  bordered?: boolean;
  /** Additional class name */
  className?: string;
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  align = "right",
  gap = 12,
  bordered = false,
  className = "",
}) => {
  const alignStyles: Record<string, React.CSSProperties> = {
    left: { justifyContent: "flex-start" },
    center: { justifyContent: "center" },
    right: { justifyContent: "flex-end" },
    between: { justifyContent: "space-between" },
  };

  return (
    <div
      className={`aqb-form-actions ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap,
        marginTop: 20,
        paddingTop: bordered ? 20 : 0,
        borderTop: bordered ? "1px solid var(--aqb-border, #334155)" : "none",
        ...alignStyles[align],
      }}
    >
      {children}
    </div>
  );
};

export default FormField;
