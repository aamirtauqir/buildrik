/**
 * Aquibra Button Group Field
 * Premium styled segmented control
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface ButtonGroupOption {
  value: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface ButtonGroupFieldProps {
  label?: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: ButtonGroupOption[];
  multiple?: boolean;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const ButtonGroupField: React.FC<ButtonGroupFieldProps> = ({
  label,
  value,
  onChange,
  options,
  multiple = false,
  size = "md",
  fullWidth = false,
  disabled = false,
  className,
  id,
}) => {
  const generatedId = React.useId();
  const groupId = id || generatedId;

  const sizeClasses = {
    sm: "aqb-btn-group-sm",
    md: "",
    lg: "aqb-btn-group-lg",
  };

  const isSelected = (optValue: string) => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optValue);
    }
    return value === optValue;
  };

  const handleClick = (optValue: string) => {
    if (disabled) return;

    if (multiple && Array.isArray(value)) {
      if (value.includes(optValue)) {
        onChange(value.filter((v) => v !== optValue));
      } else {
        onChange([...value, optValue]);
      }
    } else {
      onChange(optValue);
    }
  };

  return (
    <div className={`aqb-field aqb-button-group-field ${className || ""}`}>
      {label && (
        <label htmlFor={groupId} className="aqb-field-label">
          {label}
        </label>
      )}

      <div
        id={groupId}
        role="group"
        aria-label={label}
        className={`aqb-btn-group ${sizeClasses[size]} ${fullWidth ? "aqb-btn-group-full" : ""}`}
      >
        {options.map((option) => {
          const selected = isSelected(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleClick(option.value)}
              disabled={disabled || option.disabled}
              className={`aqb-btn-group-item ${selected ? "is-selected" : ""}`}
              aria-pressed={selected}
              aria-disabled={disabled || option.disabled}
            >
              {option.icon && <span className="aqb-btn-group-icon">{option.icon}</span>}
              {option.label && <span className="aqb-btn-group-label">{option.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// SVG Icons for button groups
const AlignLeftIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="21" x2="3" y1="6" y2="6" />
    <line x1="15" x2="3" y1="12" y2="12" />
    <line x1="17" x2="3" y1="18" y2="18" />
  </svg>
);
const AlignCenterIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="21" x2="3" y1="6" y2="6" />
    <line x1="17" x2="7" y1="12" y2="12" />
    <line x1="19" x2="5" y1="18" y2="18" />
  </svg>
);
const AlignRightIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="21" x2="3" y1="6" y2="6" />
    <line x1="21" x2="9" y1="12" y2="12" />
    <line x1="21" x2="7" y1="18" y2="18" />
  </svg>
);
const AlignJustifyIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="21" x2="3" y1="6" y2="6" />
    <line x1="21" x2="3" y1="12" y2="12" />
    <line x1="21" x2="3" y1="18" y2="18" />
  </svg>
);

// Common presets
export const alignmentOptions: ButtonGroupOption[] = [
  { value: "left", icon: <AlignLeftIcon /> },
  { value: "center", icon: <AlignCenterIcon /> },
  { value: "right", icon: <AlignRightIcon /> },
  { value: "justify", icon: <AlignJustifyIcon /> },
];

export const fontStyleOptions: ButtonGroupOption[] = [
  { value: "bold", icon: <strong style={{ fontWeight: 700 }}>B</strong> },
  { value: "italic", icon: <em style={{ fontStyle: "italic" }}>I</em> },
  { value: "underline", icon: <span style={{ textDecoration: "underline" }}>U</span> },
  { value: "strike", icon: <span style={{ textDecoration: "line-through" }}>S</span> },
];

export const displayOptions: ButtonGroupOption[] = [
  { value: "block", label: "Block" },
  { value: "flex", label: "Flex" },
  { value: "grid", label: "Grid" },
  { value: "inline", label: "Inline" },
];

export default ButtonGroupField;
