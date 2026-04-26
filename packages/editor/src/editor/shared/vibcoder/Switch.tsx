/**
 * Vibcoder Switch wrapper.
 * Renders the `bd-switch` composite from src/themes/components/atoms/switch.css:
 *   <button role="switch" class="bd-switch" aria-checked={checked}>
 *     <span class="bd-switch__track">
 *       <span class="bd-switch__thumb" />
 *     </span>
 *   </button>
 *
 * Variant + state union from `vibcoder-variants.mjs atoms/switch`:
 *   variants: off    — alternative to `aria-checked="false"`; we use aria semantics
 *                       (CSS targets `.bd-switch[aria-checked="false"]` + `--off` —
 *                       both produce the same off-state styling). Wrapper does NOT
 *                       emit `--off` modifier; aria-checked drives state.
 *   states: disabled — vendored CSS targets `[aria-disabled="true"]`, `[disabled]`,
 *                       AND `--disabled`. Native `disabled` attr is the canonical
 *                       expression; wrapper sets it directly.
 *
 * NO size variants in vendored CSS.
 *
 * Always controlled — `checked` is required. Switches are simple enough that
 * uncontrolled variants don't add value (aligns with shadcn/Radix patterns).
 *
 * forwardRef targets the `<button>` (focusable element, focus management
 * consumer needs the button itself).
 *
 * @license BSD-3-Clause
 */
import { type ButtonHTMLAttributes, forwardRef } from "react";

export interface SwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "type"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, disabled, className, onClick, ...rest }, ref) => {
    const classes = ["bd-switch", className].filter(Boolean).join(" ");
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        className={classes}
        onClick={(e) => {
          onClick?.(e);
          if (!disabled && !e.defaultPrevented) onCheckedChange?.(!checked);
        }}
        {...rest}
      >
        <span className="bd-switch__track">
          <span className="bd-switch__thumb" />
        </span>
      </button>
    );
  }
);
Switch.displayName = "Switch";
