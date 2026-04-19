/**
 * Input Controls for Pro Inspector
 * InputRow, InputWithUnit, SelectRow
 * @license BSD-3-Clause
 */

import { X } from "lucide-react";
import * as React from "react";
import { IconInfo } from "../../../../shared/ui/Icons";
import { Tooltip } from "../../../../shared/ui/Tooltip";
import { baseStyles } from "./controlStyles";

const overrideDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  backgroundColor: "var(--buildrick-accent, #3b82f6)",
  marginLeft: 4,
  display: "inline-block",
  verticalAlign: "middle",
};

/**
 * ResetButton — hover-revealed × that clears the current value.
 * Rendered inside a row that has `position: relative`. Visibility driven by
 * the row's hover state via a parent-scoped CSS class (`buildrick-row`) whose hover
 * selector toggles `opacity` on `.buildrick-reset`. Falls back to always-visible for
 * keyboard-only users via `:focus-visible`.
 */
const resetButtonStyle: React.CSSProperties = {
  position: "absolute",
  right: 4,
  top: "50%",
  transform: "translateY(-50%)",
  width: 18,
  height: 18,
  padding: 0,
  background: "rgba(0,0,0,0.3)",
  border: "none",
  borderRadius: 4,
  color: "var(--buildrick-text-tertiary)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0,
  transition: "opacity 0.12s, color 0.12s",
  pointerEvents: "none",
};

const ResetButton: React.FC<{
  onReset: () => void;
  label?: string;
  visible: boolean;
}> = ({ onReset, label = "Reset to default", visible }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onReset();
    }}
    aria-label={label}
    title={label}
    className="buildrick-reset"
    style={{
      ...resetButtonStyle,
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? "auto" : "none",
    }}
  >
    <X size={11} aria-hidden="true" />
  </button>
);

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

/** Returns true for valid CSS numeric input (including empty, partial negative, or CSS var) */
function isValidCSSNumber(val: string): boolean {
  if (val === "" || val === "-") return true;
  if (/^var\(--buildrick-design-/.test(val)) return true; // token binding — always valid, pass through
  return /^-?[\d.]+$/.test(val) && !isNaN(parseFloat(val));
}

/** Returns true if the value is a token var() binding — skip all parse/validate */
const isTokenVar = (val: string): boolean => /^var\(--buildrick-design-/.test(val);

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
  const [isRowHovered, setIsRowHovered] = React.useState(false);
  // Parse value and unit — token vars pass through as-is in the num field
  const parseValue = (val: string): { num: string; unit: string } => {
    if (val === "auto" || val === "none" || val === "inherit") {
      return { num: "", unit: val };
    }
    if (isTokenVar(val)) {
      return { num: val, unit: "px" }; // display the var() string, unit dropdown irrelevant
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
    // Token var() — pass through immediately, no validation
    if (isTokenVar(newVal)) {
      onChange(newVal);
      return;
    }
    const valid = isValidCSSNumber(newVal);
    setIsInvalid(!valid);
    if (valid && newVal !== "-" && newVal !== "") {
      commitValue(newVal);
    }
  };

  const handleInputBlur = () => {
    // Never revert a token var() binding on blur
    if (isTokenVar(inputValue)) {
      return;
    }
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
      ? { borderColor: "var(--buildrick-error, #ef4444)", outline: "1px solid var(--buildrick-error, #ef4444)" }
      : {}),
  };

  const hasValue = !disabled && value !== "" && value !== undefined;
  const showReset = hasValue && isRowHovered;

  return (
    <div
      style={{ ...baseStyles.row, position: "relative" }}
      onMouseEnter={() => setIsRowHovered(true)}
      onMouseLeave={() => setIsRowHovered(false)}
    >
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
        <div style={{ position: "relative", flex: 1, display: "flex" }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            style={{
              ...inputStyle,
              // Reserve space for the reset × so it never sits on top of text.
              paddingRight: showReset ? 22 : inputStyle.paddingRight,
            }}
            disabled={disabled || (unit === "auto" || unit === "none" || unit === "inherit") && !isTokenVar(inputValue)}
            aria-invalid={isInvalid}
          />
          <ResetButton
            onReset={() => {
              setInputValue("");
              setIsInvalid(false);
              onChange("");
            }}
            label={`Reset ${label}`}
            visible={showReset}
          />
        </div>
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
