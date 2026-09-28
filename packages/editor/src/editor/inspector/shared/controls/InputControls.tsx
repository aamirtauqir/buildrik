/**
 * Input Controls — InputRow, InputWithUnit, SelectRow.
 *
 * Inspector v4 row look (board 1): a 28 row, the label left in a 108 column,
 * a 160 × 24 control on gray-50. A number field carries a stepper and a unit
 * dropdown (board 1 "Font size 32 ⇕ px ▾"); a select carries its chevron.
 *
 * Every control reads the field context (InspectorFieldContext): read-only
 * keeps the value legible and refuses the change (DD-18, never `disabled`),
 * a multi-selection that disagrees reads "Mixed", an override draws its dot.
 *
 * @license BSD-3-Clause
 */

import { isTokenVar, resolveTokenVar } from "../tokenBindingDetection";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import * as React from "react";
import { fieldTestId, labelTestId, rowTestId } from "./ControlRow";
import { FieldDot } from "./FieldDot";
import { useInspectorField, mixedName } from "./InspectorFieldContext";
import { ErrorLine, useFieldError } from "./Section";
import { TextField, BK_SELECT_BARE_UNIT_THEME, BK_SELECT_BARE_VALUE_THEME, Select, Textarea, TextInput, Tooltip } from "@/editor/chrome-ui";

// ============================================================================
// HELPERS
// ============================================================================

const OverrideDot: React.FC = () => (
  <span className="bdi-override-dot" aria-hidden="true" />
);

const HelperIcon: React.FC<{ text: string }> = ({ text }) => (
  <Tooltip content={text} placement="bottom" arrow={false} className="tw:max-w-[280px] tw:whitespace-normal">
    <span className="tw:ml-1 tw:inline-flex tw:cursor-help tw:opacity-50">
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
  /** The CSS property this row edits — the field context reads read-only,
   *  "Mixed" and its override dot by it (InspectorFieldContext). */
  property?: string;
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
  property,
}) => {
  const field = useInspectorField(property);
  /* The label sat next to the control with nothing joining them, so every row
     in the inspector had a visible label and no accessible name: a screen
     reader announced "edit text", and `getByLabelText` could not find the
     control it obviously belongs to. `htmlFor` costs one id. */
  const controlId = React.useId();
  return (
  <div className="bdi-row-ctrl" data-testid={rowTestId(label)}>
    <label className="bdi-lb" data-testid={labelTestId(label)} htmlFor={controlId}>
      {label}
      {isOverridden && <OverrideDot />}
      <FieldDot field={field} />
      {helperText && <HelperIcon text={helperText} />}
    </label>
    <div className="bdi-row-content">
      {textarea ? (
        <Textarea
          id={controlId}
          className="bdi-text"
          readOnly={field.readOnly}
          aria-readonly={field.readOnly || undefined}
          aria-label={field.mixed ? mixedName(label) : undefined}
          value={field.mixed ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.mixed ? "Mixed" : placeholder}
        />
      ) : (
        <TextField
          id={controlId}
          className="bdi-text"
          readOnly={field.readOnly}
          aria-readonly={field.readOnly || undefined}
          aria-label={field.mixed ? mixedName(label) : undefined}
          type={type}
          value={field.mixed ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.mixed ? "Mixed" : placeholder}
        />
      )}
    </div>
  </div>
  );
};

// ============================================================================
// INPUT WITH UNIT — number + stepper + unit dropdown (board 1, board 34)
// ============================================================================

export interface InputWithUnitProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  units?: string[];
  placeholder?: string;
  /**
   * Accessible name for rows drawn WITHOUT a visible label — the paired
   * fields. With no visible label there is nothing else to name the field.
   */
  ariaLabel?: string;
  /** The CSS property this row edits — the field context reads read-only,
   *  "Mixed" and its override dot by it (InspectorFieldContext). */
  property?: string;
  /** A plain count (grid Columns, board 17): the number and its stepper, no
   *  unit dropdown and no unit words in the name. */
  noUnit?: boolean;
}

const NO_UNITS: readonly string[] = [""];

/** Board 34. The one message every number field shows for an entry it cannot read. */
export const NUMBER_ERROR = "Enter a valid number. Choose the unit separately.";

const KEYWORDS = new Set(["auto", "none", "inherit", "normal", "initial"]);

/** What a unit adds to the field's name ("Font size in pixels"). */
const UNIT_WORDS: Record<string, string> = {
  px: "in pixels",
  "%": "in percent",
  em: "in em",
  rem: "in rem",
  vw: "in viewport width",
  vh: "in viewport height",
  deg: "in degrees",
  ms: "in milliseconds",
  s: "in seconds",
  fr: "in fractions",
  "": "as a multiplier",
};

/** The unit words for a value, or "" when it has none to speak of. */
export function unitWords(unit: string): string {
  if (KEYWORDS.has(unit)) return "";
  return UNIT_WORDS[unit] ?? `in ${unit}`;
}

