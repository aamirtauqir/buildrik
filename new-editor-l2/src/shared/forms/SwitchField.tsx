/**
 * Aquibra Switch Field Component
 * Premium styled toggle switch
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface SwitchFieldProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  labelPosition?: "left" | "right";
  id?: string;
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  size = "md",
  labelPosition = "right",
  id,
}) => {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  const sizeConfig = {
    sm: { width: 32, height: 18, thumb: 14, offset: 2 },
    md: { width: 40, height: 22, thumb: 16, offset: 3 },
    lg: { width: 48, height: 26, thumb: 20, offset: 3 },
  };

  const s = sizeConfig[size];
  const thumbTranslate = checked ? s.width - s.thumb - s.offset * 2 : 0;

  return (
    <label
      htmlFor={switchId}
      className={`aqb-switch ${disabled ? "is-disabled" : ""}`}
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        flexDirection: labelPosition === "left" ? "row-reverse" : "row",
      }}
    >
      <input
        type="checkbox"
        id={switchId}
        checked={checked}
        onChange={(e) => !disabled && onChange?.(e.target.checked)}
        disabled={disabled}
        className="aqb-switch-input"
        role="switch"
        aria-checked={checked}
        style={{
          position: "absolute",
          opacity: 0,
          width: 0,
          height: 0,
        }}
      />
      <div
        className="aqb-switch-track"
        style={{
          width: s.width,
          height: s.height,
          background: checked ? "var(--aqb-primary)" : "var(--aqb-bg-panel-secondary)",
          borderColor: checked ? "var(--aqb-primary)" : "var(--aqb-border)",
        }}
      >
        <div
          className="aqb-switch-thumb"
          style={{
            width: s.thumb,
            height: s.thumb,
            top: s.offset,
            left: s.offset,
            transform: `translateX(${thumbTranslate}px)`,
          }}
        />
      </div>
      {label && (
        <span
          className="aqb-switch-label"
          style={{
            fontSize: size === "sm" ? "var(--aqb-text-sm)" : "var(--aqb-text-base)",
            color: disabled ? "var(--aqb-text-muted)" : "var(--aqb-text-primary)",
          }}
        >
          {label}
        </span>
      )}
    </label>
  );
};

export default SwitchField;
