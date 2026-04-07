/**
 * Input Controls for Pro Inspector
 * InputRow, InputWithUnit, SelectRow
 * @license BSD-3-Clause
 */

import * as React from "react";
import { IconInfo } from "../../../../shared/ui/Icons";
import { Tooltip } from "../../../../shared/ui/Tooltip";
import { baseStyles } from "./controlStyles";

const overrideDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  backgroundColor: "var(--aqb-primary, #3b82f6)",
  marginLeft: 4,
  display: "inline-block",
  verticalAlign: "middle",
};

// ============================================================================
// INPUT ROW
// ============================================================================

export interface InputRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  textarea?: boolean;
  isOverridden?: boolean;
  helperText?: string;
}

export const InputRow: React.FC<InputRowProps> = ({
  label,
  value,
  onChange,
  placeholder = "auto",
  type = "text",
  textarea = false,
  isOverridden,
  helperText,
}) => {
  return (
    <div style={baseStyles.row}>
      <label style={baseStyles.label}>
        {label}
        {isOverridden && <span style={overrideDotStyle} />}
        {helperText && (
          <Tooltip content={helperText} position="top">
            <span style={{ marginLeft: 4, display: "inline-flex", opacity: 0.5, cursor: "help" }}>
              <IconInfo size="xs" />
            </span>
          </Tooltip>
        )}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ ...baseStyles.input, minHeight: 80, resize: "vertical" }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={baseStyles.input}
        />
      )}
    </div>
  );
};

// ============================================================================
// INPUT WITH UNIT
// ============================================================================

export interface InputWithUnitProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  units?: string[];
  placeholder?: string;
  disabled?: boolean;
  disabledReason?: string;
  isOverridden?: boolean;
  helperText?: string;
}

/** Returns true for valid CSS numeric input (including empty, partial negative) */
function isValidCSSNumber(val: string): boolean {
  if (val === "" || val === "-") return true;
  return /^-?[\d.]+$/.test(val) && !isNaN(parseFloat(val));
}

export const InputWithUnit: React.FC<InputWithUnitProps> = ({
  label,
  value,
  onChange,
  units = ["px", "%", "em", "rem", "vw", "vh", "auto"],
  placeholder = "0",
  disabled = false,
  disabledReason,
  isOverridden,
  helperText,
}) => {
  // Parse value and unit
  const parseValue = (val: string): { num: string; unit: string } => {
    if (val === "auto" || val === "none" || val === "inherit") {
      return { num: "", unit: val };
    }
    const match = val.match(/^(-?[\d.]+)(.*)$/);
    if (match) {
      return { num: match[1], unit: match[2] || "px" };
    }
    return { num: val, unit: "px" };
  };

  const { num, unit } = parseValue(value);

  // Local input state — buffers keystrokes, validates on blur
  const [inputValue, setInputValue] = React.useState(num);
  const [isInvalid, setIsInvalid] = React.useState(false);

  // Sync from external prop (element deselection, undo, etc.)
  React.useEffect(() => {
    setInputValue(num);
    setIsInvalid(false);
  }, [num]);

  const commitValue = (newNum: string) => {
    if (unit === "auto" || unit === "none" || unit === "inherit") {
      onChange(newNum ? `${newNum}px` : "");
    } else {
      onChange(newNum ? `${newNum}${unit}` : "");
    }
  };

  const handleInputChange = (newVal: string) => {
    setInputValue(newVal);
    const valid = isValidCSSNumber(newVal);
    setIsInvalid(!valid);
    if (valid && newVal !== "-" && newVal !== "") {
      commitValue(newVal);
    }
  };

  const handleInputBlur = () => {
    if (!isValidCSSNumber(inputValue) || inputValue === "-") {
      // Revert to last known-good value from prop
      setInputValue(num);
      setIsInvalid(false);
    } else if (inputValue !== "" && inputValue !== "-") {
      commitValue(inputValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setInputValue(num);
      setIsInvalid(false);
      e.currentTarget.blur();
    } else if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const handleUnitChange = (newUnit: string) => {
    if (newUnit === "auto" || newUnit === "none" || newUnit === "inherit") {
      onChange(newUnit);
    } else if (isValidCSSNumber(inputValue) && inputValue !== "" && inputValue !== "-") {
      onChange(`${inputValue}${newUnit}`);
    }
  };

  const inputStyle: React.CSSProperties = {
    ...baseStyles.inputWithUnit,
    ...(isInvalid
      ? { borderColor: "var(--aqb-error, #ef4444)", outline: "1px solid var(--aqb-error, #ef4444)" }
      : {}),
  };

  return (
    <div style={baseStyles.row}>
      <label style={baseStyles.label} title={disabledReason}>
        {label}
        {isOverridden && <span style={overrideDotStyle} />}
        {helperText && (
          <Tooltip content={helperText} position="top">
            <span style={{ marginLeft: 4, display: "inline-flex", opacity: 0.5, cursor: "help" }}>
              <IconInfo size="xs" />
            </span>
          </Tooltip>
        )}
      </label>
      <div
        style={{
          display: "flex",
          flex: 1,
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? "none" : "auto",
        }}
        title={isInvalid ? "Invalid number — press Escape to revert" : disabledReason}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          style={inputStyle}
          disabled={disabled || unit === "auto" || unit === "none" || unit === "inherit"}
          aria-invalid={isInvalid}
        />
        <select
          value={unit}
          onChange={(e) => handleUnitChange(e.target.value)}
          style={baseStyles.unitSelect}
          disabled={disabled}
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

// ============================================================================
// SELECT ROW
// ============================================================================

export interface SelectRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  isOverridden?: boolean;
  helperText?: string;
  /** Label for the empty/unset option. Defaults to "Default". */
  placeholder?: string;
}

export const SelectRow: React.FC<SelectRowProps> = ({
  label,
  value,
  onChange,
  options,
  isOverridden,
  helperText,
  placeholder = "Default",
}) => {
  return (
    <div style={baseStyles.row}>
      <label style={baseStyles.label}>
        {label}
        {isOverridden && <span style={overrideDotStyle} />}
        {helperText && (
          <Tooltip content={helperText} position="top">
            <span style={{ marginLeft: 4, display: "inline-flex", opacity: 0.5, cursor: "help" }}>
              <IconInfo size="xs" />
            </span>
          </Tooltip>
        )}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={baseStyles.select}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
