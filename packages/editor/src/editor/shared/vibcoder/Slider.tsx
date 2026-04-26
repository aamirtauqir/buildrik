/**
 * Vibcoder Slider wrapper.
 * Renders the `bd-slider` composite from src/themes/components/atoms/slider.css:
 *   <div class="bd-slider">
 *     <div class="bd-slider__head"> (only when label is set)
 *       <span class="bd-slider__label">{label}</span>
 *       <span class="bd-slider__value">{value}<span class="bd-slider__value-unit">{unit}</span></span>
 *     </div>
 *     <div class="bd-slider__track">
 *       <div class="bd-slider__fill" style="width: {percent}%" />
 *       <div class="bd-slider__thumb" style="left: {percent}%" />
 *       <input type="range" ... />  (visually hidden, drives a11y + keyboard)
 *     </div>
 *   </div>
 *
 * Variant union from `vibcoder-variants.mjs atoms/slider`:
 *   (no .bd-X--Y modifier classes — purely composite BEM children)
 *
 * Vendored CSS styles ONLY the div composite — no `input[type=range]` rules.
 * The native input is absolute-positioned over the track and made fully
 * transparent so it owns keyboard + screen-reader behavior while the styled
 * divs own visuals. Track height is 4px; the input's hit-area spans the full
 * track width and a generous vertical pad so pointer interactions feel right.
 *
 * Always controlled — `value` + `onChange` are required. Range slider state
 * lives in the parent (drag-to-update is the entire reason callers reach for
 * a slider).
 *
 * forwardRef targets the `<input>` (focus management consumer needs the
 * native element, not the wrapper div).
 *
 * @license BSD-3-Clause
 */
import { type CSSProperties, type InputHTMLAttributes, forwardRef } from "react";

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "min" | "max" | "step"> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Optional head row label. When undefined, the head row is omitted. */
  label?: string;
  /** Optional unit suffix (e.g. "%", "px") rendered next to value. */
  unit?: string;
}

const inputOverlayStyle: CSSProperties = {
  position: "absolute",
  // Expand hit area vertically beyond the 4px track so dragging feels right.
  top: -8,
  left: 0,
  right: 0,
  width: "100%",
  height: 20,
  margin: 0,
  padding: 0,
  opacity: 0,
  cursor: "pointer",
};

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ value, onChange, min = 0, max = 100, step = 1, label, unit, className, ...rest }, ref) => {
    const range = max - min;
    // Guard against NaN / ±Infinity propagating into the percent computation
    // (would emit `width: NaN%` styles and `aria-valuenow="NaN"`). Parity with
    // Progress.tsx's NaN guard. Falls back to `min` (not 0) because Slider has
    // arbitrary min/max range — `min` is the safe in-range floor.
    const safeValue = Number.isFinite(value) ? value : min;
    // Clamp to [0, 100] so out-of-range values can't overflow the visual track.
    // Native input clamps internally for keyboard input but the styled divs
    // render the raw computed percent — guard against state-lag during step
    // transitions or external writes that overshoot bounds.
    const rawPercent = range > 0 ? ((safeValue - min) / range) * 100 : 0;
    const percent = Math.max(0, Math.min(100, rawPercent));
    const classes = ["bd-slider", className].filter(Boolean).join(" ");
    return (
      <div className={classes}>
        {label !== undefined && (
          <div className="bd-slider__head">
            <span className="bd-slider__label">{label}</span>
            <span className="bd-slider__value">
              {safeValue}
              {unit && <span className="bd-slider__value-unit">{unit}</span>}
            </span>
          </div>
        )}
        <div className="bd-slider__track">
          <div className="bd-slider__fill" style={{ width: `${percent}%` }} />
          <div className="bd-slider__thumb" style={{ left: `${percent}%` }} />
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={safeValue}
            onChange={(e) => onChange(Number(e.target.value))}
            style={inputOverlayStyle}
            {...rest}
          />
        </div>
      </div>
    );
  }
);
Slider.displayName = "Slider";
