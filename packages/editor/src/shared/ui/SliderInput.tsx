// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled SliderInput.
/**
 * Adapter shim — translates legacy SliderInput API to vibcoder Slider.
 *
 * Filename preserved as `SliderInput.tsx` (not `Slider.tsx`) so existing
 * consumers and barrel re-exports keep importing from the same path.
 *
 * Prop translations (Phase 4 Q4 mapping):
 *   value:    passthrough (required number)
 *   onChange: passthrough (vibcoder fires (next: number))
 *   min / max / step: passthrough
 *   unit / label: passthrough
 *   disabled: applied two ways:
 *               (1) inline `pointerEvents: none` + `opacity: 0.5` on the
 *                   outer wrapper for visual + click-blocking effect, and
 *               (2) forwarded explicitly to the vibcoder Slider — the
 *                   typed interface omits `disabled`, but the prop flows
 *                   through to the underlying `<input type="range">` so
 *                   keyboard focus + change handlers respect it. Confirmed
 *                   by Slider.adapter.test.tsx.
 *   className / style: composed onto the vibcoder wrapper. Disabled
 *             style merges with caller-supplied style (caller wins on
 *             same-key conflicts).
 *
 * Untranslatable: legacy SliderInput supported double-click-to-edit and
 * drag-the-track to scrub. Vibcoder Slider is keyboard + range-input
 * only. This is a known visual/interaction delta tracked in the plan;
 * production consumers (the SliderInput in
 * editor/inspector/shared/controls is a SEPARATE component, NOT this
 * shim) are unaffected. Phase 5 cleanup: drop the shim entirely.
 *
 * @license BSD-3-Clause
 */
import { forwardRef, type CSSProperties, type InputHTMLAttributes } from "react";
import { Slider as VibcoderSlider } from "@/editor/shared/vibcoder";

export interface SliderInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "min" | "max" | "step"> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
  className?: string;
  style?: CSSProperties;
}

export const SliderInput = forwardRef<HTMLInputElement, SliderInputProps>(
  (
    { value, onChange, min = 0, max = 100, step = 1, unit, label, disabled = false, className, style, ...rest },
    ref,
  ) => {
    const composedStyle: CSSProperties | undefined = disabled
      ? { pointerEvents: "none", opacity: 0.5, ...style }
      : style;
    return (
      <div className={className} style={composedStyle}>
        <VibcoderSlider
          ref={ref}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          label={label}
          unit={unit}
          disabled={disabled}
          {...rest}
        />
      </div>
    );
  },
);
SliderInput.displayName = "SliderInput";

export default SliderInput;
