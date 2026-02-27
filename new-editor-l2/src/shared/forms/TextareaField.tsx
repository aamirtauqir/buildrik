/**
 * Aquibra Textarea Field Component
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface TextareaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  error,
  hint,
  resize = "vertical",
  className = "",
  style,
  ...props
}) => {
  return (
    <div className={`aqb-textarea-field ${className}`} style={{ width: "100%", ...style }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: 6,
            fontSize: 12,
            color: "var(--aqb-text-secondary)",
          }}
        >
          {label}
        </label>
      )}
      <textarea
        {...props}
        style={{
          width: "100%",
          minHeight: 80,
          padding: "8px 12px",
          background: "var(--aqb-bg-dark)",
          border: `1px solid ${error ? "var(--aqb-error)" : "var(--aqb-border)"}`,
          borderRadius: 6,
          color: "var(--aqb-text-primary)",
          fontSize: 13,
          fontFamily: "inherit",
          outline: "none",
          resize,
          transition: "border-color 0.15s ease",
        }}
      />
      {(error || hint) && (
        <span
          style={{
            display: "block",
            marginTop: 4,
            fontSize: 11,
            color: error ? "var(--aqb-error)" : "var(--aqb-text-muted)",
          }}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
};

export default TextareaField;
