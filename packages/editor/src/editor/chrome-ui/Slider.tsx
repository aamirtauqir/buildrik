/**
 * Slider — Figma component set 92:30 (track 4px, knob 14→16 dragging,
 * mono value field 46×26). Composes flowbite-react's `RangeSlider` for the
 * range-input semantics (focus, keyboard, native drag) with a plain raw
 * number input for the value readout (keyboard entry) — `editor/ui/` is
 * the sanctioned Gate-24 owner of native elements, so the number input
 * stays here directly rather than routing through `chrome-ui/TextField`.
 *
 * flowbite's `RangeSlider` renders only a bare unfilled track (`bg-gray-200`,
 * no accent-fill styling, no numeric field, no unit suffix) — none of that
 * exists in the library, so the Figma look (accent fill bar driven by a
 * `--bk-slider-fill` percentage custom property, drag-grow thumb, mono
 * number field) is reproduced via `./slider.css`, a plain **unlayered**
 * stylesheet imported directly here (not routed through `themes/default.css`'s
 * `@layer` chain) — same precedent as `layers-v2.css`/`inspector.css`:
 * unlayered rules win over flowbite's `tw-utilities`-layer defaults
 * regardless of specificity, so `bg-gray-200`/`h-2`/`rounded-lg` etc. are
 * safely overridden without fighting tailwind-merge. `className` reaches
 * flowbite's OUTER wrapper div only; the actual `<input type="range">`
 * needs its class supplied via the `theme.field.input.base` prop instead
 * (same structural gap as `TextInput`/`Select`).
 * @license BSD-3-Clause
 */
import React from "react";
import { RangeSlider } from "flowbite-react";
import "./slider.css";

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** Accessible name; also used for the field's aria-label. */
  label?: string;
  /** Unit suffix shown in the numeric field (e.g. "%"). */
  unit?: string;
  /** Hide the numeric field (Figma shows it by default). */
  withField?: boolean;
  id?: string;
  className?: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(function Slider(
  { value, onChange, min = 0, max = 100, step = 1, disabled = false, label, unit, withField = true, id, className },
  ref,
) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div className={["bk-slider", disabled ? "bk-slider--disabled" : "", className].filter(Boolean).join(" ")}>
      <RangeSlider
        ref={ref}
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={label}
        style={{ ["--bk-slider-fill" as string]: `${pct}%` }}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        theme={{ field: { input: { base: "bk-slider__range" } } }}
      />
      {withField && (
        <span className="bk-slider__field">
          <input
            type="number"
            className="bk-slider__num"
            value={value}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            aria-label={label ? `${label} value` : "Value"}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) onChange(clamp(n));
            }}
          />
          {unit && <span className="bk-slider__unit">{unit}</span>}
        </span>
      )}
    </div>
  );
});
