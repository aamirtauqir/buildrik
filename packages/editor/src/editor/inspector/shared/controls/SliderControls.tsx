/**
 * Slider Controls — SliderInput, RangeSlider. Ported to .bdi-row-ctrl with
 * numeric value display on the right.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { TextInput } from "@/editor/chrome-ui";
import { useInspectorField, mixedName } from "./InspectorFieldContext";
// ============================================================================
// SLIDER INPUT
// ============================================================================

export interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  /** Renders an editable number field instead of the printed value, named
   *  by this label (Effects OPACITY, board 4428:142686, draws [100]). */
  fieldLabel?: string;
  /** The CSS property it edits — "Mixed" and read-only come from the field context. */
  property?: string;
}

const sliderStyle: React.CSSProperties = {
  flex: 1,
  height: 4,
  background: "var(--bk-border-medium, var(--bk-border-medium))",
  borderRadius: 2,
  appearance: "none",
  cursor: "pointer",
};

export const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  fieldLabel,
  property,
}) => {
  const field = useInspectorField(property);
  /* The row printed its label and never tied it to the control, so every
     slider in the inspector announced itself as an unnamed "slider" — 8 of
     them, measured in the running editor. `htmlFor` also makes the visible
     label a click target, which a bare <label> never was. */
  const id = React.useId();
  return (
    <div className="bdi-row-ctrl">
      <label className="bdi-lb" htmlFor={id}>{label}</label>
      <div className="bdi-row-content">
        <TextInput
          id={id}
          type="range"
          value={value}
          aria-label={field.mixed ? mixedName(label) : undefined}
          aria-valuetext={field.mixed ? "Mixed" : undefined}
          aria-readonly={field.readOnly || undefined}
          onChange={(e) => {
            if (!field.readOnly) onChange(Number(e.target.value));
          }}
          min={min}
          max={max}
          step={step}
          style={sliderStyle}
        />
        {fieldLabel ? (
          <TextInput
            type="number"
            aria-label={field.mixed ? mixedName(fieldLabel) : fieldLabel}
            className="tw:w-14 tw:flex-none"
            sizing="sm"
            readOnly={field.readOnly}
            placeholder={field.mixed ? "Mixed" : undefined}
            value={field.mixed ? "" : value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const n = Number(e.target.value);
              field.startTyping();
              if (e.target.value !== "" && Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
            }}
            onBlur={field.stopTyping}
          />
        ) : (
          <span
            style={{
              font: "500 11px var(--bk-font-ui)",
              color: "var(--bk-ink-muted)",
              minWidth: 32,
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {field.mixed ? "Mixed" : `${value}${unit}`}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// RANGE SLIDER
// ============================================================================

export interface RangeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  labelWidth?: number;
  valueWidth?: number;
  /** The CSS property it edits — "Mixed" and read-only come from the field context. */
  property?: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  property,
}) => {
  const field = useInspectorField(property);
  /* The row printed its label and never tied it to the control, so every
     slider in the inspector announced itself as an unnamed "slider" — 8 of
     them, measured in the running editor. `htmlFor` also makes the visible
     label a click target, which a bare <label> never was. */
  const id = React.useId();
  /* 2L9 36:2 (Effects specimen): a value box beside the slider, the unit
     after it — typed values commit on Enter or blur, clamped to the range. */
  const [draft, setDraft] = React.useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const n = parseFloat(draft);
    setDraft(null);
    if (!field.readOnly && Number.isFinite(n) && n !== value) onChange(Math.max(min, Math.min(max, n)));
  };
  return (
    <div className="bdi-row-ctrl">
      <label className="bdi-lb" htmlFor={id}>{label}</label>
      <div className="bdi-row-content tw:gap-2">
        <TextInput
          id={id}
          type="range"
          value={value}
          aria-label={field.mixed ? mixedName(label) : undefined}
          aria-valuetext={field.mixed ? "Mixed" : undefined}
          aria-readonly={field.readOnly || undefined}
          onChange={(e) => {
            if (!field.readOnly) onChange(Number(e.target.value));
          }}
          min={min}
          max={max}
          step={step}
          style={sliderStyle}
        />
        <TextInput
          sizing="sm"
          inputMode="decimal"
          aria-label={`${label} value`}
          aria-readonly={field.readOnly || undefined}
          className="tw:w-11 tw:shrink-0"
          value={draft ?? (field.mixed ? "" : String(value))}
          placeholder={field.mixed ? "Mixed" : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            else if (e.key === "Escape") setDraft(null);
          }}
          data-testid={`inspector-slider-value-${label.toLowerCase()}`}
        />
        <span className="tw:w-4 tw:shrink-0 tw:text-[11px] tw:text-[var(--bk-ink-muted)]" aria-hidden="true">
          {unit}
        </span>
      </div>
    </div>
  );
};