/** A value as the field shows it: the number and its unit. */
function splitValue(val: string, units: readonly string[]): { num: string; unit: string } {
  if (KEYWORDS.has(val)) return { num: "", unit: val };
  /* A token-bound value shows what it resolves to ("40", px) — never the raw
     `var(…)` (6894:74644). The value itself stays bound until edited. */
  if (isTokenVar(val)) {
    const resolved = resolveTokenVar(val);
    const m = resolved.match(/^(-?[\d.]+)(.*)$/);
    return m ? { num: m[1], unit: m[2] || "px" } : { num: resolved || val, unit: "px" };
  }
  const match = val.match(/^(-?[\d.]+)(.*)$/);
  /* A unitless number is its own unit when the field offers "" (line
     height's "1.5 ×", 7079:79176). */
  const bare = units.includes("") ? "" : "px";
  if (match) return { num: match[1], unit: match[2] || bare };
  return { num: val, unit: val === "" ? (units[0] ?? "px") : "px" };
}

const NUMBER = /^-?(\d+\.?\d*|\.\d+)$/;

/**
 * Read what was typed (DD-19): 24 · 24px · 2rem · 50% · auto · a token.
 * A bare number takes the field's current unit. `null` = cannot be read.
 */
export function parseEntry(raw: string, units: readonly string[], currentUnit: string): string | null {
  const text = raw.trim().toLowerCase();
  if (text === "") return "";
  if (isTokenVar(raw.trim())) return raw.trim();
  if (KEYWORDS.has(text)) return units.includes(text) ? text : null;
  const m = text.match(/^(-?(?:\d+\.?\d*|\.\d+))\s*([a-z%]*)$/);
  if (!m) return null;
  const [, num, typed] = m;
  if (typed) return units.includes(typed) ? `${num}${typed}` : null;
  const unit = KEYWORDS.has(currentUnit) ? (units.find((u) => !KEYWORDS.has(u)) ?? "px") : currentUnit;
  return `${num}${unit}`;
}

