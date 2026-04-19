/**
 * Aquibra Input Field Component
 * Premium styled input with full accessibility
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface InputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  hint,
  size = "md",
  leftIcon,
  rightIcon,
  fullWidth = true,
  className = "",
  disabled,
  id,
  ...props
}) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint && !error ? `${inputId}-hint` : undefined;

  const sizeClasses = {
    sm: "buildrick-input-sm",
    md: "",
    lg: "buildrick-input-lg",
  };

  const inputClasses = [
    "buildrick-input",
    sizeClasses[size],
    error ? "buildrick-input-error" : "",
    leftIcon ? "buildrick-input-with-left-icon" : "",
    rightIcon ? "buildrick-input-with-right-icon" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`buildrick-field ${className}`} style={{ width: fullWidth ? "100%" : "auto" }}>
      {label && (
        <label htmlFor={inputId} className="buildrick-field-label">
          {label}
        </label>
      )}
      <div className="buildrick-input-wrapper">
        {leftIcon && <span className="buildrick-input-icon buildrick-input-icon-left">{leftIcon}</span>}
        <input
          {...props}
          id={inputId}
          disabled={disabled}
          className={inputClasses}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId || hintId}
          style={{
            paddingLeft: leftIcon ? 38 : undefined,
            paddingRight: rightIcon ? 38 : undefined,
          }}
        />
        {rightIcon && <span className="buildrick-input-icon buildrick-input-icon-right">{rightIcon}</span>}
      </div>
      {error && (
        <span id={errorId} className="buildrick-field-error" role="alert">
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={hintId} className="buildrick-field-hint">
          {hint}
        </span>
      )}
    </div>
  );
};

export default InputField;
