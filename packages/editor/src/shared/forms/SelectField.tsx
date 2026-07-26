/**
 * SelectField — labelled select wrapper.
 * Internal: composes vibcoder <FormField> + <Select>.
 * Bare path (no label/error/hint) renders just <Select>.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Select, FormField } from "@/editor/shared/vibcoder";

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
  id?: string;
  className?: string;
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
  id,
  className,
}) => {
  const generatedId = React.useId();
  const selectId = id || generatedId;

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

  const selectEl = (
    <Select
      id={selectId}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      error={!!error}
      style={{ color: value ? undefined : "var(--bk-ink-muted)" }}
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
    </Select>
  );

  if (!label && !error && !hint) {
    return className ? <div className={className}>{selectEl}</div> : selectEl;
  }

  return (
    <FormField
      label={label ?? ""}
      htmlFor={selectId}
      error={error}
      helper={hint}
      disabled={disabled}
      className={className}
    >
      {selectEl}
    </FormField>
  );
};

export default SelectField;