export const InputWithUnit: React.FC<InputWithUnitProps> = ({
  label,
  value,
  onChange,
  units: unitsProp = ["px", "%", "em", "rem", "vw", "vh", "auto"],
  placeholder = "0",
  ariaLabel,
  property,
  noUnit = false,
}) => {
  const field = useInspectorField(property);
  const units = noUnit ? NO_UNITS : unitsProp;
  const { num, unit } = splitValue(value, units);
  const isKeyword = KEYWORDS.has(unit);
  const shown = isKeyword ? unit : num;

  const [text, setText] = React.useState(shown);
  const [invalid, setInvalid] = React.useState(false);
  const errorId = useFieldError(invalid ? NUMBER_ERROR : null);

  /* A new value from outside (another element, an undo) replaces whatever
     is in the field, including an entry it could not read. */
  React.useEffect(() => {
    setText(shown);
    setInvalid(false);
  }, [shown]);

  const restore = () => {
    setText(shown);
    setInvalid(false);
  };

  /* Enter / blur: read the entry. Unreadable → red border + the message, the
     entry stays so it can be corrected, the element keeps its old value. */
  const commit = () => {
    if (field.readOnly || (field.mixed && text === "")) return;
    const next = parseEntry(text, units, unit);
    if (next === null) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    /* Emptied = clear the property (DD-19, P-11d); an empty field left empty
       writes nothing. */
    if (next === "" && value === "") return;
    if (next !== value) onChange(next);
  };

  const step = (delta: number) => {
    if (field.readOnly || isKeyword || isTokenVar(value)) return;
    const base = text === "" || invalid ? Number(num || 0) : Number(text);
    if (!Number.isFinite(base)) return;
    const next = String(Math.round((base + delta) * 100) / 100);
    setText(next);
    setInvalid(false);
    onChange(`${next}${unit}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      step((e.shiftKey ? 10 : 1) * (e.key === "ArrowUp" ? 1 : -1));
    } else if (e.key === "Escape") {
      e.preventDefault();
      restore();
    } else if (e.key === "Enter") {
      commit();
    }
  };

  const onUnitChange = (next: string) => {
    if (field.readOnly) return;
    if (KEYWORDS.has(next)) onChange(next);
    else if (num !== "" && NUMBER.test(num)) onChange(`${num}${next}`);
  };

  /* The name is the row's label (or `ariaLabel`) plus the unit or "mixed
     values" (§16: "Font size in pixels"): two ids, so the visible label stays
     the label and the unit words live in one hidden span. */
  const inputId = React.useId();
  const nameId = React.useId();
  const suffixId = React.useId();
  const ownName = ariaLabel || !label;
  const suffix = field.mixed ? "Mixed values" : isTokenVar(value) || noUnit ? "" : unitWords(unit);
  const name = ariaLabel || label || placeholder;

  const control = (
    <div
      data-testid={label ? fieldTestId(label) : undefined}
      className={`bdi-fld${invalid ? " invalid" : ""}${field.mixed ? " mixed" : ""}`}
    >
      <TextInput
        type="text"
        value={field.mixed ? "" : text}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          if (invalid) setInvalid(false);
          /* A plain number is written as it is typed (live on the canvas);
             anything else waits for Enter / blur to be read. */
          if (!field.readOnly && NUMBER.test(next.trim())) {
            const unitNow = KEYWORDS.has(unit) ? (units.find((u) => !KEYWORDS.has(u)) ?? "px") : unit;
            onChange(`${next.trim()}${unitNow}`);
          }
        }}
        onBlur={commit}
        onKeyDown={onKeyDown}
        placeholder={field.mixed ? "Mixed" : placeholder}
        id={inputId}
        aria-labelledby={suffix ? `${nameId} ${suffixId}` : nameId}
        // `.bdi-fld input.auto` keys off a class on the real <input>; flowbite
        // puts `className` on the wrapper, so it goes through `theme`.
        theme={{ field: { input: { base: isKeyword ? "auto" : "" } } }}
        readOnly={field.readOnly}
        aria-readonly={field.readOnly || undefined}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
      />
      {isKeyword ? null : (
        <>
          {/* Pointer shortcut for ↑ / ↓ on the field itself (the keyboard
              path, which also takes Shift for 10). Not a separate control. */}
          <span className="bdi-step" aria-hidden="true">
            <span onMouseDown={(e) => e.preventDefault()} onClick={() => step(1)}>
              <ChevronUp size={8} />
            </span>
            <span onMouseDown={(e) => e.preventDefault()} onClick={() => step(-1)}>
              <ChevronDown size={8} />
            </span>
          </span>
          {noUnit ? null : (
          <span className="bdi-unit">
            <Select
              className="bdi-u"
              theme={BK_SELECT_BARE_UNIT_THEME}
              value={unit}
              onChange={(e) => onUnitChange(e.target.value)}
              aria-readonly={field.readOnly || undefined}
              aria-label={`${name} unit`}
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u === "" ? "×" : u}
                </option>
              ))}
            </Select>
            <ChevronDown size={12} aria-hidden="true" className="bdi-c" />
          </span>
          )}
        </>
      )}
    </div>
  );

  /* An unlabelled field takes the whole row (paired fields). Its override
     dot sits in front of the field — with no label there is nowhere else. */
  return (
    <div
      data-testid={label ? rowTestId(label) : undefined}
      className={`bdi-row-ctrl${label ? "" : " bare"}`}
    >
      {label ? (
        <label className="bdi-lb" data-testid={labelTestId(label)} htmlFor={inputId}>
          <span id={ownName ? undefined : nameId}>{label}</span>
          <FieldDot field={field} />
        </label>
      ) : null}
      <div className="bdi-row-content">
        {label ? null : <FieldDot field={field} />}
        {ownName ? (
          <span id={nameId} hidden>
            {name}
          </span>
        ) : null}
        {suffix ? (
          <span id={suffixId} hidden>
            {suffix}
          </span>
        ) : null}
        {control}
      </div>
      <ErrorLine id={errorId} message={invalid ? NUMBER_ERROR : null} />
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
  /** The blank first option's text. `null` = no blank option: only the real
   *  choices are offered (a type block's "When done", a component variant). */
  placeholder?: string | null;
  /** The CSS property this row edits — the field context reads read-only,
   *  "Mixed" and its override dot by it (InspectorFieldContext). */
  property?: string;
}

export const SelectRow: React.FC<SelectRowProps> = ({
  label,
  value,
  onChange,
  options,
  isOverridden,
  helperText,
  placeholder = "Default",
  property,
}) => {
  const field = useInspectorField(property);
  /* The label sat beside the <select> with nothing tying them together, so
     six selects in the inspector announced no name at all — a screen reader
     read the option list and never what it was choosing. */
  const id = React.useId();
  return (
    <div className="bdi-row-ctrl" data-testid={rowTestId(label)}>
      <label className="bdi-lb" data-testid={labelTestId(label)} htmlFor={id}>
        {label}
        {isOverridden && <OverrideDot />}
        <FieldDot field={field} />
        {helperText && <HelperIcon text={helperText} />}
      </label>
      <div className="bdi-row-content">
        <div className={`bdi-ddn${field.mixed ? " mixed" : ""}`} data-testid={fieldTestId(label)}>
          <Select
            id={id}
            /* Read-only is not disabled (DD-18): the value stays legible and
               focusable; a change is refused. */
            aria-readonly={field.readOnly || undefined}
            aria-label={field.mixed ? mixedName(label) : undefined}
            className="bdi-v"
            theme={BK_SELECT_BARE_VALUE_THEME}
            value={field.mixed ? "" : value}
            onChange={(e) => {
              if (!field.readOnly) onChange(e.target.value);
            }}
          >
            {field.mixed ? (
              <option value="" disabled>
                Mixed
              </option>
            ) : placeholder === null ? null : (
              <option value="">{placeholder}</option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <ChevronDown size={12} aria-hidden="true" className="bdi-c" />
        </div>
      </div>
    </div>
  );
};
