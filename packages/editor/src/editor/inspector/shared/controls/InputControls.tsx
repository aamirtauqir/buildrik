/**
 * Input Controls — InputRow, InputWithUnit, SelectRow.
 * Ported to .bdi-num / .bdi-text / .bdi-row-ctrl per comp-inspector.v1 design.
 *
 * @license BSD-3-Clause
 */

import { Info, X } from "lucide-react";
import * as React from "react";
import { TextField, BK_SELECT_BARE_UNIT_THEME, BK_SELECT_BARE_VALUE_THEME, Button, Select, Textarea, TextInput, Tooltip } from "@/editor/chrome-ui";
// ============================================================================
// HELPERS
// ============================================================================

const OverrideDot: React.FC = () => (
  <span className="bdi-override-dot" aria-hidden="true" />
);

const HelperIcon: React.FC<{ text: string }> = ({ text }) => (
  <Tooltip content={text} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
    <span
      style={{
        marginLeft: 4,
        display: "inline-flex",
        opacity: 0.5,
        cursor: "help",
      }}
    >
      <Info size={12} />
    </span>
  </Tooltip>
);

// ============================================================================
// INPUT ROW (text / textarea — full-width .bdi-text)
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
}) => (
  <div className="bdi-row-ctrl">
    <label className="bdi-lb">
      {label}
      {isOverridden && <OverrideDot />}
      {helperText && <HelperIcon text={helperText} />}
    </label>
    <div className="bdi-row-content">
      {textarea ? (
        <Textarea
          className="bdi-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <TextField
          className="bdi-text"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  </div>
);

// ============================================================================
// INPUT WITH UNIT (.bdi-num with inline unit selector)
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
  /** Optional single-char or short label shown as the leading icon slot
   *  (Figma-style). When omitted the field renders without an inline icon
   *  and uses the outer row label only. */
  fieldIcon?: React.ReactNode;
  /**
   * Accessible name for rows drawn WITHOUT a visible label — the paired
   * fields (Size | line-height, W | H). The row's `<label>` is a bare
   * element with no `htmlFor` and it does not wrap the input, so it names
   * nothing; when there is no visible label there is nothing to fall back to
   * either. Measured live: nine inputs in the inspector column had no
   * accessible name at all, while the unit `Select` and the reset `Button`
   * beside them were both named.
   */
  ariaLabel?: string;
}

function isValidCSSNumber(val: string): boolean {
  if (val === "" || val === "-") return true;
  if (/^var\(--buildrick-design-/.test(val)) return true;
  return /^-?[\d.]+$/.test(val) && !isNaN(parseFloat(val));
}

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
  fieldIcon,
  ariaLabel,
}) => {
  const [isRowHovered, setIsRowHovered] = React.useState(false);

  const parseValue = (val: string): { num: string; unit: string } => {
    if (val === "auto" || val === "none" || val === "inherit") {
      return { num: "", unit: val };
    }
    if (isTokenVar(val)) {
      return { num: val, unit: "px" };
    }
    const match = val.match(/^(-?[\d.]+)(.*)$/);
    if (match) {
      return { num: match[1], unit: match[2] || "px" };
    }
    return { num: val, unit: "px" };
  };

  const { num, unit } = parseValue(value);

  const [inputValue, setInputValue] = React.useState(num);
  const [isInvalid, setIsInvalid] = React.useState(false);

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
    if (isTokenVar(inputValue)) return;
    if (!isValidCSSNumber(inputValue) || inputValue === "-") {
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

  const hasValue = !disabled && value !== "" && value !== undefined;
  const showReset = hasValue && isRowHovered && !isTokenVar(inputValue);

  const isKeywordUnit = unit === "auto" || unit === "none" || unit === "inherit";

  return (
    /* An unlabelled field takes the whole row: the 88px label column is for a
       label, and leaving it standing squeezed paired fields (Size | line
       height, W | H) down to about 39px — enough to read "inhe". */
    <div
      className={`bdi-row-ctrl${disabled ? " disabled" : ""}`}
      style={label ? undefined : { gridTemplateColumns: "1fr" }}
      title={disabledReason}
    >
      {label ? (
        <label className="bdi-lb">
          {label}
          {isOverridden && <OverrideDot />}
          {helperText && <HelperIcon text={helperText} />}
        </label>
      ) : null}
      <div className="bdi-row-content">
        <div
          className={`bdi-fld${isInvalid ? " invalid" : ""}`}
          onMouseEnter={() => setIsRowHovered(true)}
          onMouseLeave={() => setIsRowHovered(false)}
          title={isInvalid ? "Invalid number — press Escape to revert" : disabledReason}
        >
          {fieldIcon && <span className="bdi-flb">{fieldIcon}</span>}
          <TextInput
            type="text"
            value={isKeywordUnit && !isTokenVar(inputValue) ? unit : inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            aria-label={ariaLabel || label || placeholder}
            // `.bdi-fld input.auto` (inspector.css) is a real, unlayered CSS
            // rule keyed off a class on the actual <input> — flowbite's
            // TextInput only ever puts `className` on the OUTER wrapper div
            // (same structural gap `selectTheme.ts` documents for Select),
            // so the "auto" class has to reach the input through `theme`,
            // not `className`.
            theme={{ field: { input: { base: isKeywordUnit ? "auto" : "" } } }}
            disabled={disabled || (isKeywordUnit && !isTokenVar(inputValue))}
            aria-invalid={isInvalid}
            style={{
              paddingLeft: fieldIcon ? 0 : 8,
              paddingRight: showReset ? 22 : undefined,
            }}
          />
          {showReset && (
            <Button
              color="light"
              size="xs"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setInputValue("");
                setIsInvalid(false);
                onChange("");
              }}
              aria-label={`Reset ${label}`}
              title={`Reset ${label}`}
              style={{
                position: "absolute",
                right: 28,
                top: "50%",
                transform: "translateY(-50%)",
                width: 14,
                height: 14,
                padding: 0,
                background: "rgba(15, 23, 42, 0.06)",
                border: "none",
                borderRadius: 3,
                color: "var(--bk-ink-muted)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
            >
              <X size={9} aria-hidden="true" />
            </Button>
          )}
          {!isKeywordUnit && (
            <Select
              className="bdi-u"
              theme={BK_SELECT_BARE_UNIT_THEME}
              value={unit}
              onChange={(e) => handleUnitChange(e.target.value)}
              disabled={disabled}
              aria-label={`${label} unit`}
              style={{ appearance: "none", WebkitAppearance: "none" }}
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SELECT ROW (styled select using .bdi-num frame)
// ============================================================================

export interface SelectRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  isOverridden?: boolean;
  helperText?: string;
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
  /* The label sat beside the <select> with nothing tying them together, so
     six selects in the inspector announced no name at all — a screen reader
     read the option list and never what it was choosing. */
  const id = React.useId();
  return (
    <div className="bdi-row-ctrl">
      <label className="bdi-lb" htmlFor={id}>
        {label}
        {isOverridden && <OverrideDot />}
        {helperText && <HelperIcon text={helperText} />}
      </label>
      <div className="bdi-row-content">
        <div className="bdi-ddn">
          <Select
            id={id}
            className="bdi-v"
            theme={BK_SELECT_BARE_VALUE_THEME}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <span className="bdi-c" aria-hidden="true">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
};
