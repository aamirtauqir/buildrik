/**
 * Aquibra Select Field Component
 * Premium styled select with full accessibility
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectFieldProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  id?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  error,
  hint,
  fullWidth = true,
  size = "md",
  id,
}) => {
  const generatedId = React.useId();
  const selectId = id || generatedId;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint && !error ? `${selectId}-hint` : undefined;

  const sizeClasses = {
    sm: "aqb-input-sm",
    md: "",
    lg: "aqb-input-lg",
  };

  const selectClasses = [
    "aqb-input",
    "aqb-select",
    sizeClasses[size],
    error ? "aqb-input-error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Group options
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, SelectOption[]> = {};
    const ungrouped: SelectOption[] = [];

    options.forEach((opt) => {
      if (opt.group) {
        if (!groups[opt.group]) groups[opt.group] = [];
        groups[opt.group].push(opt);
      } else {
        ungrouped.push(opt);
      }
    });

    return { groups, ungrouped };
  }, [options]);

  return (
    <div className="aqb-field" style={{ width: fullWidth ? "100%" : "auto" }}>
      {label && (
        <label htmlFor={selectId} className="aqb-field-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={selectClasses}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={errorId || hintId}
        style={{
          color: value ? undefined : "var(--aqb-text-muted)",
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {groupedOptions.ungrouped.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
        {Object.entries(groupedOptions.groups).map(([group, opts]) => (
          <optgroup key={group} label={group}>
            {opts.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {error && (
        <span id={errorId} className="aqb-field-error" role="alert">
          {error}
        </span>
      )}
      {hint && !error && (
        <span id={hintId} className="aqb-field-hint">
          {hint}
        </span>
      )}
    </div>
  );
};

export default SelectField;
