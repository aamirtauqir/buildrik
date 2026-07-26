/**
 * Vibcoder NumericStepper wrapper.
 * Renders the `bd-stepper` composite from src/themes/components/atoms/input.css:
 *   <div class="bd-stepper">
 *     <button class="bd-stepper__btn">−</button>
 *     <input class="bd-stepper__input" />
 *     <button class="bd-stepper__btn">+</button>
 *     <span class="bd-stepper__unit">{unit}</span>  (only when unit is set)
 *   </div>
 *
 * Always controlled — `value` + `onChange` are required.
 * Keyboard: ArrowUp/ArrowDown increment/decrement (Shift+Arrow = 10× step).
 * min/max clamp both pointer + keyboard interactions.
 *
 * forwardRef targets the `<input>` (focus + measurement consumer needs the
 * native element, not the stepper container).
 *
 * @license BSD-3-Clause
 */
import {
  type CSSProperties,
  type InputHTMLAttributes,
  forwardRef,
  useCallback,
  useEffect,
  useState,
} from "react";

export interface NumericStepperProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type" | "min" | "max" | "step"
  > {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Optional unit suffix rendered in a left-bordered cell (display only). */
  unit?: string;
  error?: boolean;
}

export const NumericStepper = forwardRef<HTMLInputElement, NumericStepperProps>(
  (
    {
      value,
      onChange,
      min,
      max,
      step = 1,
      unit,
      error = false,
      disabled,
      className,
      style,
      onKeyDown,
      ...rest
    },
    ref,
  ) => {
    const [localValue, setLocalValue] = useState(String(value));

    useEffect(() => {
      setLocalValue(String(value));
    }, [value]);

    const clamp = useCallback(
      (n: number) => {
        if (min !== undefined && n < min) return min;
        if (max !== undefined && n > max) return max;
        return n;
      },
      [min, max],
    );

    const canDecrement = !(disabled || (min !== undefined && value <= min));
    const canIncrement = !(disabled || (max !== undefined && value >= max));

    const decrement = useCallback(
      (multiplier = 1) => {
        if (!canDecrement) return;
        onChange(clamp(value - step * multiplier));
      },
      [canDecrement, clamp, onChange, step, value],
    );

    const increment = useCallback(
      (multiplier = 1) => {
        if (!canIncrement) return;
        onChange(clamp(value + step * multiplier));
      },
      [canIncrement, clamp, onChange, step, value],
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setLocalValue(raw);
      const num = parseFloat(raw);
      if (!Number.isNaN(num)) {
        onChange(clamp(num));
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      const multiplier = e.shiftKey ? 10 : 1;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        increment(multiplier);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        decrement(multiplier);
      }
    };

    const stepperClasses = [
      "bd-stepper",
      error && "bd-stepper--error",
      disabled && "is-disabled",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const wrapperStyle: CSSProperties = {
      ...(error
        ? { borderColor: "var(--bk-error)" }
        : null),
      ...(disabled
        ? { opacity: 0.5, pointerEvents: "none" }
        : null),
      ...style,
    };

    return (
      <div className={stepperClasses} style={wrapperStyle}>
        <button
          type="button"
          className="bd-stepper__btn"
          onClick={() => decrement(1)}
          disabled={!canDecrement}
          aria-label="Decrease value"
          tabIndex={-1}
        >
          −
        </button>
        <input
          {...rest}
          ref={ref}
          type="text"
          inputMode="decimal"
          className="bd-stepper__input"
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-invalid={error || undefined}
        />
        <button
          type="button"
          className="bd-stepper__btn"
          onClick={() => increment(1)}
          disabled={!canIncrement}
          aria-label="Increase value"
          tabIndex={-1}
        >
          +
        </button>
        {unit && <span className="bd-stepper__unit">{unit}</span>}
      </div>
    );
  },
);
NumericStepper.displayName = "NumericStepper";
